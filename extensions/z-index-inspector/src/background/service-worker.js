/**
 * Z-Index Inspector — Background Service Worker
 *
 * Manages badge count and injects the content script on demand
 * using the scripting API. Only injects when the user clicks
 * the extension icon (via popup), keeping it non-intrusive.
 */

/* ── Badge styling ──────────────────────────────────────────────── */

/** Blue badge to match the extension's theme */
chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });

/* ── Message handler ────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

  /* --- z-index count from content script --- */
  if (msg.type === 'zindex_count' && sender.tab) {
    updateBadge(sender.tab.id, msg.count);
    sendResponse({ ok: true });
    return;
  }

  /* --- Inject content script into the active tab --- */
  if (msg.type === 'inject_content_script') {
    injectContentScript(msg.tabId).then(function () {
      sendResponse({ ok: true });
    }).catch(function (err) {
      sendResponse({ ok: false, error: err.message });
    });
    return true; /* async */
  }
});

/* ── Badge management ───────────────────────────────────────────── */

/**
 * Update the extension badge for a specific tab.
 * Shows the z-indexed element count; clears badge if zero.
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

/* ── Content script injection ───────────────────────────────────── */

/**
 * Inject the content script into the specified tab using
 * chrome.scripting.executeScript. Requires "scripting" and
 * "activeTab" permissions.
 */
function injectContentScript(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content/content.js']
  });
}

/* ── Tab cleanup ────────────────────────────────────────────────── */

/**
 * When a tab navigates, clear the badge so it gets
 * re-populated after the content script runs again.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    updateBadge(tabId, 0);
  }
});
