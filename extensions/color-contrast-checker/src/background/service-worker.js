/**
 * service-worker.js — Background service worker for Color Contrast Checker
 *
 * Handles:
 * - Extension installation: sets default settings
 * - Badge text updates (ON/OFF indicator)
 * - Message passing between popup and content scripts
 */

// -------------------------------------------------------
// Default settings
// -------------------------------------------------------

var DEFAULTS = {
  showOverlay: true,
  showHighlight: true,
  isActive: false,
  lastResult: null
};

// -------------------------------------------------------
// Installation handler
// -------------------------------------------------------

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.get(null, function (existing) {
      var toSet = {};
      for (var key in DEFAULTS) {
        if (existing[key] === undefined) {
          toSet[key] = DEFAULTS[key];
        }
      }
      if (Object.keys(toSet).length > 0) {
        chrome.storage.local.set(toSet);
      }
    });
  }
});

// -------------------------------------------------------
// Badge management
// -------------------------------------------------------

/**
 * Update the extension badge to show ON/OFF state.
 */
function updateBadge(isActive) {
  if (isActive) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// -------------------------------------------------------
// Message handling
// -------------------------------------------------------

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'updateBadge') {
    updateBadge(message.isActive);
    sendResponse({ success: true });
  }
  return true;
});

// -------------------------------------------------------
// Restore badge state on startup
// -------------------------------------------------------

chrome.storage.local.get({ isActive: false }, function (items) {
  updateBadge(items.isActive);
});
