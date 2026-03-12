/**
 * service-worker.js — Background service worker for Read Cost extension
 *
 * Handles:
 * - Extension installation: sets default settings
 * - Badge icon management (could be extended for badge text)
 */

// -------------------------------------------------------
// Default settings (matches calculator.js DEFAULTS)
// -------------------------------------------------------

var DEFAULTS = {
  hourlyRate: 50,
  wpm: 238,
  currency: 'USD',
  showBadge: true,
  showReadingTime: true,
  showWordCount: true
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
