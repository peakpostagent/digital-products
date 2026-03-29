/**
 * Service Worker Inspector — Background Service Worker
 *
 * Manages the extension badge showing active service worker count
 * per tab. Cleans up stored state when tabs close.
 */

/* ── Badge styling ──────────────────────────────────────────────── */

/** Set the default badge background (teal to match the theme) */
chrome.action.setBadgeBackgroundColor({ color: '#89DCEB' });
chrome.action.setBadgeTextColor({ color: '#1E1E2E' });

/* ── Message handler ────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

  /* --- Update badge count from popup --- */
  if (msg.type === 'update_badge') {
    updateBadge(msg.tabId, msg.count);
    sendResponse({ ok: true });
    return;
  }
});

/* ── Core functions ─────────────────────────────────────────────── */

/**
 * Update the extension badge for a specific tab.
 * Shows the service worker count; clears badge if zero.
 */
function updateBadge(tabId, count) {
  if (count > 0) {
    chrome.action.setBadgeText({
      text: String(count),
      tabId: tabId
    });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

/* ── Tab cleanup ────────────────────────────────────────────────── */

/**
 * When a tab is closed, remove its stored offline state
 * to free up storage.
 */
chrome.tabs.onRemoved.addListener(function (tabId) {
  chrome.storage.local.remove(['offline_' + tabId]);
});

/**
 * When a tab navigates to a new page, clear the badge and
 * offline state since the page context changes.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    updateBadge(tabId, 0);
    chrome.storage.local.remove(['offline_' + tabId]);
  }
});
