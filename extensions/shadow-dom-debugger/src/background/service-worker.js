/**
 * Shadow DOM Debugger — Background Service Worker
 *
 * Manages the badge count showing the number of shadow DOM roots
 * found on each tab. Receives count updates from the content script.
 */

/* ── Badge styling ──────────────────────────────────────────────── */

/** Purple badge to match the extension's theme */
chrome.action.setBadgeBackgroundColor({ color: '#A855F7' });

/* ── Message handler ────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

  /* --- Shadow root count from content script --- */
  if (msg.type === 'shadow_count' && sender.tab) {
    updateBadge(sender.tab.id, msg.count);
    sendResponse({ ok: true });
    return;
  }
});

/* ── Badge management ───────────────────────────────────────────── */

/**
 * Update the extension badge for a specific tab.
 * Shows the shadow root count; clears badge if zero.
 */
function updateBadge(tabId, count) {
  if (count > 0) {
    chrome.action.setBadgeText({
      text: String(count > 99 ? '99+' : count),
      tabId: tabId
    });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

/* ── Tab cleanup ────────────────────────────────────────────────── */

/**
 * When a tab navigates, clear the badge so it gets
 * re-populated by the content script after it re-scans.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    updateBadge(tabId, 0);
  }
});
