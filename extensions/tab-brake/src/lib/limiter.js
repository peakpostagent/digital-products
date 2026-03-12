/**
 * Tab Brake — Core tab limiting logic
 *
 * Exposes pure functions under the global TabBrake namespace.
 * No side-effects, no Chrome API calls — easy to test.
 */

var TabBrake = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Enforcement                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Returns true when opening another tab would exceed the limit.
   * @param {number} currentCount — tabs open right now
   * @param {number} maxTabs      — user-configured limit
   * @returns {boolean}
   */
  function shouldBlock(currentCount, maxTabs) {
    if (typeof currentCount !== 'number' || typeof maxTabs !== 'number') {
      return false;
    }
    if (maxTabs <= 0) return false;
    return currentCount > maxTabs;
  }

  /* ------------------------------------------------------------------ */
  /*  History helpers                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Append a snapshot to the history array.
   * @param {Array}  history   — existing snapshots
   * @param {number} tabCount  — number of tabs at this moment
   * @param {number} timestamp — Date.now() value
   * @returns {Array} updated history (new reference)
   */
  function recordSnapshot(history, tabCount, timestamp) {
    var list = Array.isArray(history) ? history.slice() : [];
    if (typeof tabCount !== 'number' || typeof timestamp !== 'number') {
      return list;
    }
    list.push({ tabCount: tabCount, timestamp: timestamp });
    return list;
  }

  /**
   * Remove entries older than maxAgeDays.
   * @param {Array}  history    — snapshot list
   * @param {number} [maxAgeDays=30]
   * @returns {Array} filtered history (new reference)
   */
  function cleanHistory(history, maxAgeDays) {
    if (!Array.isArray(history)) return [];
    var days = typeof maxAgeDays === 'number' && maxAgeDays > 0 ? maxAgeDays : 30;
    var cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter(function (entry) {
      return entry && typeof entry.timestamp === 'number' && entry.timestamp >= cutoff;
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Stats                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Derive aggregate stats from the history array.
   * @param {Array} history — snapshot list
   * @returns {{ avgTabs: number, peakTabs: number, timesBlocked: number, timesOverridden: number }}
   */
  function getTabStats(history) {
    var defaults = { avgTabs: 0, peakTabs: 0, timesBlocked: 0, timesOverridden: 0 };
    if (!Array.isArray(history) || history.length === 0) return defaults;

    var sum = 0;
    var peak = 0;
    var blocked = 0;
    var overridden = 0;

    for (var i = 0; i < history.length; i++) {
      var entry = history[i];
      if (!entry) continue;

      var count = typeof entry.tabCount === 'number' ? entry.tabCount : 0;
      sum += count;
      if (count > peak) peak = count;
      if (entry.blocked) blocked++;
      if (entry.overridden) overridden++;
    }

    return {
      avgTabs: Math.round((sum / history.length) * 10) / 10,
      peakTabs: peak,
      timesBlocked: blocked,
      timesOverridden: overridden,
    };
  }

  /**
   * Get hourly average tab counts for the last N hours.
   * @param {Array}  history
   * @param {number} hours — how many hours to look back (default 24)
   * @returns {Array<{ hour: string, avgCount: number }>}
   */
  function getHourlyAverage(history, hours) {
    if (!Array.isArray(history) || history.length === 0) return [];
    var h = typeof hours === 'number' && hours > 0 ? hours : 24;
    var now = Date.now();
    var cutoff = now - h * 60 * 60 * 1000;

    // Bucket by hour string "YYYY-MM-DD HH"
    var buckets = {};
    var order = [];

    for (var i = 0; i < history.length; i++) {
      var entry = history[i];
      if (!entry || entry.timestamp < cutoff) continue;

      var d = new Date(entry.timestamp);
      var key =
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0') +
        ' ' +
        String(d.getHours()).padStart(2, '0');

      if (!buckets[key]) {
        buckets[key] = { sum: 0, count: 0 };
        order.push(key);
      }
      buckets[key].sum += typeof entry.tabCount === 'number' ? entry.tabCount : 0;
      buckets[key].count++;
    }

    return order.map(function (key) {
      return {
        hour: key,
        avgCount: Math.round((buckets[key].sum / buckets[key].count) * 10) / 10,
      };
    });
  }

  /**
   * Get daily average tab counts for the last N days.
   * @param {Array}  history
   * @param {number} days — how many days to look back (default 7)
   * @returns {Array<{ date: string, avgCount: number }>}
   */
  function getDailyAverage(history, days) {
    if (!Array.isArray(history) || history.length === 0) return [];
    var d = typeof days === 'number' && days > 0 ? days : 7;
    var now = Date.now();
    var cutoff = now - d * 24 * 60 * 60 * 1000;

    var buckets = {};
    var order = [];

    for (var i = 0; i < history.length; i++) {
      var entry = history[i];
      if (!entry || entry.timestamp < cutoff) continue;

      var dt = new Date(entry.timestamp);
      var key =
        dt.getFullYear() +
        '-' +
        String(dt.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(dt.getDate()).padStart(2, '0');

      if (!buckets[key]) {
        buckets[key] = { sum: 0, count: 0 };
        order.push(key);
      }
      buckets[key].sum += typeof entry.tabCount === 'number' ? entry.tabCount : 0;
      buckets[key].count++;
    }

    return order.map(function (key) {
      return {
        date: key,
        avgCount: Math.round((buckets[key].sum / buckets[key].count) * 10) / 10,
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Formatting                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Human-readable tab count string.
   * @param {number} count
   * @param {number} max
   * @returns {string} e.g. "5 / 8 tabs"
   */
  function formatTabCount(count, max) {
    var c = typeof count === 'number' ? count : 0;
    var m = typeof max === 'number' ? max : 0;
    return c + ' / ' + m + ' tabs';
  }

  /**
   * Usage as a percentage (0-100), clamped.
   * @param {number} count
   * @param {number} max
   * @returns {number}
   */
  function getUsagePercent(count, max) {
    if (typeof count !== 'number' || typeof max !== 'number' || max <= 0) {
      return 0;
    }
    var pct = (count / max) * 100;
    return Math.min(Math.max(Math.round(pct), 0), 100);
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  return {
    shouldBlock: shouldBlock,
    getTabStats: getTabStats,
    recordSnapshot: recordSnapshot,
    getHourlyAverage: getHourlyAverage,
    getDailyAverage: getDailyAverage,
    formatTabCount: formatTabCount,
    getUsagePercent: getUsagePercent,
    cleanHistory: cleanHistory,
  };
})();

// Make available in Node/test environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabBrake;
}
