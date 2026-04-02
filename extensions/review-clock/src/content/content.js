// content.js — Review Clock content script for GitHub PR pages
// Detects PR pages, injects timer UI, tracks review time

(() => {
  // ---- Constants ----
  const SAVE_INTERVAL_MS = 30000;   // Save every 30 seconds
  const IDLE_TIMEOUT_DEFAULT = 120000; // 2 minutes default idle timeout
  const STORAGE_KEY = 'reviewclock_sessions';
  const SETTINGS_KEY = 'reviewclock_settings';

  // ---- State ----
  let currentSession = null;
  let timerHost = null;
  let statsHost = null;
  let timerInterval = null;
  let saveInterval = null;
  let idleTimer = null;
  let isCompact = true;
  let settings = { idleTimeout: IDLE_TIMEOUT_DEFAULT, autoStart: true };
  let lastActivityTime = Date.now();
  let isUserIdle = false;

  // ---- Initialize ----
  loadSettings(function() {
    checkAndStart();
    setupObserver();
    setupIdleDetection();
    setupVisibilityTracking();
    setupBeforeUnload();
    setupMessageListener();
  });

  /**
   * Load settings from chrome.storage.local
   */
  function loadSettings(callback) {
    chrome.storage.local.get([SETTINGS_KEY], function(result) {
      if (result[SETTINGS_KEY]) {
        settings = Object.assign(settings, result[SETTINGS_KEY]);
      }
      if (callback) callback();
    });
  }

  /**
   * Listen for messages from popup or service worker
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
      if (msg.type === 'GET_ACTIVE_SESSION') {
        if (currentSession) {
          // Update elapsed before sending
          var now = Date.now();
          if (currentSession.isActive) {
            currentSession = ReviewClock.updateSession(currentSession, now);
          }
          sendResponse({ session: currentSession });
        } else {
          sendResponse({ session: null });
        }
      }
      if (msg.type === 'PAUSE_SESSION') {
        if (currentSession && currentSession.isActive) {
          currentSession = ReviewClock.pauseSession(currentSession);
          updateTimerDisplay();
          saveSession();
        }
        sendResponse({ ok: true });
      }
      if (msg.type === 'RESUME_SESSION') {
        if (currentSession && !currentSession.isActive) {
          currentSession = ReviewClock.resumeSession(currentSession);
          updateTimerDisplay();
        }
        sendResponse({ ok: true });
      }
      if (msg.type === 'SETTINGS_UPDATED') {
        loadSettings();
        sendResponse({ ok: true });
      }
      return true;
    });
  }

  /**
   * Check if current page is a GitHub PR and start tracking
   */
  function checkAndStart() {
    if (!isGitHubPrPage()) {
      cleanup();
      return;
    }

    var prInfo = ReviewClock.parsePrInfo(window.location.href);
    if (!prInfo) {
      cleanup();
      return;
    }

    // Check if we already have a session for this PR
    var prUrl = window.location.href.split('?')[0].split('#')[0];
    // Normalize URL to base PR URL (remove /files, /commits, etc.)
    prUrl = prUrl.replace(/\/(files|commits|checks).*$/, '');

    if (currentSession && currentSession.prUrl === prUrl) {
      // Same PR, keep going
      if (!currentSession.isActive && settings.autoStart) {
        currentSession = ReviewClock.resumeSession(currentSession);
      }
      return;
    }

    // Save old session if exists
    if (currentSession) {
      finishSession();
    }

    // Load existing session for this PR or create new one
    loadExistingSession(prUrl, function(existingSession) {
      if (existingSession && settings.autoStart) {
        currentSession = ReviewClock.resumeSession(existingSession);
      } else if (!existingSession && settings.autoStart) {
        var prTitle = getPrTitle();
        var prAuthor = getPrAuthor();
        currentSession = ReviewClock.createSession(prUrl, prTitle, prAuthor);
      } else if (existingSession) {
        currentSession = existingSession;
      }

      if (currentSession) {
        injectTimerUI();
        injectStatsOverlay();
        startTimerUpdate();
        startAutoSave();
      }
    });
  }

  /**
   * Check if current URL matches a GitHub PR page pattern
   */
  function isGitHubPrPage() {
    return /github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/.test(window.location.href);
  }

  /**
   * Extract PR title from the page DOM
   */
  function getPrTitle() {
    // GitHub PR title is usually in a bdi element inside h1
    var bdi = document.querySelector('.gh-header-title .js-issue-title');
    if (bdi) return bdi.textContent.trim();

    var h1 = document.querySelector('.gh-header-title');
    if (h1) return h1.textContent.trim();

    // Fallback to page title
    var title = document.title.replace(/ \u00B7 Pull Request.*$/, '').trim();
    return title || 'Untitled PR';
  }

  /**
   * Extract PR author from the page DOM
   */
  function getPrAuthor() {
    var authorLink = document.querySelector('.gh-header-meta .author');
    if (authorLink) return authorLink.textContent.trim();

    // Fallback: check meta or other selectors
    var authorEl = document.querySelector('[data-hovercard-type="user"]');
    if (authorEl) return authorEl.textContent.trim();

    return '';
  }

  /**
   * Get PR diff stats from the page (files changed, additions, deletions)
   */
  function getPrStats() {
    var stats = { filesChanged: 0, additions: 0, deletions: 0 };

    // Try the diffstat on the PR page
    var diffstat = document.querySelector('#diffstat');
    if (diffstat) {
      var text = diffstat.textContent;
      var filesMatch = text.match(/(\d+)\s*files?\s*changed/);
      var addMatch = text.match(/(\d+)\s*additions?/);
      var delMatch = text.match(/(\d+)\s*deletions?/);
      if (filesMatch) stats.filesChanged = parseInt(filesMatch[1], 10);
      if (addMatch) stats.additions = parseInt(addMatch[1], 10);
      if (delMatch) stats.deletions = parseInt(delMatch[1], 10);
      return stats;
    }

    // Try the files changed tab counter
    var filesTab = document.querySelector('#files_tab_counter');
    if (filesTab) {
      stats.filesChanged = parseInt(filesTab.textContent.trim(), 10) || 0;
    }

    // Try the toc-diff-stats (newer GitHub UI)
    var tocStats = document.querySelector('.toc-diff-stats');
    if (tocStats) {
      var strong = tocStats.querySelectorAll('strong');
      if (strong.length >= 1) stats.filesChanged = parseInt(strong[0].textContent, 10) || 0;
      if (strong.length >= 2) stats.additions = parseInt(strong[1].textContent, 10) || 0;
      if (strong.length >= 3) stats.deletions = parseInt(strong[2].textContent, 10) || 0;
      return stats;
    }

    // Fallback: try .diffstat-summary or similar
    var summary = document.querySelector('.js-diff-progressive-container');
    if (summary) {
      var fileHeaders = summary.querySelectorAll('.file-header');
      stats.filesChanged = fileHeaders.length;
    }

    return stats;
  }

  /**
   * Load an existing session for this PR URL from storage
   */
  function loadExistingSession(prUrl, callback) {
    chrome.storage.local.get([STORAGE_KEY], function(result) {
      var sessions = result[STORAGE_KEY] || [];
      // Find the most recent session for this PR URL
      var existing = null;
      for (var i = sessions.length - 1; i >= 0; i--) {
        if (sessions[i].prUrl === prUrl) {
          existing = sessions[i];
          break;
        }
      }
      callback(existing);
    });
  }

  /**
   * Inject the floating timer UI using Shadow DOM
   */
  function injectTimerUI() {
    removeTimerUI();

    var host = document.createElement('div');
    host.id = 'rc-timer-host';
    host.style.cssText = 'position:fixed; top:64px; right:16px; z-index:99999; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: 'closed' });

    var style = document.createElement('style');
    style.textContent = getTimerStyles();
    shadow.appendChild(style);

    var container = document.createElement('div');
    container.className = 'rc-timer' + (isCompact ? ' rc-compact' : '');
    container.innerHTML = buildTimerHTML();
    shadow.appendChild(container);

    // Wire up event handlers (expand button handled inside wireUpButtons)
    wireUpButtons(shadow, container);

    timerHost = { host: host, shadow: shadow, container: container };
  }

  /**
   * Wire up interactive buttons inside the timer UI
   */
  function wireUpButtons(shadow, container) {
    var expandBtn = shadow.querySelector('.rc-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        isCompact = !isCompact;
        container.className = 'rc-timer' + (isCompact ? ' rc-compact' : '');
        container.innerHTML = buildTimerHTML();
        wireUpButtons(shadow, container);
      });
    }

    var pauseBtn = shadow.querySelector('.rc-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (currentSession && currentSession.isActive) {
          currentSession = ReviewClock.pauseSession(currentSession);
          saveSession();
        } else if (currentSession && !currentSession.isActive) {
          currentSession = ReviewClock.resumeSession(currentSession);
        }
        updateTimerDisplay();
      });
    }
  }

  /**
   * Build the timer HTML content
   */
  function buildTimerHTML() {
    if (!currentSession) return '';

    var elapsed = getDisplayElapsed();
    var timerText = ReviewClock.formatTimer(elapsed);
    var isActive = currentSession.isActive;

    if (isCompact) {
      return '<div class="rc-compact-bar">' +
        '<span class="rc-timer-text">' + timerText + '</span>' +
        '<button class="rc-expand-btn" title="Expand">' +
          '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>' +
        '</button>' +
      '</div>';
    }

    return '<div class="rc-expanded-bar">' +
      '<div class="rc-header">' +
        '<span class="rc-timer-text rc-large">' + timerText + '</span>' +
        '<button class="rc-expand-btn" title="Collapse">' +
          '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="rc-pr-title">' + escapeHtml(truncate(currentSession.prTitle, 50)) + '</div>' +
      '<div class="rc-controls">' +
        '<button class="rc-pause-btn">' + (isActive ? 'Pause' : 'Resume') + '</button>' +
        '<span class="rc-status">' + (isActive ? 'Reviewing' : 'Paused') + '</span>' +
      '</div>' +
    '</div>';
  }

  /**
   * Inject the PR stats overlay at the top of the files view
   */
  function injectStatsOverlay() {
    removeStatsOverlay();

    var stats = getPrStats();
    if (stats.filesChanged === 0 && stats.additions === 0 && stats.deletions === 0) {
      return; // No stats to show
    }

    var effort = ReviewClock.estimateReviewEffort(stats.filesChanged, stats.additions, stats.deletions);

    // Find a good insertion point
    var target = document.querySelector('#files_tab_counter') ||
                 document.querySelector('.pr-review-tools') ||
                 document.querySelector('.tabnav-tabs') ||
                 document.querySelector('.gh-header-actions');

    if (!target) return;

    var host = document.createElement('div');
    host.id = 'rc-stats-host';
    host.style.cssText = 'display:inline-block; margin-left:8px; vertical-align:middle; z-index:100;';

    // Insert after the target's parent if it's a tab counter
    if (target.id === 'files_tab_counter') {
      target.parentNode.insertBefore(host, target.nextSibling);
    } else {
      target.appendChild(host);
    }

    var shadow = host.attachShadow({ mode: 'closed' });

    var style = document.createElement('style');
    style.textContent = getStatsStyles();
    shadow.appendChild(style);

    var badge = document.createElement('span');
    badge.className = 'rc-effort-badge rc-effort-' + effort.size.toLowerCase();
    badge.textContent = effort.label + ' (~' + effort.estimatedMinutes + 'min)';
    badge.title = stats.filesChanged + ' files, +' + stats.additions + ' -' + stats.deletions;
    shadow.appendChild(badge);

    statsHost = host;
  }

  /**
   * Update the timer display without rebuilding the whole UI
   */
  function updateTimerDisplay() {
    if (!timerHost || !timerHost.container) return;

    var timerTexts = timerHost.shadow.querySelectorAll('.rc-timer-text');
    if (timerTexts.length > 0) {
      var elapsed = getDisplayElapsed();
      var timerText = ReviewClock.formatTimer(elapsed);
      timerTexts.forEach(function(el) { el.textContent = timerText; });
    }

    // Update pause button and status
    if (!isCompact && currentSession) {
      var pauseBtn = timerHost.shadow.querySelector('.rc-pause-btn');
      var status = timerHost.shadow.querySelector('.rc-status');
      if (pauseBtn) pauseBtn.textContent = currentSession.isActive ? 'Pause' : 'Resume';
      if (status) status.textContent = currentSession.isActive ? 'Reviewing' : 'Paused';
    }
  }

  /**
   * Get current display elapsed time
   */
  function getDisplayElapsed() {
    if (!currentSession) return 0;
    if (currentSession.isActive) {
      return currentSession.elapsed + (Date.now() - currentSession.startTime);
    }
    return currentSession.elapsed;
  }

  /**
   * Start the 1-second timer update interval
   */
  function startTimerUpdate() {
    stopTimerUpdate();
    timerInterval = setInterval(function() {
      updateTimerDisplay();
    }, 1000);
  }

  /**
   * Stop the timer update interval
   */
  function stopTimerUpdate() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * Start the auto-save interval (every 30 seconds)
   */
  function startAutoSave() {
    stopAutoSave();
    saveInterval = setInterval(function() {
      if (currentSession && currentSession.isActive) {
        currentSession = ReviewClock.updateSession(currentSession, Date.now());
        saveSession();
      }
    }, SAVE_INTERVAL_MS);
  }

  /**
   * Stop the auto-save interval
   */
  function stopAutoSave() {
    if (saveInterval) {
      clearInterval(saveInterval);
      saveInterval = null;
    }
  }

  /**
   * Save the current session to chrome.storage.local
   */
  function saveSession() {
    if (!currentSession) return;

    chrome.storage.local.get([STORAGE_KEY], function(result) {
      var sessions = result[STORAGE_KEY] || [];

      // Find and update existing session or add new one
      var found = false;
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].id === currentSession.id) {
          sessions[i] = currentSession;
          found = true;
          break;
        }
      }
      if (!found) {
        sessions.push(currentSession);
      }

      var data = {};
      data[STORAGE_KEY] = sessions;
      chrome.storage.local.set(data);
    });
  }

  /**
   * Finish the current session (save final state)
   */
  function finishSession() {
    if (!currentSession) return;
    if (currentSession.isActive) {
      currentSession = ReviewClock.pauseSession(currentSession);
    }
    saveSession();
    currentSession = null;
  }

  /**
   * Set up idle detection (mouse/keyboard activity)
   */
  function setupIdleDetection() {
    var activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    function onActivity() {
      lastActivityTime = Date.now();
      if (isUserIdle && currentSession && !currentSession.isActive) {
        isUserIdle = false;
        currentSession = ReviewClock.resumeSession(currentSession);
        updateTimerDisplay();
      }
    }

    activityEvents.forEach(function(eventName) {
      document.addEventListener(eventName, onActivity, { passive: true });
    });

    // Check for idle every 10 seconds
    setInterval(function() {
      if (!currentSession || !currentSession.isActive) return;
      var idleTime = Date.now() - lastActivityTime;
      if (idleTime >= settings.idleTimeout) {
        isUserIdle = true;
        currentSession = ReviewClock.pauseSession(currentSession);
        updateTimerDisplay();
        saveSession();
      }
    }, 10000);
  }

  /**
   * Set up visibility change tracking (tab focus/blur)
   */
  function setupVisibilityTracking() {
    document.addEventListener('visibilitychange', function() {
      if (!currentSession) return;

      if (document.hidden) {
        // Tab lost focus — pause
        if (currentSession.isActive) {
          currentSession = ReviewClock.pauseSession(currentSession);
          updateTimerDisplay();
          saveSession();
        }
      } else {
        // Tab regained focus — resume if auto-start and not idle
        if (!currentSession.isActive && settings.autoStart && !isUserIdle) {
          lastActivityTime = Date.now();
          currentSession = ReviewClock.resumeSession(currentSession);
          updateTimerDisplay();
        }
      }
    });
  }

  /**
   * Save session on page unload
   */
  function setupBeforeUnload() {
    window.addEventListener('beforeunload', function() {
      if (currentSession) {
        if (currentSession.isActive) {
          currentSession = ReviewClock.updateSession(currentSession, Date.now());
        }
        // Synchronous save attempt — may not always complete
        saveSession();
      }
    });
  }

  /**
   * Watch for GitHub SPA navigation via MutationObserver
   */
  function setupObserver() {
    var lastUrl = window.location.href;

    var observer = new MutationObserver(function() {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        // Delay to let GitHub finish rendering
        setTimeout(checkAndStart, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', function() {
      setTimeout(checkAndStart, 500);
    });
  }

  /**
   * Clean up UI and timers
   */
  function cleanup() {
    if (currentSession) {
      finishSession();
    }
    removeTimerUI();
    removeStatsOverlay();
    stopTimerUpdate();
    stopAutoSave();
  }

  /**
   * Remove the timer UI from the page
   */
  function removeTimerUI() {
    if (timerHost && timerHost.host) {
      timerHost.host.remove();
    }
    timerHost = null;
    var old = document.getElementById('rc-timer-host');
    if (old) old.remove();
  }

  /**
   * Remove the stats overlay from the page
   */
  function removeStatsOverlay() {
    if (statsHost) {
      statsHost.remove();
    }
    statsHost = null;
    var old = document.getElementById('rc-stats-host');
    if (old) old.remove();
  }

  /**
   * Escape HTML entities for safe injection
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }

  /**
   * Truncate a string to a max length
   */
  function truncate(str, max) {
    if (!str) return '';
    if (str.length <= max) return str;
    return str.slice(0, max - 3) + '...';
  }

  /**
   * Get CSS styles for the timer UI (inside shadow DOM)
   */
  function getTimerStyles() {
    return [
      ':host { all: initial; }',
      '.rc-timer {',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;',
      '  font-size: 14px;',
      '  line-height: 1.4;',
      '  color: #e8eaf6;',
      '}',
      '.rc-compact-bar {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  background: #283593;',
      '  border-radius: 8px;',
      '  padding: 6px 12px;',
      '  box-shadow: 0 2px 12px rgba(40,53,147,0.4);',
      '  cursor: default;',
      '  user-select: none;',
      '}',
      '.rc-expanded-bar {',
      '  background: #283593;',
      '  border-radius: 10px;',
      '  padding: 12px 16px;',
      '  min-width: 220px;',
      '  box-shadow: 0 4px 20px rgba(40,53,147,0.5);',
      '}',
      '.rc-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '}',
      '.rc-timer-text {',
      '  font-size: 16px;',
      '  font-weight: 700;',
      '  color: #c5cae9;',
      '  font-variant-numeric: tabular-nums;',
      '  letter-spacing: 0.5px;',
      '}',
      '.rc-timer-text.rc-large {',
      '  font-size: 24px;',
      '  color: #e8eaf6;',
      '}',
      '.rc-expand-btn {',
      '  background: none;',
      '  border: none;',
      '  color: #9fa8da;',
      '  cursor: pointer;',
      '  padding: 2px 4px;',
      '  border-radius: 4px;',
      '  display: flex;',
      '  align-items: center;',
      '}',
      '.rc-expand-btn:hover {',
      '  background: rgba(255,255,255,0.1);',
      '  color: #e8eaf6;',
      '}',
      '.rc-pr-title {',
      '  font-size: 12px;',
      '  color: #9fa8da;',
      '  margin-top: 4px;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '}',
      '.rc-controls {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  margin-top: 8px;',
      '}',
      '.rc-pause-btn {',
      '  background: #3f51b5;',
      '  color: #fff;',
      '  border: none;',
      '  border-radius: 4px;',
      '  padding: 4px 12px;',
      '  font-size: 12px;',
      '  font-weight: 500;',
      '  cursor: pointer;',
      '}',
      '.rc-pause-btn:hover {',
      '  background: #5c6bc0;',
      '}',
      '.rc-status {',
      '  font-size: 11px;',
      '  color: #7986cb;',
      '  font-weight: 500;',
      '}'
    ].join('\n');
  }

  /**
   * Get CSS styles for the stats overlay
   */
  function getStatsStyles() {
    return [
      ':host { all: initial; }',
      '.rc-effort-badge {',
      '  display: inline-block;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  padding: 2px 8px;',
      '  border-radius: 12px;',
      '  vertical-align: middle;',
      '  cursor: default;',
      '}',
      '.rc-effort-s {',
      '  background: #e8f5e9;',
      '  color: #2e7d32;',
      '}',
      '.rc-effort-m {',
      '  background: #fff3e0;',
      '  color: #ef6c00;',
      '}',
      '.rc-effort-l {',
      '  background: #fbe9e7;',
      '  color: #d84315;',
      '}',
      '.rc-effort-xl {',
      '  background: #fce4ec;',
      '  color: #c62828;',
      '}'
    ].join('\n');
  }
})();
