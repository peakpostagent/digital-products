/**
 * Console Catcher — Background Service Worker
 *
 * Receives console log entries from content scripts, stores them
 * per-tab in chrome.storage.local, and updates the badge with
 * the error count for each tab.
 */

/* ── Constants ──────────────────────────────────────────────────── */

/** Max entries stored per tab */
const MAX_ENTRIES_PER_TAB = 500;

/** Storage key prefix — logs are stored as "logs_<tabId>" */
const STORAGE_PREFIX = 'logs_';

/** Key for the per-tab capture-enabled state */
const CAPTURE_PREFIX = 'capture_';

/* ── Badge styling ──────────────────────────────────────────────── */

/** Set the default badge background (red for errors) */
chrome.action.setBadgeBackgroundColor({ color: '#E53935' });

/* ── Message handler ────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

  /* --- Console log entry from content script --- */
  if (msg.type === 'console_log' && sender.tab) {
    handleLogEntry(msg, sender.tab.id);
    sendResponse({ ok: true });
    return;
  }

  /* --- Popup requests: get logs for a tab --- */
  if (msg.type === 'get_logs') {
    getLogsForTab(msg.tabId).then(function (logs) {
      sendResponse({ logs: logs });
    });
    return true; // async sendResponse
  }

  /* --- Popup requests: clear logs for a tab --- */
  if (msg.type === 'clear_logs') {
    clearLogsForTab(msg.tabId).then(function () {
      updateBadge(msg.tabId, 0);
      sendResponse({ ok: true });
    });
    return true;
  }

  /* --- Toggle capture on/off for a tab --- */
  if (msg.type === 'toggle_capture') {
    toggleCapture(msg.tabId, msg.enabled).then(function (enabled) {
      sendResponse({ enabled: enabled });
    });
    return true;
  }

  /* --- Get capture state for a tab --- */
  if (msg.type === 'get_capture_state') {
    getCaptureState(msg.tabId).then(function (enabled) {
      sendResponse({ enabled: enabled });
    });
    return true;
  }

  /* --- Export logs for a tab --- */
  if (msg.type === 'export_logs') {
    getLogsForTab(msg.tabId).then(function (logs) {
      sendResponse({ logs: logs });
    });
    return true;
  }
});

/* ── Core functions ─────────────────────────────────────────────── */

/**
 * Handle an incoming log entry: check capture state, store it,
 * and update the badge.
 */
async function handleLogEntry(msg, tabId) {
  /* Check if capture is enabled for this tab */
  const enabled = await getCaptureState(tabId);
  if (!enabled) return;

  const entry = {
    level: msg.level,
    message: msg.message,
    stack: msg.stack || '',
    timestamp: msg.timestamp,
    url: msg.url
  };

  const key = STORAGE_PREFIX + tabId;
  const data = await chrome.storage.local.get(key);
  const logs = data[key] || [];

  /* Add the new entry */
  logs.push(entry);

  /* Prune if over the limit (remove oldest entries) */
  if (logs.length > MAX_ENTRIES_PER_TAB) {
    logs.splice(0, logs.length - MAX_ENTRIES_PER_TAB);
  }

  /* Save back to storage */
  await chrome.storage.local.set({ [key]: logs });

  /* Update badge with error count */
  const errorCount = logs.filter(function (l) {
    return l.level === 'error';
  }).length;
  updateBadge(tabId, errorCount);
}

/**
 * Get all stored logs for a given tab.
 */
async function getLogsForTab(tabId) {
  const key = STORAGE_PREFIX + tabId;
  const data = await chrome.storage.local.get(key);
  return data[key] || [];
}

/**
 * Clear all stored logs for a given tab.
 */
async function clearLogsForTab(tabId) {
  const key = STORAGE_PREFIX + tabId;
  await chrome.storage.local.remove(key);
}

/**
 * Toggle the capture state for a tab. Returns the new state.
 */
async function toggleCapture(tabId, enabled) {
  const key = CAPTURE_PREFIX + tabId;
  await chrome.storage.local.set({ [key]: enabled });
  return enabled;
}

/**
 * Get whether capture is enabled for a tab (defaults to true).
 */
async function getCaptureState(tabId) {
  const key = CAPTURE_PREFIX + tabId;
  const data = await chrome.storage.local.get(key);
  /* Default to enabled if no state has been set */
  return data[key] !== undefined ? data[key] : true;
}

/**
 * Update the extension badge for a specific tab.
 * Shows the error count; clears badge if zero.
 */
function updateBadge(tabId, errorCount) {
  if (errorCount > 0) {
    chrome.action.setBadgeText({
      text: String(errorCount > 99 ? '99+' : errorCount),
      tabId: tabId
    });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

/* ── Tab cleanup ────────────────────────────────────────────────── */

/**
 * When a tab is closed, remove its stored logs and capture state
 * to free up storage.
 */
chrome.tabs.onRemoved.addListener(function (tabId) {
  chrome.storage.local.remove([
    STORAGE_PREFIX + tabId,
    CAPTURE_PREFIX + tabId
  ]);
});

/**
 * When a tab navigates to a new page, clear its logs so the
 * viewer always shows logs for the current page.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    clearLogsForTab(tabId).then(function () {
      updateBadge(tabId, 0);
    });
  }
});
