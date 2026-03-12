// service-worker.js — Background service worker for Review Clock
// Handles extension install, default settings, tab tracking, and cleanup

const STORAGE_KEY = 'reviewclock_sessions';
const SETTINGS_KEY = 'reviewclock_settings';
const CLEANUP_ALARM = 'reviewclock_cleanup';
const SESSION_MAX_AGE_DAYS = 90;

/**
 * Set default settings on first install
 */
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    var defaults = {};
    defaults[SETTINGS_KEY] = {
      idleTimeout: 120000,  // 2 minutes
      autoStart: true
    };
    chrome.storage.local.set(defaults);
  }

  // Set up periodic cleanup alarm (runs every 24 hours)
  chrome.alarms.create(CLEANUP_ALARM, {
    periodInMinutes: 1440 // 24 hours
  });
});

/**
 * Handle alarm events (periodic cleanup)
 */
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === CLEANUP_ALARM) {
    cleanupOldSessions();
  }
});

/**
 * Track tab activation to help content scripts with pause/resume
 */
chrome.tabs.onActivated.addListener(function(activeInfo) {
  // Notify the newly active tab to potentially resume
  chrome.tabs.sendMessage(activeInfo.tabId, { type: 'TAB_ACTIVATED' }).catch(function() {
    // Content script not loaded on this tab — ignore
  });
});

/**
 * Track tab updates (URL changes) for SPA navigation
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url && tab.url && /github\.com\/.*\/pull\//.test(tab.url)) {
    // PR page detected — content script will handle it
    chrome.tabs.sendMessage(tabId, { type: 'URL_CHANGED', url: tab.url }).catch(function() {
      // Content script not loaded yet — ignore
    });
  }
});

/**
 * Clean up sessions older than 90 days
 */
function cleanupOldSessions() {
  chrome.storage.local.get([STORAGE_KEY], function(result) {
    var sessions = result[STORAGE_KEY] || [];
    var cutoff = Date.now() - (SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

    var filtered = sessions.filter(function(s) {
      return s.startTime >= cutoff;
    });

    // Only write back if something was removed
    if (filtered.length < sessions.length) {
      var data = {};
      data[STORAGE_KEY] = filtered;
      chrome.storage.local.set(data);
    }
  });
}
