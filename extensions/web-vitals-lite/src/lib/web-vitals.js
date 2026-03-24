/**
 * Web Vitals Lite — Core metrics collection using browser Performance APIs.
 * No external dependencies. Collects LCP, CLS, and INP.
 *
 * Exposes a global `WebVitalsLite` object with methods to observe metrics.
 * Content scripts cannot use ES modules, so this uses an IIFE.
 */
var WebVitalsLite = (function () {
  'use strict';

  /* ── Thresholds ────────────────────────────────────────────── */

  var THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },   // milliseconds
    CLS: { good: 0.1,  poor: 0.25 },   // unitless
    INP: { good: 200,  poor: 500 }     // milliseconds
  };

  /**
   * Returns 'good', 'needs-improvement', or 'poor' for a given metric value.
   */
  function getRating(metric, value) {
    var t = THRESHOLDS[metric];
    if (value <= t.good) return 'good';
    if (value <= t.poor) return 'needs-improvement';
    return 'poor';
  }

  /* ── LCP (Largest Contentful Paint) ────────────────────────── */

  /**
   * Observes largest-contentful-paint entries.
   * Calls `callback({ name, value, rating })` whenever a new LCP is reported.
   * LCP is finalized when the page is hidden (user navigates away / switches tab).
   */
  function observeLCP(callback) {
    if (!PerformanceObserver || !PerformanceObserver.supportedEntryTypes ||
        PerformanceObserver.supportedEntryTypes.indexOf('largest-contentful-paint') === -1) {
      return;
    }

    var lastValue = 0;

    var observer = new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      // The last entry is the largest contentful paint so far
      var entry = entries[entries.length - 1];
      lastValue = entry.startTime;
      callback({
        name: 'LCP',
        value: lastValue,
        rating: getRating('LCP', lastValue)
      });
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    // LCP should stop being reported after user input or page hide
    // visibilitychange handles tab switches; we report the final value
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && lastValue > 0) {
        callback({
          name: 'LCP',
          value: lastValue,
          rating: getRating('LCP', lastValue)
        });
      }
    }, { once: true });
  }

  /* ── CLS (Cumulative Layout Shift) ─────────────────────────── */

  /**
   * Observes layout-shift entries (without recent input).
   * Uses session windows: shifts within 1s of each other and max 5s window
   * are grouped. The largest session window is the CLS value.
   * Calls `callback({ name, value, rating })` on each update.
   */
  function observeCLS(callback) {
    if (!PerformanceObserver || !PerformanceObserver.supportedEntryTypes ||
        PerformanceObserver.supportedEntryTypes.indexOf('layout-shift') === -1) {
      return;
    }

    var sessionValue = 0;
    var sessionEntries = [];
    var maxSessionValue = 0;

    var observer = new PerformanceObserver(function (list) {
      var entries = list.getEntries();

      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];

        // Only count shifts without recent user input
        if (entry.hadRecentInput) continue;

        var lastEntry = sessionEntries[sessionEntries.length - 1];

        // Start a new session window if gap > 1s or window > 5s
        if (sessionEntries.length > 0 &&
            (entry.startTime - lastEntry.startTime > 1000 ||
             entry.startTime - sessionEntries[0].startTime > 5000)) {
          sessionValue = 0;
          sessionEntries = [];
        }

        sessionEntries.push(entry);
        sessionValue += entry.value;

        // Track the largest session window
        if (sessionValue > maxSessionValue) {
          maxSessionValue = sessionValue;
          callback({
            name: 'CLS',
            value: maxSessionValue,
            rating: getRating('CLS', maxSessionValue)
          });
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  }

  /* ── INP (Interaction to Next Paint) ───────────────────────── */

  /**
   * Observes event timing entries to compute INP.
   * INP is the longest interaction duration (excluding the worst if 50+ interactions).
   * Calls `callback({ name, value, rating })` on each update.
   */
  function observeINP(callback) {
    if (!PerformanceObserver || !PerformanceObserver.supportedEntryTypes ||
        PerformanceObserver.supportedEntryTypes.indexOf('event') === -1) {
      return;
    }

    // Map of interaction IDs to their longest duration
    var interactionMap = {};
    var longestDurations = [];

    /**
     * Recalculates INP from the collected interactions.
     * INP = the p98 worst interaction (approximated as the worst,
     * or second-worst if there are 50+ interactions).
     */
    function computeINP() {
      // Gather all interaction max durations
      longestDurations = [];
      for (var id in interactionMap) {
        if (interactionMap.hasOwnProperty(id)) {
          longestDurations.push(interactionMap[id]);
        }
      }

      if (longestDurations.length === 0) return;

      // Sort descending
      longestDurations.sort(function (a, b) { return b - a; });

      // Pick the p98 value: for < 50 interactions use worst, otherwise skip the worst
      var index = Math.min(
        longestDurations.length - 1,
        Math.floor(longestDurations.length / 50)
      );
      var inp = longestDurations[index];

      callback({
        name: 'INP',
        value: inp,
        rating: getRating('INP', inp)
      });
    }

    var observer = new PerformanceObserver(function (list) {
      var entries = list.getEntries();

      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];

        // Only track entries with an interactionId (real user interactions)
        if (!entry.interactionId || entry.interactionId === 0) continue;

        var id = entry.interactionId;
        var duration = entry.duration;

        // Keep the longest duration for each interaction
        if (!interactionMap[id] || duration > interactionMap[id]) {
          interactionMap[id] = duration;
        }
      }

      computeINP();
    });

    // durationThreshold of 16 captures more interactions for accuracy
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  }

  /* ── Public API ────────────────────────────────────────────── */

  return {
    THRESHOLDS: THRESHOLDS,
    getRating: getRating,
    observeLCP: observeLCP,
    observeCLS: observeCLS,
    observeINP: observeINP
  };
})();
