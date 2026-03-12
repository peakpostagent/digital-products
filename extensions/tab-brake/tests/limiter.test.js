/**
 * Tab Brake — Comprehensive tests for limiter.js
 *
 * Uses Vitest with jsdom environment.
 * Covers all eight public functions plus edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// limiter.js attaches to `globalThis.TabBrake` via the IIFE,
// and also exports via module.exports for Node.
const TabBrake = require('../src/lib/limiter.js');

/* ================================================================== */
/*  shouldBlock                                                        */
/* ================================================================== */

describe('shouldBlock', () => {
  it('returns false when count is under the limit', () => {
    expect(TabBrake.shouldBlock(5, 8)).toBe(false);
  });

  it('returns false when count equals the limit exactly', () => {
    expect(TabBrake.shouldBlock(8, 8)).toBe(false);
  });

  it('returns true when count exceeds the limit by 1', () => {
    expect(TabBrake.shouldBlock(9, 8)).toBe(true);
  });

  it('returns true when count far exceeds the limit', () => {
    expect(TabBrake.shouldBlock(50, 8)).toBe(true);
  });

  it('returns false when count is 0', () => {
    expect(TabBrake.shouldBlock(0, 8)).toBe(false);
  });

  it('returns false when count is 1 and limit is 1', () => {
    expect(TabBrake.shouldBlock(1, 1)).toBe(false);
  });

  it('returns true when count is 2 and limit is 1', () => {
    expect(TabBrake.shouldBlock(2, 1)).toBe(true);
  });

  it('returns false when limit is 0 (no blocking with zero limit)', () => {
    expect(TabBrake.shouldBlock(5, 0)).toBe(false);
  });

  it('returns false for negative limit', () => {
    expect(TabBrake.shouldBlock(5, -1)).toBe(false);
  });

  it('returns false for non-number currentCount', () => {
    expect(TabBrake.shouldBlock('5', 8)).toBe(false);
  });

  it('returns false for non-number maxTabs', () => {
    expect(TabBrake.shouldBlock(5, '8')).toBe(false);
  });

  it('returns false for undefined arguments', () => {
    expect(TabBrake.shouldBlock(undefined, undefined)).toBe(false);
  });

  it('returns false for null arguments', () => {
    expect(TabBrake.shouldBlock(null, null)).toBe(false);
  });
});

/* ================================================================== */
/*  recordSnapshot                                                     */
/* ================================================================== */

describe('recordSnapshot', () => {
  it('adds an entry to an empty history', () => {
    var result = TabBrake.recordSnapshot([], 5, 1000);
    expect(result).toEqual([{ tabCount: 5, timestamp: 1000 }]);
  });

  it('appends to existing history', () => {
    var existing = [{ tabCount: 3, timestamp: 500 }];
    var result = TabBrake.recordSnapshot(existing, 7, 1000);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ tabCount: 7, timestamp: 1000 });
  });

  it('does not mutate the original array', () => {
    var original = [{ tabCount: 3, timestamp: 500 }];
    var result = TabBrake.recordSnapshot(original, 7, 1000);
    expect(original).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it('handles null history gracefully', () => {
    var result = TabBrake.recordSnapshot(null, 5, 1000);
    expect(result).toEqual([{ tabCount: 5, timestamp: 1000 }]);
  });

  it('handles undefined history gracefully', () => {
    var result = TabBrake.recordSnapshot(undefined, 5, 1000);
    expect(result).toEqual([{ tabCount: 5, timestamp: 1000 }]);
  });

  it('returns unchanged history for non-number tabCount', () => {
    var result = TabBrake.recordSnapshot([], 'five', 1000);
    expect(result).toEqual([]);
  });

  it('returns unchanged history for non-number timestamp', () => {
    var result = TabBrake.recordSnapshot([], 5, 'now');
    expect(result).toEqual([]);
  });

  it('records zero tab count', () => {
    var result = TabBrake.recordSnapshot([], 0, 1000);
    expect(result).toEqual([{ tabCount: 0, timestamp: 1000 }]);
  });
});

/* ================================================================== */
/*  cleanHistory                                                       */
/* ================================================================== */

describe('cleanHistory', () => {
  var now = Date.now();

  it('keeps entries within the age limit', () => {
    var history = [
      { tabCount: 5, timestamp: now - 1000 },
      { tabCount: 6, timestamp: now - 2000 },
    ];
    var result = TabBrake.cleanHistory(history, 30);
    expect(result).toHaveLength(2);
  });

  it('removes entries older than maxAgeDays', () => {
    var old = now - 31 * 24 * 60 * 60 * 1000; // 31 days ago
    var history = [
      { tabCount: 5, timestamp: old },
      { tabCount: 6, timestamp: now - 1000 },
    ];
    var result = TabBrake.cleanHistory(history, 30);
    expect(result).toHaveLength(1);
    expect(result[0].tabCount).toBe(6);
  });

  it('returns empty array when all entries are too old', () => {
    var old = now - 40 * 24 * 60 * 60 * 1000;
    var history = [
      { tabCount: 5, timestamp: old },
      { tabCount: 6, timestamp: old - 1000 },
    ];
    var result = TabBrake.cleanHistory(history, 30);
    expect(result).toEqual([]);
  });

  it('defaults to 30 days when maxAgeDays is not provided', () => {
    var old = now - 31 * 24 * 60 * 60 * 1000;
    var recent = now - 1000;
    var history = [
      { tabCount: 5, timestamp: old },
      { tabCount: 6, timestamp: recent },
    ];
    var result = TabBrake.cleanHistory(history);
    expect(result).toHaveLength(1);
  });

  it('handles empty history', () => {
    expect(TabBrake.cleanHistory([], 30)).toEqual([]);
  });

  it('handles null history', () => {
    expect(TabBrake.cleanHistory(null, 30)).toEqual([]);
  });

  it('handles non-array history', () => {
    expect(TabBrake.cleanHistory('not-array', 30)).toEqual([]);
  });

  it('skips entries without a valid timestamp', () => {
    var history = [
      { tabCount: 5 },
      { tabCount: 6, timestamp: now - 1000 },
      null,
    ];
    var result = TabBrake.cleanHistory(history, 30);
    expect(result).toHaveLength(1);
  });

  it('respects custom maxAgeDays (7 days)', () => {
    var eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    var sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
    var history = [
      { tabCount: 5, timestamp: eightDaysAgo },
      { tabCount: 6, timestamp: sixDaysAgo },
    ];
    var result = TabBrake.cleanHistory(history, 7);
    expect(result).toHaveLength(1);
    expect(result[0].tabCount).toBe(6);
  });

  it('treats zero maxAgeDays as default 30', () => {
    var recent = now - 1000;
    var history = [{ tabCount: 5, timestamp: recent }];
    var result = TabBrake.cleanHistory(history, 0);
    expect(result).toHaveLength(1);
  });

  it('treats negative maxAgeDays as default 30', () => {
    var recent = now - 1000;
    var history = [{ tabCount: 5, timestamp: recent }];
    var result = TabBrake.cleanHistory(history, -5);
    expect(result).toHaveLength(1);
  });
});

/* ================================================================== */
/*  getTabStats                                                        */
/* ================================================================== */

describe('getTabStats', () => {
  it('returns zeros for empty history', () => {
    var stats = TabBrake.getTabStats([]);
    expect(stats).toEqual({
      avgTabs: 0,
      peakTabs: 0,
      timesBlocked: 0,
      timesOverridden: 0,
    });
  });

  it('returns zeros for null history', () => {
    var stats = TabBrake.getTabStats(null);
    expect(stats).toEqual({
      avgTabs: 0,
      peakTabs: 0,
      timesBlocked: 0,
      timesOverridden: 0,
    });
  });

  it('calculates average correctly for a single entry', () => {
    var history = [{ tabCount: 10, timestamp: 1000 }];
    var stats = TabBrake.getTabStats(history);
    expect(stats.avgTabs).toBe(10);
  });

  it('calculates average correctly for multiple entries', () => {
    var history = [
      { tabCount: 4, timestamp: 1000 },
      { tabCount: 6, timestamp: 2000 },
      { tabCount: 8, timestamp: 3000 },
    ];
    var stats = TabBrake.getTabStats(history);
    expect(stats.avgTabs).toBe(6); // (4+6+8)/3 = 6
  });

  it('rounds average to one decimal place', () => {
    var history = [
      { tabCount: 3, timestamp: 1000 },
      { tabCount: 5, timestamp: 2000 },
    ];
    var stats = TabBrake.getTabStats(history);
    expect(stats.avgTabs).toBe(4); // (3+5)/2 = 4.0
  });

  it('identifies peak tab count', () => {
    var history = [
      { tabCount: 3, timestamp: 1000 },
      { tabCount: 15, timestamp: 2000 },
      { tabCount: 7, timestamp: 3000 },
    ];
    var stats = TabBrake.getTabStats(history);
    expect(stats.peakTabs).toBe(15);
  });

  it('counts blocked events', () => {
    var history = [
      { tabCount: 9, timestamp: 1000, blocked: true },
      { tabCount: 8, timestamp: 2000 },
      { tabCount: 10, timestamp: 3000, blocked: true },
    ];
    var stats = TabBrake.getTabStats(history);
    expect(stats.timesBlocked).toBe(2);
  });

  it('counts overridden events', () => {
    var history = [
      { tabCount: 9, timestamp: 1000, overridden: true },
      { tabCount: 8, timestamp: 2000 },
      { tabCount: 10, timestamp: 3000, overridden: true },
      { tabCount: 11, timestamp: 4000, overridden: true },
    ];
    var stats = TabBrake.getTabStats(history);
    expect(stats.timesOverridden).toBe(3);
  });

  it('handles entries with both blocked and overridden flags', () => {
    var history = [
      { tabCount: 9, timestamp: 1000, blocked: true, overridden: true },
    ];
    var stats = TabBrake.getTabStats(history);
    expect(stats.timesBlocked).toBe(1);
    expect(stats.timesOverridden).toBe(1);
  });

  it('skips null entries in history', () => {
    var history = [null, { tabCount: 5, timestamp: 1000 }, null];
    var stats = TabBrake.getTabStats(history);
    // avgTabs = 5 / 3 entries, but null entries contribute 0 count
    // Actually the code skips null entries via `if (!entry) continue`
    // so length is still 3 for the average denominator
    // Wait - the code uses history.length which is 3, but only sums
    // the valid entry (5). So avgTabs = 5/3 = 1.7
    expect(stats.avgTabs).toBe(1.7);
    expect(stats.peakTabs).toBe(5);
  });
});

/* ================================================================== */
/*  getHourlyAverage                                                   */
/* ================================================================== */

describe('getHourlyAverage', () => {
  it('returns empty array for empty history', () => {
    expect(TabBrake.getHourlyAverage([], 24)).toEqual([]);
  });

  it('returns empty array for null history', () => {
    expect(TabBrake.getHourlyAverage(null, 24)).toEqual([]);
  });

  it('groups entries by hour', () => {
    // Use timestamps relative to now so they always fall within the window.
    // Place the base 2 hours ago, at the top of that hour.
    var now = Date.now();
    var twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    // Snap to the start of that hour
    twoHoursAgo.setMinutes(0, 0, 0);
    var baseTime = twoHoursAgo.getTime();

    var history = [
      { tabCount: 5, timestamp: baseTime },
      { tabCount: 7, timestamp: baseTime + 10 * 60 * 1000 }, // same hour
      { tabCount: 10, timestamp: baseTime + 60 * 60 * 1000 }, // next hour
    ];
    var result = TabBrake.getHourlyAverage(history, 24);
    expect(result).toHaveLength(2);
    expect(result[0].avgCount).toBe(6); // (5+7)/2
    expect(result[1].avgCount).toBe(10);
  });

  it('defaults to 24 hours when hours param is missing', () => {
    var now = Date.now();
    var history = [{ tabCount: 5, timestamp: now - 1000 }];
    var result = TabBrake.getHourlyAverage(history);
    expect(result).toHaveLength(1);
  });

  it('excludes entries outside the time window', () => {
    var now = Date.now();
    var history = [
      { tabCount: 5, timestamp: now - 25 * 60 * 60 * 1000 }, // 25h ago
      { tabCount: 7, timestamp: now - 1000 }, // recent
    ];
    var result = TabBrake.getHourlyAverage(history, 24);
    expect(result).toHaveLength(1);
    expect(result[0].avgCount).toBe(7);
  });

  it('handles a single entry', () => {
    var now = Date.now();
    var history = [{ tabCount: 12, timestamp: now - 1000 }];
    var result = TabBrake.getHourlyAverage(history, 24);
    expect(result).toHaveLength(1);
    expect(result[0].avgCount).toBe(12);
  });

  it('returns entries with hour strings', () => {
    var now = Date.now();
    var history = [{ tabCount: 5, timestamp: now - 1000 }];
    var result = TabBrake.getHourlyAverage(history, 24);
    expect(result[0]).toHaveProperty('hour');
    expect(typeof result[0].hour).toBe('string');
    expect(result[0].hour).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}$/);
  });
});

/* ================================================================== */
/*  getDailyAverage                                                    */
/* ================================================================== */

describe('getDailyAverage', () => {
  it('returns empty array for empty history', () => {
    expect(TabBrake.getDailyAverage([], 7)).toEqual([]);
  });

  it('returns empty array for null history', () => {
    expect(TabBrake.getDailyAverage(null, 7)).toEqual([]);
  });

  it('groups entries by date', () => {
    var day1 = new Date(2026, 2, 9, 10, 0).getTime();
    var day2 = new Date(2026, 2, 10, 10, 0).getTime();
    var history = [
      { tabCount: 4, timestamp: day1 },
      { tabCount: 6, timestamp: day1 + 3600000 },
      { tabCount: 8, timestamp: day2 },
    ];
    var result = TabBrake.getDailyAverage(history, 7);
    expect(result).toHaveLength(2);
    expect(result[0].avgCount).toBe(5); // (4+6)/2
    expect(result[1].avgCount).toBe(8);
  });

  it('defaults to 7 days when days param is missing', () => {
    var now = Date.now();
    var history = [{ tabCount: 5, timestamp: now - 1000 }];
    var result = TabBrake.getDailyAverage(history);
    expect(result).toHaveLength(1);
  });

  it('excludes entries outside the time window', () => {
    var now = Date.now();
    var history = [
      { tabCount: 5, timestamp: now - 8 * 24 * 60 * 60 * 1000 }, // 8 days ago
      { tabCount: 7, timestamp: now - 1000 },
    ];
    var result = TabBrake.getDailyAverage(history, 7);
    expect(result).toHaveLength(1);
    expect(result[0].avgCount).toBe(7);
  });

  it('returns entries with date strings in YYYY-MM-DD format', () => {
    var now = Date.now();
    var history = [{ tabCount: 5, timestamp: now - 1000 }];
    var result = TabBrake.getDailyAverage(history, 7);
    expect(result[0]).toHaveProperty('date');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles multiple entries on the same day', () => {
    var base = new Date(2026, 2, 10, 8, 0).getTime();
    var history = [
      { tabCount: 2, timestamp: base },
      { tabCount: 4, timestamp: base + 3600000 },
      { tabCount: 6, timestamp: base + 7200000 },
      { tabCount: 8, timestamp: base + 10800000 },
    ];
    var result = TabBrake.getDailyAverage(history, 7);
    expect(result).toHaveLength(1);
    expect(result[0].avgCount).toBe(5); // (2+4+6+8)/4
  });
});

/* ================================================================== */
/*  formatTabCount                                                     */
/* ================================================================== */

describe('formatTabCount', () => {
  it('formats count and max correctly', () => {
    expect(TabBrake.formatTabCount(5, 8)).toBe('5 / 8 tabs');
  });

  it('formats zero count', () => {
    expect(TabBrake.formatTabCount(0, 8)).toBe('0 / 8 tabs');
  });

  it('formats when count equals max', () => {
    expect(TabBrake.formatTabCount(8, 8)).toBe('8 / 8 tabs');
  });

  it('formats when count exceeds max', () => {
    expect(TabBrake.formatTabCount(12, 8)).toBe('12 / 8 tabs');
  });

  it('handles non-number count as 0', () => {
    expect(TabBrake.formatTabCount(undefined, 8)).toBe('0 / 8 tabs');
  });

  it('handles non-number max as 0', () => {
    expect(TabBrake.formatTabCount(5, undefined)).toBe('5 / 0 tabs');
  });

  it('handles both non-numbers as 0', () => {
    expect(TabBrake.formatTabCount(null, null)).toBe('0 / 0 tabs');
  });

  it('formats large numbers', () => {
    expect(TabBrake.formatTabCount(100, 50)).toBe('100 / 50 tabs');
  });
});

/* ================================================================== */
/*  getUsagePercent                                                    */
/* ================================================================== */

describe('getUsagePercent', () => {
  it('returns 0% for 0 tabs', () => {
    expect(TabBrake.getUsagePercent(0, 8)).toBe(0);
  });

  it('returns 50% for half usage', () => {
    expect(TabBrake.getUsagePercent(4, 8)).toBe(50);
  });

  it('returns 100% when at limit', () => {
    expect(TabBrake.getUsagePercent(8, 8)).toBe(100);
  });

  it('caps at 100% when over limit', () => {
    expect(TabBrake.getUsagePercent(16, 8)).toBe(100);
  });

  it('returns 0 when max is 0', () => {
    expect(TabBrake.getUsagePercent(5, 0)).toBe(0);
  });

  it('returns 0 when max is negative', () => {
    expect(TabBrake.getUsagePercent(5, -1)).toBe(0);
  });

  it('returns 0 for non-number count', () => {
    expect(TabBrake.getUsagePercent('5', 8)).toBe(0);
  });

  it('returns 0 for non-number max', () => {
    expect(TabBrake.getUsagePercent(5, '8')).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(TabBrake.getUsagePercent(1, 3)).toBe(33); // 33.33 -> 33
  });

  it('returns 100 for 1/1', () => {
    expect(TabBrake.getUsagePercent(1, 1)).toBe(100);
  });

  it('returns 25% for quarter usage', () => {
    expect(TabBrake.getUsagePercent(2, 8)).toBe(25);
  });

  it('returns 0 for undefined arguments', () => {
    expect(TabBrake.getUsagePercent(undefined, undefined)).toBe(0);
  });
});

/* ================================================================== */
/*  Integration / edge-case tests                                      */
/* ================================================================== */

describe('integration and edge cases', () => {
  it('recordSnapshot + getTabStats work together', () => {
    var history = [];
    history = TabBrake.recordSnapshot(history, 5, 1000);
    history = TabBrake.recordSnapshot(history, 10, 2000);
    history = TabBrake.recordSnapshot(history, 3, 3000);

    var stats = TabBrake.getTabStats(history);
    expect(stats.avgTabs).toBe(6); // (5+10+3)/3
    expect(stats.peakTabs).toBe(10);
    expect(stats.timesBlocked).toBe(0);
  });

  it('recordSnapshot + cleanHistory pipeline', () => {
    var now = Date.now();
    var history = [];
    // Add old entry
    history = TabBrake.recordSnapshot(history, 5, now - 35 * 24 * 60 * 60 * 1000);
    // Add recent entry
    history = TabBrake.recordSnapshot(history, 8, now - 1000);
    expect(history).toHaveLength(2);

    // Clean with 30-day window
    history = TabBrake.cleanHistory(history, 30);
    expect(history).toHaveLength(1);
    expect(history[0].tabCount).toBe(8);
  });

  it('getUsagePercent matches shouldBlock boundary', () => {
    // At limit: should not block, usage = 100%
    expect(TabBrake.shouldBlock(8, 8)).toBe(false);
    expect(TabBrake.getUsagePercent(8, 8)).toBe(100);

    // Over limit: should block, usage capped at 100%
    expect(TabBrake.shouldBlock(9, 8)).toBe(true);
    expect(TabBrake.getUsagePercent(9, 8)).toBe(100);
  });

  it('formatTabCount reflects actual values', () => {
    var count = 5;
    var max = 10;
    var formatted = TabBrake.formatTabCount(count, max);
    expect(formatted).toContain('5');
    expect(formatted).toContain('10');
    expect(formatted).toContain('tabs');
  });

  it('getDailyAverage handles history with no entries in range', () => {
    var now = Date.now();
    var old = now - 10 * 24 * 60 * 60 * 1000;
    var history = [{ tabCount: 5, timestamp: old }];
    var result = TabBrake.getDailyAverage(history, 7);
    expect(result).toEqual([]);
  });

  it('getHourlyAverage handles history with no entries in range', () => {
    var now = Date.now();
    var old = now - 48 * 60 * 60 * 1000;
    var history = [{ tabCount: 5, timestamp: old }];
    var result = TabBrake.getHourlyAverage(history, 24);
    expect(result).toEqual([]);
  });

  it('handles a complete workflow: record, stats, clean', () => {
    var now = Date.now();
    var history = [];

    // Simulate 5 snapshots over recent hours
    for (var i = 0; i < 5; i++) {
      history = TabBrake.recordSnapshot(history, 3 + i, now - (5 - i) * 3600000);
    }

    expect(history).toHaveLength(5);

    var stats = TabBrake.getTabStats(history);
    expect(stats.avgTabs).toBe(5); // (3+4+5+6+7)/5 = 5
    expect(stats.peakTabs).toBe(7);

    var hourly = TabBrake.getHourlyAverage(history, 24);
    expect(hourly.length).toBeGreaterThan(0);

    var daily = TabBrake.getDailyAverage(history, 7);
    expect(daily.length).toBeGreaterThan(0);

    // Clean should keep all (all are recent)
    var cleaned = TabBrake.cleanHistory(history, 30);
    expect(cleaned).toHaveLength(5);
  });

  it('getTabStats handles entries with missing tabCount', () => {
    var history = [
      { timestamp: 1000 },
      { tabCount: 5, timestamp: 2000 },
    ];
    var stats = TabBrake.getTabStats(history);
    expect(stats.avgTabs).toBe(2.5); // (0 + 5) / 2
    expect(stats.peakTabs).toBe(5);
  });

  it('getHourlyAverage handles entries with missing tabCount', () => {
    var now = Date.now();
    var history = [
      { timestamp: now - 1000 },
      { tabCount: 10, timestamp: now - 2000 },
    ];
    var result = TabBrake.getHourlyAverage(history, 24);
    // Both in the same hour bucket
    expect(result).toHaveLength(1);
    expect(result[0].avgCount).toBe(5); // (0 + 10) / 2
  });
});
