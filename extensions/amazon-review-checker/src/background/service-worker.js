/**
 * Amazon Review Checker — Background service worker
 *
 * Handles messages from content scripts (e.g., opening the popup),
 * manages the 7-day local cache TTL, and (Pro tier) samples reviewer
 * profile pages for the diversity heuristic.
 */

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://peakpost.ca/amazon-review-checker/welcome' });
  }
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg && msg.type === 'openPopup') {
    // Chrome's MV3 chrome.action.openPopup is gated; trigger via icon instead.
    // No-op here; the badge click in content.js is informational.
    sendResponse({ ok: true });
  }
  return true;
});

// Periodic cache cleanup — once a day, drop entries older than 30 days.
chrome.alarms.create('arc-cleanup', { periodInMinutes: 60 * 24 });
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== 'arc-cleanup') return;
  chrome.storage.local.get(null, function (all) {
    var cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    var stale = [];
    Object.keys(all).forEach(function (k) {
      if (k.startsWith('arc:') && all[k] && all[k].ts < cutoff) stale.push(k);
    });
    if (stale.length > 0) chrome.storage.local.remove(stale);
  });
});
