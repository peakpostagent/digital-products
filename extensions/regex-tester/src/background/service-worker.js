/**
 * Regex Tester - Background Service Worker
 * Handles: badge count for saved patterns.
 */

/* ===== Extension Install / Startup ===== */

chrome.runtime.onInstalled.addListener(() => {
  updateBadgeFromStorage();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadgeFromStorage();
});

/* ===== Message Listener ===== */

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPDATE_BADGE') {
    setBadgeCount(message.count);
  }
});

/* ===== Badge Helpers ===== */

/** Read saved pattern count from storage and update the badge */
function updateBadgeFromStorage() {
  chrome.storage.local.get({ savedPatterns: [] }, (result) => {
    setBadgeCount(result.savedPatterns.length);
  });
}

/** Set the extension badge text and color */
function setBadgeCount(count) {
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#fab387' });
}
