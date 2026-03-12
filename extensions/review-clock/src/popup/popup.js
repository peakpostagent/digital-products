// popup.js — Review Clock popup stats display logic

(() => {
  const STORAGE_KEY = 'reviewclock_sessions';
  const SETTINGS_KEY = 'reviewclock_settings';

  let currentWeekOffset = 0; // 0 = this week, -1 = last week, etc.

  // ---- Initialize ----
  document.addEventListener('DOMContentLoaded', function() {
    loadAndDisplay();
    setupNavigation();
    setupSettings();
  });

  /**
   * Load sessions from storage and display stats
   */
  function loadAndDisplay() {
    chrome.storage.local.get([STORAGE_KEY], function(result) {
      var sessions = result[STORAGE_KEY] || [];
      var targetDate = getDateForOffset(currentWeekOffset);
      var weekKey = ReviewClock.getWeekKey(targetDate);

      updateWeekLabel(targetDate);
      displayStats(sessions, weekKey);
      displayChart(sessions, weekKey);
      displayRecentReviews(sessions, weekKey);
    });
  }

  /**
   * Get a date object for the given week offset from current week
   */
  function getDateForOffset(offset) {
    var now = new Date();
    now.setDate(now.getDate() + (offset * 7));
    return now;
  }

  /**
   * Update the week label in the navigation
   */
  function updateWeekLabel(date) {
    var label = document.getElementById('weekLabel');
    var nextBtn = document.getElementById('nextWeek');

    if (currentWeekOffset === 0) {
      label.textContent = 'This Week';
      nextBtn.disabled = true;
    } else if (currentWeekOffset === -1) {
      label.textContent = 'Last Week';
      nextBtn.disabled = false;
    } else {
      var weekKey = ReviewClock.getWeekKey(date);
      label.textContent = weekKey;
      nextBtn.disabled = false;
    }
  }

  /**
   * Set up week navigation buttons
   */
  function setupNavigation() {
    document.getElementById('prevWeek').addEventListener('click', function() {
      currentWeekOffset--;
      loadAndDisplay();
    });

    document.getElementById('nextWeek').addEventListener('click', function() {
      if (currentWeekOffset < 0) {
        currentWeekOffset++;
        loadAndDisplay();
      }
    });
  }

  /**
   * Set up settings controls
   */
  function setupSettings() {
    // Load current settings
    chrome.storage.local.get([SETTINGS_KEY], function(result) {
      var settings = result[SETTINGS_KEY] || { idleTimeout: 120000, autoStart: true };

      var idleSelect = document.getElementById('idleTimeout');
      var autoCheck = document.getElementById('autoStart');

      idleSelect.value = String(settings.idleTimeout || 120000);
      autoCheck.checked = settings.autoStart !== false;

      // Save on change
      idleSelect.addEventListener('change', function() {
        saveSettings();
      });
      autoCheck.addEventListener('change', function() {
        saveSettings();
      });
    });
  }

  /**
   * Save settings to storage and notify content script
   */
  function saveSettings() {
    var idleSelect = document.getElementById('idleTimeout');
    var autoCheck = document.getElementById('autoStart');

    var settings = {
      idleTimeout: parseInt(idleSelect.value, 10),
      autoStart: autoCheck.checked
    };

    var data = {};
    data[SETTINGS_KEY] = settings;
    chrome.storage.local.set(data, function() {
      // Notify active tab's content script
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' }).catch(function() {
            // Content script may not be loaded on this tab
          });
        }
      });
    });
  }

  /**
   * Display summary stats
   */
  function displayStats(sessions, weekKey) {
    var stats = ReviewClock.getWeeklyStats(sessions, weekKey);

    document.getElementById('totalTime').textContent = ReviewClock.formatDuration(stats.totalTime);
    document.getElementById('prCount').textContent = stats.prCount;
    document.getElementById('avgTime').textContent = ReviewClock.formatDuration(stats.avgTime);

    var longestEl = document.getElementById('longestReview');
    if (stats.longestReview) {
      var title = stats.longestReview.prTitle || 'Untitled';
      if (title.length > 35) title = title.slice(0, 32) + '...';
      longestEl.textContent = ReviewClock.formatDuration(stats.longestReview.elapsed) + ' - ' + title;
    } else {
      longestEl.textContent = '--';
    }
  }

  /**
   * Display the daily breakdown bar chart
   */
  function displayChart(sessions, weekKey) {
    var stats = ReviewClock.getWeeklyStats(sessions, weekKey);
    var breakdown = stats.dailyBreakdown;
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Find max for scaling
    var maxTime = 0;
    days.forEach(function(day) {
      if (breakdown[day] > maxTime) maxTime = breakdown[day];
    });

    days.forEach(function(day) {
      var bar = document.getElementById('bar' + day);
      var val = document.getElementById('val' + day);

      if (maxTime > 0 && breakdown[day] > 0) {
        var pct = Math.round((breakdown[day] / maxTime) * 100);
        bar.style.height = Math.max(pct, 4) + '%';
        bar.style.opacity = '1';
        val.textContent = ReviewClock.formatDuration(breakdown[day]);
      } else {
        bar.style.height = '2%';
        bar.style.opacity = '0.3';
        val.textContent = '';
      }
    });
  }

  /**
   * Display recent reviews list
   */
  function displayRecentReviews(sessions, weekKey) {
    var container = document.getElementById('recentList');

    // Get sessions for this week, sorted by most recent
    var weekSessions = sessions.filter(function(s) {
      return ReviewClock.isSessionInWeek(s, weekKey);
    }).sort(function(a, b) {
      return b.startTime - a.startTime;
    });

    // Deduplicate by PR URL, keeping most recent and summing elapsed
    var prMap = {};
    var prOrder = [];
    weekSessions.forEach(function(s) {
      var key = s.prUrl || s.id;
      if (!prMap[key]) {
        prMap[key] = {
          prUrl: s.prUrl,
          prTitle: s.prTitle,
          prAuthor: s.prAuthor,
          totalElapsed: 0,
          lastDate: s.startTime
        };
        prOrder.push(key);
      }
      prMap[key].totalElapsed += (s.elapsed || 0);
      if (s.startTime > prMap[key].lastDate) {
        prMap[key].lastDate = s.startTime;
      }
    });

    if (prOrder.length === 0) {
      container.innerHTML = '<p class="rc-empty">No reviews this week. Open a GitHub PR to start tracking.</p>';
      return;
    }

    // Show last 10
    var html = '';
    var shown = prOrder.slice(0, 10);
    shown.forEach(function(key) {
      var pr = prMap[key];
      var title = pr.prTitle || 'Untitled PR';
      var info = ReviewClock.parsePrInfo(pr.prUrl);
      var repoName = info ? info.owner + '/' + info.repo : '';
      var prNumber = info ? '#' + info.number : '';
      var date = new Date(pr.lastDate);
      var dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      html += '<div class="rc-review-item">' +
        '<div class="rc-review-title">' +
          '<a href="' + escapeAttr(pr.prUrl) + '" target="_blank" rel="noopener">' +
            escapeHtml(truncate(title, 45)) +
          '</a>' +
          (prNumber ? ' <span class="rc-review-number">' + prNumber + '</span>' : '') +
        '</div>' +
        '<div class="rc-review-meta">' +
          (repoName ? '<span class="rc-review-repo">' + escapeHtml(repoName) + '</span>' : '') +
          '<span class="rc-review-duration">' + ReviewClock.formatDuration(pr.totalElapsed) + '</span>' +
          '<span class="rc-review-date">' + dateStr + '</span>' +
        '</div>' +
      '</div>';
    });

    container.innerHTML = html;
  }

  /**
   * Escape HTML entities
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }

  /**
   * Escape for HTML attributes
   */
  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
  }

  /**
   * Truncate string to max length
   */
  function truncate(str, max) {
    if (!str) return '';
    if (str.length <= max) return str;
    return str.slice(0, max - 3) + '...';
  }
})();
