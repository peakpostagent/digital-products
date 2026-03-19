/**
 * Snippet Vault - Background Service Worker
 * Handles: badge count, context menu for saving selected text.
 */

/* ===== Extension Install / Startup ===== */

chrome.runtime.onInstalled.addListener(() => {
  // Create the right-click context menu item
  chrome.contextMenus.create({
    id: 'save-as-snippet',
    title: 'Save selection as snippet',
    contexts: ['selection']
  });

  // Set initial badge
  updateBadgeFromStorage();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadgeFromStorage();
});

/* ===== Context Menu Handler ===== */

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== 'save-as-snippet') return;

  const selectedText = info.selectionText || '';
  if (!selectedText.trim()) return;

  // Save the selected text as a new snippet
  chrome.storage.local.get({ snippets: [] }, (result) => {
    const snippets = result.snippets;

    const newSnippet = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      title: truncate(selectedText, 40),
      language: 'Other',
      code: selectedText,
      tags: ['from-page'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    snippets.unshift(newSnippet);

    chrome.storage.local.set({ snippets }, () => {
      setBadgeCount(snippets.length);
    });
  });
});

/* ===== Message Listener ===== */

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPDATE_BADGE') {
    setBadgeCount(message.count);
  }
});

/* ===== Badge Helpers ===== */

/** Read snippet count from storage and update the badge */
function updateBadgeFromStorage() {
  chrome.storage.local.get({ snippets: [] }, (result) => {
    setBadgeCount(result.snippets.length);
  });
}

/** Set the extension badge text and color */
function setBadgeCount(count) {
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#cba6f7' });
}

/* ===== Utility ===== */

/** Truncate a string to a given length, adding ellipsis if needed */
function truncate(str, maxLen) {
  const firstLine = str.split('\n')[0].trim();
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.substring(0, maxLen - 1) + '\u2026';
}
