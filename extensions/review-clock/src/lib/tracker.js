// tracker.js — Core time tracking logic for Review Clock
// Loaded as a content script (no ES module imports).
// Functions are attached to a global ReviewClock namespace.

const ReviewClock = (() => {
  /**
   * Create a new review session for a PR
   * @param {string} prUrl - Full GitHub PR URL
   * @param {string} prTitle - PR title text
   * @param {string} prAuthor - PR author username
   * @returns {object} New session object
   */
  function createSession(prUrl, prTitle, prAuthor) {
    return {
      id: generateId(),
      prUrl: prUrl || '',
      prTitle: prTitle || '',
      prAuthor: prAuthor || '',
      startTime: Date.now(),
      elapsed: 0,
      isActive: true
    };
  }

  /**
   * Generate a unique session ID
   * @returns {string} Unique ID string
   */
  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Update elapsed time for an active session
   * @param {object} session - Current session object
   * @param {number} now - Current timestamp in ms
   * @returns {object} Updated session with new elapsed time
   */
  function updateSession(session, now) {
    if (!session || !session.isActive) return session;
    var currentNow = now || Date.now();
    var additionalTime = currentNow - session.startTime;
    return Object.assign({}, session, {
      elapsed: session.elapsed + additionalTime,
      startTime: currentNow
    });
  }

  /**
   * Pause a session (tab loses focus or user idle)
   * Records elapsed time so far and marks inactive
   * @param {object} session - Current session object
   * @returns {object} Paused session
   */
  function pauseSession(session) {
    if (!session || !session.isActive) return session;
    var now = Date.now();
    var additionalTime = now - session.startTime;
    return Object.assign({}, session, {
      elapsed: session.elapsed + additionalTime,
      isActive: false,
      startTime: now
    });
  }

  /**
   * Resume a paused session
   * Resets startTime to now, keeps accumulated elapsed
   * @param {object} session - Paused session object
   * @returns {object} Resumed session
   */
  function resumeSession(session) {
    if (!session) return session;
    return Object.assign({}, session, {
      startTime: Date.now(),
      isActive: true
    });
  }

  /**
   * Format milliseconds as human-readable duration
   * Under 60s: "45s"
   * Under 60m: "12m 30s"
   * Over 60m:  "1h 15m"
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration string
   */
  function formatDuration(ms) {
    if (!ms || ms < 0) return '0s';
    if (ms < 1000) return '0s';

    var totalSeconds = Math.floor(ms / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    if (hours > 0) {
      // Over 60 minutes: show hours and minutes
      if (minutes > 0) {
        return hours + 'h ' + minutes + 'm';
      }
      return hours + 'h';
    }

    if (minutes > 0) {
      // Under 60 minutes: show minutes and seconds
      if (seconds > 0) {
        return minutes + 'm ' + seconds + 's';
      }
      return minutes + 'm';
    }

    // Under 1 minute: show seconds only
    return seconds + 's';
  }

  /**
   * Format milliseconds as timer display (MM:SS or HH:MM:SS)
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Timer format string
   */
  function formatTimer(ms) {
    if (!ms || ms < 0) return '00:00';

    var totalSeconds = Math.floor(ms / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };

    if (hours > 0) {
      return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
    }
    return pad(minutes) + ':' + pad(seconds);
  }

  /**
   * Get ISO week key for a given date, like "2026-W11"
   * Uses ISO 8601 week numbering (week starts Monday)
   * @param {Date} date - Date object
   * @returns {string} Week key string
   */
  function getWeekKey(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    // ISO week calculation
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday = 7
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return d.getUTCFullYear() + '-W' + (weekNum < 10 ? '0' : '') + weekNum;
  }

  /**
   * Get day-of-week name from a date
   * @param {Date} date - Date object
   * @returns {string} Day name (Mon, Tue, etc.)
   */
  function getDayName(date) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  /**
   * Check if a session belongs to a given ISO week
   * @param {object} session - Session object with startTime
   * @param {string} weekKey - Week key like "2026-W11"
   * @returns {boolean} True if session is in the given week
   */
  function isSessionInWeek(session, weekKey) {
    if (!session || !session.startTime || !weekKey) return false;
    var sessionDate = new Date(session.startTime);
    return getWeekKey(sessionDate) === weekKey;
  }

  /**
   * Aggregate weekly stats from sessions
   * @param {Array} sessions - Array of session objects
   * @param {string} weekKey - Week key to filter by
   * @returns {object} Weekly stats: totalTime, prCount, avgTime, longestReview, dailyBreakdown
   */
  function getWeeklyStats(sessions, weekKey) {
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0 || !weekKey) {
      return {
        totalTime: 0,
        prCount: 0,
        avgTime: 0,
        longestReview: null,
        dailyBreakdown: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      };
    }

    var weekSessions = sessions.filter(function(s) {
      return isSessionInWeek(s, weekKey);
    });

    if (weekSessions.length === 0) {
      return {
        totalTime: 0,
        prCount: 0,
        avgTime: 0,
        longestReview: null,
        dailyBreakdown: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      };
    }

    // Aggregate by PR URL to get unique PR count and total time per PR
    var prMap = {};
    weekSessions.forEach(function(s) {
      var key = s.prUrl || s.id;
      if (!prMap[key]) {
        prMap[key] = {
          prUrl: s.prUrl,
          prTitle: s.prTitle,
          totalElapsed: 0,
          sessions: []
        };
      }
      prMap[key].totalElapsed += (s.elapsed || 0);
      prMap[key].sessions.push(s);
    });

    var prKeys = Object.keys(prMap);
    var totalTime = 0;
    var longestReview = null;
    var longestTime = 0;

    prKeys.forEach(function(key) {
      var pr = prMap[key];
      totalTime += pr.totalElapsed;
      if (pr.totalElapsed > longestTime) {
        longestTime = pr.totalElapsed;
        longestReview = {
          prUrl: pr.prUrl,
          prTitle: pr.prTitle,
          elapsed: pr.totalElapsed
        };
      }
    });

    var prCount = prKeys.length;
    var avgTime = prCount > 0 ? Math.round(totalTime / prCount) : 0;

    return {
      totalTime: totalTime,
      prCount: prCount,
      avgTime: avgTime,
      longestReview: longestReview,
      dailyBreakdown: getDailyBreakdown(weekSessions, weekKey)
    };
  }

  /**
   * Calculate time spent per day of week for sessions in a given week
   * @param {Array} sessions - Array of session objects (pre-filtered or not)
   * @param {string} weekKey - Week key to filter by
   * @returns {object} Time per day: { Mon: ms, Tue: ms, ... }
   */
  function getDailyBreakdown(sessions, weekKey) {
    var breakdown = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return breakdown;
    }

    sessions.forEach(function(s) {
      if (weekKey && !isSessionInWeek(s, weekKey)) return;
      var date = new Date(s.startTime);
      var day = getDayName(date);
      breakdown[day] += (s.elapsed || 0);
    });

    return breakdown;
  }

  /**
   * Parse owner, repo, and PR number from a GitHub PR URL
   * @param {string} url - GitHub PR URL
   * @returns {object|null} { owner, repo, number } or null if invalid
   */
  function parsePrInfo(url) {
    if (!url || typeof url !== 'string') return null;

    // Match: https://github.com/owner/repo/pull/123
    // Also match with optional trailing path segments (files, commits, etc.)
    var match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!match) return null;

    return {
      owner: match[1],
      repo: match[2],
      number: parseInt(match[3], 10)
    };
  }

  /**
   * Estimate review effort based on diff size
   * @param {number} filesChanged - Number of files changed
   * @param {number} additions - Lines added
   * @param {number} deletions - Lines deleted
   * @returns {object} { size, label, estimatedMinutes }
   */
  function estimateReviewEffort(filesChanged, additions, deletions) {
    var totalLines = (additions || 0) + (deletions || 0);
    var files = filesChanged || 0;

    var size, label, estimatedMinutes;

    if (totalLines < 50) {
      size = 'S';
      label = 'Small';
      estimatedMinutes = Math.max(5, Math.round(totalLines * 0.2 + files * 1));
    } else if (totalLines < 200) {
      size = 'M';
      label = 'Medium';
      estimatedMinutes = Math.max(10, Math.round(totalLines * 0.15 + files * 2));
    } else if (totalLines < 500) {
      size = 'L';
      label = 'Large';
      estimatedMinutes = Math.max(20, Math.round(totalLines * 0.12 + files * 2.5));
    } else {
      size = 'XL';
      label = 'XL';
      estimatedMinutes = Math.max(30, Math.round(totalLines * 0.1 + files * 3));
    }

    return {
      size: size,
      label: label,
      estimatedMinutes: estimatedMinutes
    };
  }

  // Expose functions via global namespace
  return {
    createSession: createSession,
    updateSession: updateSession,
    pauseSession: pauseSession,
    resumeSession: resumeSession,
    formatDuration: formatDuration,
    formatTimer: formatTimer,
    getWeekKey: getWeekKey,
    getDayName: getDayName,
    isSessionInWeek: isSessionInWeek,
    getWeeklyStats: getWeeklyStats,
    getDailyBreakdown: getDailyBreakdown,
    parsePrInfo: parsePrInfo,
    estimateReviewEffort: estimateReviewEffort
  };
})();

// Export for testing (Node.js / Vitest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewClock;
}
