/**
 * Tab Brake — Background service worker
 *
 * Listens for tab creation/removal, enforces the tab limit,
 * updates the badge, and records periodic snapshots.
 */

/* ------------------------------------------------------------------ */
/*  Inline copy of core helpers (service workers can't importScripts  */
/*  relative paths reliably, so we duplicate the small functions we   */
/*  actually need here).                                              */
/* ------------------------------------------------------------------ */

/**
 * Returns true when the tab count exceeds the limit.
 */
function shouldBlock(currentCount, maxTabs) {
  if (typeof currentCount !== 'number' || typeof maxTabs !== 'number') return false;
  if (maxTabs <= 0) return false;
  return currentCount > maxTabs;
}

/**
 * Append a snapshot to the history array.
 */
function recordSnapshot(history, tabCount, timestamp) {
  var list = Array.isArray(history) ? history.slice() : [];
  if (typeof tabCount !== 'number' || typeof timestamp !== 'number') return list;
  list.push({ tabCount: tabCount, timestamp: timestamp });
  return list;
}

/**
 * Remove entries older than maxAgeDays.
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
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

var DEFAULTS = {
  maxTabs: 8,
  enabled: true,
  showBadge: true,
  history: [],
};

var ALARM_NAME = 'tab-brake-snapshot';
var SNAPSHOT_INTERVAL_MINUTES = 5;

/* ------------------------------------------------------------------ */
/*  Install / startup                                                  */
/* ------------------------------------------------------------------ */

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.storage.local.set(DEFAULTS);
  }
  // Create recurring alarm for snapshots
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: SNAPSHOT_INTERVAL_MINUTES });
  updateBadge();
});

// Re-create alarm on startup (service worker may have been killed)
chrome.runtime.onStartup.addListener(function () {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: SNAPSHOT_INTERVAL_MINUTES });
  updateBadge();
});

/* ------------------------------------------------------------------ */
/*  Badge                                                              */
/* ------------------------------------------------------------------ */

function updateBadge() {
  chrome.tabs.query({}, function (tabs) {
    var count = tabs.length;
    chrome.storage.local.get(['maxTabs', 'showBadge'], function (data) {
      var max = typeof data.maxTabs === 'number' ? data.maxTabs : DEFAULTS.maxTabs;
      var show = data.showBadge !== undefined ? data.showBadge : DEFAULTS.showBadge;

      if (!show) {
        chrome.action.setBadgeText({ text: '' });
        return;
      }

      chrome.action.setBadgeText({ text: String(count) });

      // Color based on usage percentage
      var pct = max > 0 ? (count / max) * 100 : 0;
      var color;
      if (pct < 50) {
        color = '#4CAF50'; // green
      } else if (pct < 80) {
        color = '#FF9800'; // yellow/orange
      } else {
        color = '#e53935'; // red
      }
      chrome.action.setBadgeBackgroundColor({ color: color });
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Tab creation — enforce limit                                       */
/* ------------------------------------------------------------------ */

chrome.tabs.onCreated.addListener(function (tab) {
  chrome.storage.local.get(['maxTabs', 'enabled'], function (data) {
    var max = typeof data.maxTabs === 'number' ? data.maxTabs : DEFAULTS.maxTabs;
    var enabled = data.enabled !== undefined ? data.enabled : DEFAULTS.enabled;

    if (!enabled) {
      updateBadge();
      return;
    }

    chrome.tabs.query({}, function (tabs) {
      var count = tabs.length;

      if (shouldBlock(count, max)) {
        // Redirect the newly created tab to the blocked page
        var blockedUrl = chrome.runtime.getURL('blocked/blocked.html');
        chrome.tabs.update(tab.id, { url: blockedUrl });

        // Record a "blocked" event
        chrome.storage.local.get(['history'], function (d) {
          var hist = Array.isArray(d.history) ? d.history : [];
          hist = recordSnapshot(hist, count, Date.now());
          // Mark the last entry as blocked
          hist[hist.length - 1].blocked = true;
          chrome.storage.local.set({ history: hist });
        });
      }

      updateBadge();
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Tab removal — update badge                                         */
/* ------------------------------------------------------------------ */

chrome.tabs.onRemoved.addListener(function () {
  updateBadge();
});

/* ------------------------------------------------------------------ */
/*  Periodic snapshot via alarm                                        */
/* ------------------------------------------------------------------ */

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== ALARM_NAME) return;

  chrome.tabs.query({}, function (tabs) {
    var count = tabs.length;
    chrome.storage.local.get(['history'], function (data) {
      var hist = Array.isArray(data.history) ? data.history : [];
      hist = recordSnapshot(hist, count, Date.now());
      // Clean old entries once a day (keep 30 days)
      hist = cleanHistory(hist, 30);
      chrome.storage.local.set({ history: hist });
    });
  });

  updateBadge();
});

/* ------------------------------------------------------------------ */
/*  Listen for messages from blocked page or popup                     */
/* ------------------------------------------------------------------ */

chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
  if (msg.type === 'getTabCount') {
    chrome.tabs.query({}, function (tabs) {
      sendResponse({ count: tabs.length });
    });
    return true; // async sendResponse
  }

  if (msg.type === 'getOpenTabs') {
    chrome.tabs.query({}, function (tabs) {
      var list = tabs.map(function (t) {
        return { id: t.id, title: t.title || 'Untitled', url: t.url || '', favIconUrl: t.favIconUrl || '' };
      });
      sendResponse({ tabs: list });
    });
    return true;
  }

  if (msg.type === 'closeTab') {
    chrome.tabs.remove(msg.tabId, function () {
      updateBadge();
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'override') {
    // Record override in history
    chrome.storage.local.get(['history'], function (data) {
      var hist = Array.isArray(data.history) ? data.history : [];
      chrome.tabs.query({}, function (tabs) {
        hist = recordSnapshot(hist, tabs.length, Date.now());
        hist[hist.length - 1].overridden = true;
        chrome.storage.local.set({ history: hist });
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  if (msg.type === 'updateBadge') {
    updateBadge();
    sendResponse({ ok: true });
    return false;
  }
});
