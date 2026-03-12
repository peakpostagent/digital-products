// tracker.test.js — Comprehensive tests for Review Clock tracker.js
// Uses Vitest with jsdom environment

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Load the tracker module
const ReviewClock = require('../src/lib/tracker.js');

// ============================================================
// createSession
// ============================================================
describe('createSession', () => {
  it('should create a session with all required fields', () => {
    const session = ReviewClock.createSession(
      'https://github.com/owner/repo/pull/42',
      'Fix login bug',
      'alice'
    );
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('prUrl', 'https://github.com/owner/repo/pull/42');
    expect(session).toHaveProperty('prTitle', 'Fix login bug');
    expect(session).toHaveProperty('prAuthor', 'alice');
    expect(session).toHaveProperty('startTime');
    expect(session).toHaveProperty('elapsed', 0);
    expect(session).toHaveProperty('isActive', true);
  });

  it('should generate a unique ID for each session', () => {
    const s1 = ReviewClock.createSession('url1', 'title1', 'author1');
    const s2 = ReviewClock.createSession('url2', 'title2', 'author2');
    expect(s1.id).not.toBe(s2.id);
  });

  it('should set startTime to approximately now', () => {
    const before = Date.now();
    const session = ReviewClock.createSession('url', 'title', 'author');
    const after = Date.now();
    expect(session.startTime).toBeGreaterThanOrEqual(before);
    expect(session.startTime).toBeLessThanOrEqual(after);
  });

  it('should default to empty strings for missing parameters', () => {
    const session = ReviewClock.createSession();
    expect(session.prUrl).toBe('');
    expect(session.prTitle).toBe('');
    expect(session.prAuthor).toBe('');
  });

  it('should handle null parameters gracefully', () => {
    const session = ReviewClock.createSession(null, null, null);
    expect(session.prUrl).toBe('');
    expect(session.prTitle).toBe('');
    expect(session.prAuthor).toBe('');
  });

  it('should start with elapsed time of 0', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    expect(session.elapsed).toBe(0);
  });

  it('should start in active state', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    expect(session.isActive).toBe(true);
  });
});

// ============================================================
// updateSession
// ============================================================
describe('updateSession', () => {
  it('should add elapsed time from startTime to now', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    const startTime = session.startTime;
    const now = startTime + 5000; // 5 seconds later
    const updated = ReviewClock.updateSession(session, now);
    expect(updated.elapsed).toBe(5000);
  });

  it('should update startTime to the provided now value', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    const now = session.startTime + 10000;
    const updated = ReviewClock.updateSession(session, now);
    expect(updated.startTime).toBe(now);
  });

  it('should accumulate elapsed time across multiple updates', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    const t0 = session.startTime;
    session = ReviewClock.updateSession(session, t0 + 3000);
    session = ReviewClock.updateSession(session, t0 + 3000 + 7000);
    expect(session.elapsed).toBe(10000);
  });

  it('should return the session unchanged if not active', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    session = ReviewClock.pauseSession(session);
    const paused = { ...session };
    const result = ReviewClock.updateSession(session, Date.now() + 5000);
    expect(result.elapsed).toBe(paused.elapsed);
  });

  it('should return null/undefined session as-is', () => {
    expect(ReviewClock.updateSession(null, Date.now())).toBeNull();
    expect(ReviewClock.updateSession(undefined, Date.now())).toBeUndefined();
  });

  it('should not mutate the original session object', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    const originalElapsed = session.elapsed;
    ReviewClock.updateSession(session, session.startTime + 5000);
    expect(session.elapsed).toBe(originalElapsed);
  });
});

// ============================================================
// pauseSession
// ============================================================
describe('pauseSession', () => {
  it('should set isActive to false', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    const paused = ReviewClock.pauseSession(session);
    expect(paused.isActive).toBe(false);
  });

  it('should accumulate elapsed time up to the pause moment', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    // Force startTime to a known value
    const fixedSession = Object.assign({}, session, { startTime: Date.now() - 5000 });
    const paused = ReviewClock.pauseSession(fixedSession);
    expect(paused.elapsed).toBeGreaterThanOrEqual(4900);
    expect(paused.elapsed).toBeLessThanOrEqual(5200);
  });

  it('should return already-paused session unchanged', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    session = ReviewClock.pauseSession(session);
    const elapsed1 = session.elapsed;
    const result = ReviewClock.pauseSession(session);
    expect(result.elapsed).toBe(elapsed1);
    expect(result.isActive).toBe(false);
  });

  it('should return null session as-is', () => {
    expect(ReviewClock.pauseSession(null)).toBeNull();
  });

  it('should not mutate the original session', () => {
    const session = ReviewClock.createSession('url', 'title', 'author');
    const wasActive = session.isActive;
    ReviewClock.pauseSession(session);
    expect(session.isActive).toBe(wasActive);
  });
});

// ============================================================
// resumeSession
// ============================================================
describe('resumeSession', () => {
  it('should set isActive to true', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    session = ReviewClock.pauseSession(session);
    const resumed = ReviewClock.resumeSession(session);
    expect(resumed.isActive).toBe(true);
  });

  it('should reset startTime to approximately now', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    session = ReviewClock.pauseSession(session);
    const before = Date.now();
    const resumed = ReviewClock.resumeSession(session);
    const after = Date.now();
    expect(resumed.startTime).toBeGreaterThanOrEqual(before);
    expect(resumed.startTime).toBeLessThanOrEqual(after);
  });

  it('should keep accumulated elapsed time', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    const s = Object.assign({}, session, { startTime: Date.now() - 10000 });
    const paused = ReviewClock.pauseSession(s);
    const resumed = ReviewClock.resumeSession(paused);
    expect(resumed.elapsed).toBe(paused.elapsed);
  });

  it('should return null session as-is', () => {
    expect(ReviewClock.resumeSession(null)).toBeNull();
  });

  it('should not mutate the original session', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    session = ReviewClock.pauseSession(session);
    const originalActive = session.isActive;
    ReviewClock.resumeSession(session);
    expect(session.isActive).toBe(originalActive);
  });

  it('should allow pause/resume cycle to preserve elapsed', () => {
    let session = ReviewClock.createSession('url', 'title', 'author');
    const t0 = session.startTime;

    // Simulate: active for 5s via update, then manually set elapsed for pause
    session = ReviewClock.updateSession(session, t0 + 5000);
    expect(session.elapsed).toBe(5000);

    // Manually construct a paused state (since pauseSession uses Date.now()
    // which won't match our simulated future time)
    session = Object.assign({}, session, { isActive: false });
    expect(session.elapsed).toBe(5000);

    // Resume and simulate 3 more seconds
    session = ReviewClock.resumeSession(session);
    const resumeStart = session.startTime;
    session = ReviewClock.updateSession(session, resumeStart + 3000);
    expect(session.elapsed).toBe(8000);
  });
});

// ============================================================
// formatDuration
// ============================================================
describe('formatDuration', () => {
  it('should return "0s" for 0 milliseconds', () => {
    expect(ReviewClock.formatDuration(0)).toBe('0s');
  });

  it('should return "0s" for negative values', () => {
    expect(ReviewClock.formatDuration(-1000)).toBe('0s');
  });

  it('should return "0s" for null/undefined', () => {
    expect(ReviewClock.formatDuration(null)).toBe('0s');
    expect(ReviewClock.formatDuration(undefined)).toBe('0s');
  });

  it('should return "0s" for very small positive values (< 1s)', () => {
    expect(ReviewClock.formatDuration(500)).toBe('0s');
  });

  it('should format seconds only (< 60s)', () => {
    expect(ReviewClock.formatDuration(45000)).toBe('45s');
  });

  it('should format 1 second', () => {
    expect(ReviewClock.formatDuration(1000)).toBe('1s');
  });

  it('should format 59 seconds', () => {
    expect(ReviewClock.formatDuration(59000)).toBe('59s');
  });

  it('should format minutes and seconds', () => {
    expect(ReviewClock.formatDuration(750000)).toBe('12m 30s');
  });

  it('should format exact minutes (no seconds)', () => {
    expect(ReviewClock.formatDuration(300000)).toBe('5m');
  });

  it('should format 1 minute exactly', () => {
    expect(ReviewClock.formatDuration(60000)).toBe('1m');
  });

  it('should format hours and minutes', () => {
    expect(ReviewClock.formatDuration(4500000)).toBe('1h 15m');
  });

  it('should format exact hours (no minutes)', () => {
    expect(ReviewClock.formatDuration(7200000)).toBe('2h');
  });

  it('should format 1 hour exactly', () => {
    expect(ReviewClock.formatDuration(3600000)).toBe('1h');
  });

  it('should format large durations', () => {
    // 5 hours 30 minutes
    expect(ReviewClock.formatDuration(19800000)).toBe('5h 30m');
  });

  it('should handle just under 1 hour', () => {
    // 59 minutes 59 seconds
    expect(ReviewClock.formatDuration(3599000)).toBe('59m 59s');
  });
});

// ============================================================
// formatTimer
// ============================================================
describe('formatTimer', () => {
  it('should return "00:00" for 0 ms', () => {
    expect(ReviewClock.formatTimer(0)).toBe('00:00');
  });

  it('should return "00:00" for negative values', () => {
    expect(ReviewClock.formatTimer(-1000)).toBe('00:00');
  });

  it('should format seconds correctly', () => {
    expect(ReviewClock.formatTimer(45000)).toBe('00:45');
  });

  it('should format minutes and seconds', () => {
    expect(ReviewClock.formatTimer(750000)).toBe('12:30');
  });

  it('should format with hours when over 60 minutes', () => {
    expect(ReviewClock.formatTimer(4500000)).toBe('01:15:00');
  });

  it('should pad single digits', () => {
    expect(ReviewClock.formatTimer(61000)).toBe('01:01');
  });

  it('should format 1 hour exactly', () => {
    expect(ReviewClock.formatTimer(3600000)).toBe('01:00:00');
  });
});

// ============================================================
// getWeekKey
// ============================================================
describe('getWeekKey', () => {
  it('should return a week key in format YYYY-Www', () => {
    const date = new Date('2026-03-11T12:00:00Z'); // Wednesday
    const key = ReviewClock.getWeekKey(date);
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('should return correct week for 2026-03-11 (Wed, W11)', () => {
    const date = new Date('2026-03-11T12:00:00Z');
    expect(ReviewClock.getWeekKey(date)).toBe('2026-W11');
  });

  it('should return correct week for a Monday', () => {
    const date = new Date('2026-03-09T12:00:00Z'); // Monday
    expect(ReviewClock.getWeekKey(date)).toBe('2026-W11');
  });

  it('should return correct week for a Sunday', () => {
    const date = new Date('2026-03-15T12:00:00Z'); // Sunday
    expect(ReviewClock.getWeekKey(date)).toBe('2026-W11');
  });

  it('should handle week 1 of a year', () => {
    const date = new Date('2026-01-05T12:00:00Z'); // Monday of week 2
    const key = ReviewClock.getWeekKey(date);
    expect(key).toMatch(/^2026-W02$/);
  });

  it('should handle the last week of a year', () => {
    const date = new Date('2025-12-29T12:00:00Z'); // Monday of last week
    const key = ReviewClock.getWeekKey(date);
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('should handle year boundary (Jan 1 may be previous year week)', () => {
    // January 1, 2026 is a Thursday — it's in W01 of 2026
    const date = new Date('2026-01-01T12:00:00Z');
    expect(ReviewClock.getWeekKey(date)).toBe('2026-W01');
  });

  it('should return empty string for invalid date', () => {
    expect(ReviewClock.getWeekKey(new Date('invalid'))).toBe('');
  });

  it('should return empty string for null', () => {
    expect(ReviewClock.getWeekKey(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(ReviewClock.getWeekKey(undefined)).toBe('');
  });

  it('should return same key for all days in the same week', () => {
    // Mon-Sun of 2026-W11
    const mon = new Date('2026-03-09T12:00:00Z');
    const tue = new Date('2026-03-10T12:00:00Z');
    const wed = new Date('2026-03-11T12:00:00Z');
    const thu = new Date('2026-03-12T12:00:00Z');
    const fri = new Date('2026-03-13T12:00:00Z');
    const sat = new Date('2026-03-14T12:00:00Z');
    const sun = new Date('2026-03-15T12:00:00Z');

    const key = ReviewClock.getWeekKey(mon);
    expect(ReviewClock.getWeekKey(tue)).toBe(key);
    expect(ReviewClock.getWeekKey(wed)).toBe(key);
    expect(ReviewClock.getWeekKey(thu)).toBe(key);
    expect(ReviewClock.getWeekKey(fri)).toBe(key);
    expect(ReviewClock.getWeekKey(sat)).toBe(key);
    expect(ReviewClock.getWeekKey(sun)).toBe(key);
  });

  it('should return different keys for different weeks', () => {
    const week11 = new Date('2026-03-11T12:00:00Z');
    const week12 = new Date('2026-03-18T12:00:00Z');
    expect(ReviewClock.getWeekKey(week11)).not.toBe(ReviewClock.getWeekKey(week12));
  });
});

// ============================================================
// getWeeklyStats
// ============================================================
describe('getWeeklyStats', () => {
  const weekKey = '2026-W11';
  // Monday March 9, 2026 at noon
  const mondayTs = new Date('2026-03-09T12:00:00Z').getTime();
  const tuesdayTs = new Date('2026-03-10T12:00:00Z').getTime();
  const wednesdayTs = new Date('2026-03-11T12:00:00Z').getTime();

  function makeSession(url, title, elapsed, startTime) {
    return {
      id: Math.random().toString(36).slice(2),
      prUrl: url,
      prTitle: title,
      prAuthor: 'author',
      startTime: startTime,
      elapsed: elapsed,
      isActive: false
    };
  }

  it('should return zero stats for empty sessions array', () => {
    const stats = ReviewClock.getWeeklyStats([], weekKey);
    expect(stats.totalTime).toBe(0);
    expect(stats.prCount).toBe(0);
    expect(stats.avgTime).toBe(0);
    expect(stats.longestReview).toBeNull();
  });

  it('should return zero stats for null sessions', () => {
    const stats = ReviewClock.getWeeklyStats(null, weekKey);
    expect(stats.totalTime).toBe(0);
    expect(stats.prCount).toBe(0);
  });

  it('should return zero stats for empty weekKey', () => {
    const sessions = [makeSession('url', 'title', 60000, mondayTs)];
    const stats = ReviewClock.getWeeklyStats(sessions, '');
    expect(stats.totalTime).toBe(0);
  });

  it('should calculate total time from all sessions in the week', () => {
    const sessions = [
      makeSession('url1', 'PR 1', 60000, mondayTs),      // 1 minute
      makeSession('url2', 'PR 2', 120000, tuesdayTs),     // 2 minutes
      makeSession('url3', 'PR 3', 180000, wednesdayTs),   // 3 minutes
    ];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.totalTime).toBe(360000); // 6 minutes total
  });

  it('should count unique PRs by URL', () => {
    const sessions = [
      makeSession('url1', 'PR 1', 60000, mondayTs),
      makeSession('url1', 'PR 1', 30000, tuesdayTs),  // Same PR, different session
      makeSession('url2', 'PR 2', 120000, wednesdayTs),
    ];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.prCount).toBe(2);
  });

  it('should calculate average time per PR', () => {
    const sessions = [
      makeSession('url1', 'PR 1', 60000, mondayTs),
      makeSession('url2', 'PR 2', 120000, tuesdayTs),
    ];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.avgTime).toBe(90000); // (60k + 120k) / 2
  });

  it('should identify the longest review', () => {
    const sessions = [
      makeSession('url1', 'Short PR', 60000, mondayTs),
      makeSession('url2', 'Long PR', 300000, tuesdayTs),
      makeSession('url3', 'Medium PR', 180000, wednesdayTs),
    ];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.longestReview).not.toBeNull();
    expect(stats.longestReview.prTitle).toBe('Long PR');
    expect(stats.longestReview.elapsed).toBe(300000);
  });

  it('should aggregate elapsed time for same PR across sessions', () => {
    const sessions = [
      makeSession('url1', 'PR 1', 60000, mondayTs),
      makeSession('url1', 'PR 1', 40000, tuesdayTs),
    ];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.totalTime).toBe(100000);
    expect(stats.prCount).toBe(1);
    expect(stats.longestReview.elapsed).toBe(100000);
  });

  it('should filter out sessions from different weeks', () => {
    const otherWeekTs = new Date('2026-03-02T12:00:00Z').getTime(); // W10
    const sessions = [
      makeSession('url1', 'This week PR', 60000, mondayTs),
      makeSession('url2', 'Last week PR', 120000, otherWeekTs),
    ];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.totalTime).toBe(60000);
    expect(stats.prCount).toBe(1);
  });

  it('should include daily breakdown in stats', () => {
    const sessions = [
      makeSession('url1', 'PR 1', 60000, mondayTs),
    ];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.dailyBreakdown).toBeDefined();
    expect(stats.dailyBreakdown.Mon).toBe(60000);
  });

  it('should handle a single session correctly', () => {
    const sessions = [makeSession('url1', 'Only PR', 150000, mondayTs)];
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.totalTime).toBe(150000);
    expect(stats.prCount).toBe(1);
    expect(stats.avgTime).toBe(150000);
    expect(stats.longestReview.prTitle).toBe('Only PR');
  });

  it('should handle many sessions across multiple PRs', () => {
    const sessions = [];
    for (let i = 0; i < 20; i++) {
      sessions.push(makeSession('url' + (i % 5), 'PR ' + (i % 5), 30000, mondayTs + i * 1000));
    }
    const stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    expect(stats.prCount).toBe(5);
    expect(stats.totalTime).toBe(600000); // 20 * 30000
  });
});

// ============================================================
// getDailyBreakdown
// ============================================================
describe('getDailyBreakdown', () => {
  const weekKey = '2026-W11';

  function makeSession(elapsed, dateStr) {
    return {
      id: Math.random().toString(36).slice(2),
      prUrl: 'url',
      prTitle: 'title',
      prAuthor: 'author',
      startTime: new Date(dateStr).getTime(),
      elapsed: elapsed,
      isActive: false
    };
  }

  it('should return all zeros for empty sessions', () => {
    const breakdown = ReviewClock.getDailyBreakdown([], weekKey);
    expect(breakdown).toEqual({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
  });

  it('should return all zeros for null sessions', () => {
    const breakdown = ReviewClock.getDailyBreakdown(null, weekKey);
    expect(breakdown).toEqual({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
  });

  it('should assign time to correct day of week', () => {
    const sessions = [
      makeSession(60000, '2026-03-09T12:00:00Z'),  // Monday
      makeSession(120000, '2026-03-10T12:00:00Z'), // Tuesday
      makeSession(180000, '2026-03-13T12:00:00Z'), // Friday
    ];
    const breakdown = ReviewClock.getDailyBreakdown(sessions, weekKey);
    expect(breakdown.Mon).toBe(60000);
    expect(breakdown.Tue).toBe(120000);
    expect(breakdown.Fri).toBe(180000);
    expect(breakdown.Wed).toBe(0);
    expect(breakdown.Thu).toBe(0);
    expect(breakdown.Sat).toBe(0);
    expect(breakdown.Sun).toBe(0);
  });

  it('should accumulate time on the same day', () => {
    const sessions = [
      makeSession(60000, '2026-03-09T09:00:00Z'),  // Monday morning
      makeSession(90000, '2026-03-09T14:00:00Z'),  // Monday afternoon
    ];
    const breakdown = ReviewClock.getDailyBreakdown(sessions, weekKey);
    expect(breakdown.Mon).toBe(150000);
  });

  it('should filter by weekKey when provided', () => {
    const sessions = [
      makeSession(60000, '2026-03-09T12:00:00Z'),  // W11 Monday
      makeSession(120000, '2026-03-02T12:00:00Z'), // W10 Monday
    ];
    const breakdown = ReviewClock.getDailyBreakdown(sessions, weekKey);
    expect(breakdown.Mon).toBe(60000);
  });

  it('should handle sessions with zero elapsed', () => {
    const sessions = [
      makeSession(0, '2026-03-09T12:00:00Z'),
    ];
    const breakdown = ReviewClock.getDailyBreakdown(sessions, weekKey);
    expect(breakdown.Mon).toBe(0);
  });
});

// ============================================================
// parsePrInfo
// ============================================================
describe('parsePrInfo', () => {
  it('should parse a standard GitHub PR URL', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/facebook/react/pull/12345');
    expect(result).toEqual({ owner: 'facebook', repo: 'react', number: 12345 });
  });

  it('should parse URL with trailing path (files tab)', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/owner/repo/pull/42/files');
    expect(result).toEqual({ owner: 'owner', repo: 'repo', number: 42 });
  });

  it('should parse URL with commits tab', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/owner/repo/pull/99/commits');
    expect(result).toEqual({ owner: 'owner', repo: 'repo', number: 99 });
  });

  it('should parse URL with checks tab', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/owner/repo/pull/7/checks');
    expect(result).toEqual({ owner: 'owner', repo: 'repo', number: 7 });
  });

  it('should parse URL with http (not https)', () => {
    const result = ReviewClock.parsePrInfo('http://github.com/owner/repo/pull/1');
    expect(result).toEqual({ owner: 'owner', repo: 'repo', number: 1 });
  });

  it('should handle hyphenated owner and repo names', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/my-org/my-repo/pull/55');
    expect(result).toEqual({ owner: 'my-org', repo: 'my-repo', number: 55 });
  });

  it('should handle underscored owner and repo names', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/my_org/my_repo/pull/100');
    expect(result).toEqual({ owner: 'my_org', repo: 'my_repo', number: 100 });
  });

  it('should return null for non-PR GitHub URL', () => {
    expect(ReviewClock.parsePrInfo('https://github.com/owner/repo')).toBeNull();
  });

  it('should return null for GitHub issues URL', () => {
    expect(ReviewClock.parsePrInfo('https://github.com/owner/repo/issues/42')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(ReviewClock.parsePrInfo('')).toBeNull();
  });

  it('should return null for null', () => {
    expect(ReviewClock.parsePrInfo(null)).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(ReviewClock.parsePrInfo(undefined)).toBeNull();
  });

  it('should return null for non-GitHub URL', () => {
    expect(ReviewClock.parsePrInfo('https://gitlab.com/owner/repo/pull/42')).toBeNull();
  });

  it('should return null for a number (not a string)', () => {
    expect(ReviewClock.parsePrInfo(12345)).toBeNull();
  });

  it('should parse PR number as integer', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/o/r/pull/007');
    expect(result.number).toBe(7);
    expect(typeof result.number).toBe('number');
  });

  it('should parse URLs with query parameters', () => {
    const result = ReviewClock.parsePrInfo('https://github.com/owner/repo/pull/42?diff=unified');
    expect(result).toEqual({ owner: 'owner', repo: 'repo', number: 42 });
  });
});

// ============================================================
// estimateReviewEffort
// ============================================================
describe('estimateReviewEffort', () => {
  it('should return Small for < 50 total lines', () => {
    const result = ReviewClock.estimateReviewEffort(3, 20, 10);
    expect(result.size).toBe('S');
    expect(result.label).toBe('Small');
  });

  it('should return Medium for 50-199 total lines', () => {
    const result = ReviewClock.estimateReviewEffort(5, 80, 70);
    expect(result.size).toBe('M');
    expect(result.label).toBe('Medium');
  });

  it('should return Large for 200-499 total lines', () => {
    const result = ReviewClock.estimateReviewEffort(10, 200, 100);
    expect(result.size).toBe('L');
    expect(result.label).toBe('Large');
  });

  it('should return XL for >= 500 total lines', () => {
    const result = ReviewClock.estimateReviewEffort(20, 400, 200);
    expect(result.size).toBe('XL');
    expect(result.label).toBe('XL');
  });

  it('should return estimated minutes', () => {
    const result = ReviewClock.estimateReviewEffort(5, 100, 50);
    expect(result.estimatedMinutes).toBeGreaterThan(0);
    expect(typeof result.estimatedMinutes).toBe('number');
  });

  it('should handle zero files changed', () => {
    const result = ReviewClock.estimateReviewEffort(0, 10, 5);
    expect(result.size).toBe('S');
    expect(result.estimatedMinutes).toBeGreaterThan(0);
  });

  it('should handle zero additions', () => {
    const result = ReviewClock.estimateReviewEffort(3, 0, 20);
    expect(result.size).toBe('S');
  });

  it('should handle zero deletions', () => {
    const result = ReviewClock.estimateReviewEffort(3, 30, 0);
    expect(result.size).toBe('S');
  });

  it('should handle all zeros', () => {
    const result = ReviewClock.estimateReviewEffort(0, 0, 0);
    expect(result.size).toBe('S');
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(5);
  });

  it('should handle null values', () => {
    const result = ReviewClock.estimateReviewEffort(null, null, null);
    expect(result.size).toBe('S');
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(5);
  });

  it('should return at least 5 minutes for Small', () => {
    const result = ReviewClock.estimateReviewEffort(1, 1, 0);
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(5);
  });

  it('should return at least 10 minutes for Medium', () => {
    const result = ReviewClock.estimateReviewEffort(1, 50, 0);
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(10);
  });

  it('should return at least 20 minutes for Large', () => {
    const result = ReviewClock.estimateReviewEffort(1, 200, 0);
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(20);
  });

  it('should return at least 30 minutes for XL', () => {
    const result = ReviewClock.estimateReviewEffort(1, 500, 0);
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(30);
  });

  it('should increase estimate with more files changed', () => {
    const few = ReviewClock.estimateReviewEffort(2, 100, 50);
    const many = ReviewClock.estimateReviewEffort(20, 100, 50);
    expect(many.estimatedMinutes).toBeGreaterThan(few.estimatedMinutes);
  });

  it('should handle boundary at exactly 50 lines (Medium)', () => {
    const result = ReviewClock.estimateReviewEffort(1, 30, 20);
    expect(result.size).toBe('M');
  });

  it('should handle boundary at exactly 200 lines (Large)', () => {
    const result = ReviewClock.estimateReviewEffort(1, 100, 100);
    expect(result.size).toBe('L');
  });

  it('should handle boundary at exactly 500 lines (XL)', () => {
    const result = ReviewClock.estimateReviewEffort(1, 250, 250);
    expect(result.size).toBe('XL');
  });

  it('should handle very large PRs', () => {
    const result = ReviewClock.estimateReviewEffort(100, 5000, 3000);
    expect(result.size).toBe('XL');
    expect(result.estimatedMinutes).toBeGreaterThan(100);
  });
});

// ============================================================
// Edge Cases
// ============================================================
describe('Edge Cases', () => {
  it('should handle zero duration session in stats', () => {
    const session = {
      id: 'test',
      prUrl: 'url',
      prTitle: 'Zero PR',
      prAuthor: 'author',
      startTime: new Date('2026-03-09T12:00:00Z').getTime(),
      elapsed: 0,
      isActive: false
    };
    const stats = ReviewClock.getWeeklyStats([session], '2026-W11');
    expect(stats.totalTime).toBe(0);
    expect(stats.prCount).toBe(1);
    expect(stats.avgTime).toBe(0);
  });

  it('should handle session with very large elapsed time', () => {
    const tenHours = 36000000;
    expect(ReviewClock.formatDuration(tenHours)).toBe('10h');
  });

  it('should handle getDayName for all days of the week', () => {
    // 2026-03-09 is Monday, 2026-03-15 is Sunday
    expect(ReviewClock.getDayName(new Date('2026-03-09T12:00:00Z'))).toBe('Mon');
    expect(ReviewClock.getDayName(new Date('2026-03-10T12:00:00Z'))).toBe('Tue');
    expect(ReviewClock.getDayName(new Date('2026-03-11T12:00:00Z'))).toBe('Wed');
    expect(ReviewClock.getDayName(new Date('2026-03-12T12:00:00Z'))).toBe('Thu');
    expect(ReviewClock.getDayName(new Date('2026-03-13T12:00:00Z'))).toBe('Fri');
    expect(ReviewClock.getDayName(new Date('2026-03-14T12:00:00Z'))).toBe('Sat');
    expect(ReviewClock.getDayName(new Date('2026-03-15T12:00:00Z'))).toBe('Sun');
  });

  it('should handle isSessionInWeek for matching session', () => {
    const session = {
      startTime: new Date('2026-03-11T12:00:00Z').getTime()
    };
    expect(ReviewClock.isSessionInWeek(session, '2026-W11')).toBe(true);
  });

  it('should handle isSessionInWeek for non-matching session', () => {
    const session = {
      startTime: new Date('2026-03-02T12:00:00Z').getTime()
    };
    expect(ReviewClock.isSessionInWeek(session, '2026-W11')).toBe(false);
  });

  it('should handle isSessionInWeek with null session', () => {
    expect(ReviewClock.isSessionInWeek(null, '2026-W11')).toBe(false);
  });

  it('should handle isSessionInWeek with empty weekKey', () => {
    const session = { startTime: Date.now() };
    expect(ReviewClock.isSessionInWeek(session, '')).toBe(false);
  });

  it('should handle cross-midnight session (elapsed recorded, not time-of-day dependent)', () => {
    // Session started at 11:30 PM, elapsed 2 hours
    const session = {
      id: 'late',
      prUrl: 'url',
      prTitle: 'Late night PR',
      prAuthor: 'author',
      startTime: new Date('2026-03-09T23:30:00Z').getTime(),
      elapsed: 7200000, // 2 hours
      isActive: false
    };
    const stats = ReviewClock.getWeeklyStats([session], '2026-W11');
    expect(stats.totalTime).toBe(7200000);
    // Session is attributed to Monday (start day)
    expect(stats.dailyBreakdown.Mon).toBe(7200000);
  });

  it('should correctly compute weekly stats with sessions from multiple weeks', () => {
    const sessions = [
      {
        id: 'w10', prUrl: 'url1', prTitle: 'W10 PR', prAuthor: 'a',
        startTime: new Date('2026-03-02T12:00:00Z').getTime(),
        elapsed: 100000, isActive: false
      },
      {
        id: 'w11', prUrl: 'url2', prTitle: 'W11 PR', prAuthor: 'a',
        startTime: new Date('2026-03-09T12:00:00Z').getTime(),
        elapsed: 200000, isActive: false
      },
      {
        id: 'w12', prUrl: 'url3', prTitle: 'W12 PR', prAuthor: 'a',
        startTime: new Date('2026-03-16T12:00:00Z').getTime(),
        elapsed: 300000, isActive: false
      },
    ];
    const w11Stats = ReviewClock.getWeeklyStats(sessions, '2026-W11');
    expect(w11Stats.totalTime).toBe(200000);
    expect(w11Stats.prCount).toBe(1);
  });
});

// ============================================================
// Integration: Full workflow
// ============================================================
describe('Integration: Full Review Workflow', () => {
  it('should track a complete review session lifecycle', () => {
    // 1. Create session
    let session = ReviewClock.createSession(
      'https://github.com/myorg/myapp/pull/123',
      'Add user authentication',
      'bob'
    );
    expect(session.isActive).toBe(true);
    expect(session.elapsed).toBe(0);

    const t0 = session.startTime;

    // 2. Review for 5 minutes (simulated via updateSession)
    session = ReviewClock.updateSession(session, t0 + 300000);
    expect(session.elapsed).toBe(300000);

    // 3. Pause (manually set inactive since pauseSession uses real Date.now()
    //    which won't match our simulated future timestamps)
    session = Object.assign({}, session, { isActive: false });
    expect(session.isActive).toBe(false);
    expect(session.elapsed).toBe(300000);

    // 4. Resume after break
    session = ReviewClock.resumeSession(session);
    expect(session.isActive).toBe(true);

    // 5. Review for 10 more minutes
    session = ReviewClock.updateSession(session, session.startTime + 600000);

    // 6. Final elapsed should be exactly 15 minutes
    expect(session.elapsed).toBe(900000);

    // 7. Format the duration
    const formatted = ReviewClock.formatDuration(session.elapsed);
    expect(formatted).toBe('15m');
  });

  it('should correctly aggregate multiple PRs in weekly stats', () => {
    const baseTime = new Date('2026-03-09T09:00:00Z').getTime();

    const sessions = [
      {
        id: 's1', prUrl: 'https://github.com/o/r/pull/1',
        prTitle: 'Feature A', prAuthor: 'alice',
        startTime: baseTime, elapsed: 600000, isActive: false // 10 min
      },
      {
        id: 's2', prUrl: 'https://github.com/o/r/pull/1',
        prTitle: 'Feature A', prAuthor: 'alice',
        startTime: baseTime + 3600000, elapsed: 300000, isActive: false // 5 more min
      },
      {
        id: 's3', prUrl: 'https://github.com/o/r/pull/2',
        prTitle: 'Bug Fix B', prAuthor: 'charlie',
        startTime: new Date('2026-03-10T14:00:00Z').getTime(),
        elapsed: 1200000, isActive: false // 20 min
      },
    ];

    const stats = ReviewClock.getWeeklyStats(sessions, '2026-W11');

    expect(stats.totalTime).toBe(2100000); // 35 min
    expect(stats.prCount).toBe(2);
    expect(stats.avgTime).toBe(1050000); // 17.5 min avg
    expect(stats.longestReview.prTitle).toBe('Bug Fix B');
    expect(stats.longestReview.elapsed).toBe(1200000);
    expect(stats.dailyBreakdown.Mon).toBe(900000);  // 15 min
    expect(stats.dailyBreakdown.Tue).toBe(1200000); // 20 min
  });
});
