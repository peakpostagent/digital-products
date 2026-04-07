/**
 * Security Headers — Background service worker.
 *
 * Handles:
 *  - Executing the header-fetch script in the active tab
 *  - Updating the badge with the letter grade
 *  - Saving scan results to history
 */

/**
 * Fetch security headers for the given tab by injecting a script
 * that performs a HEAD request to the current page URL.
 * @param {number} tabId
 * @returns {Promise<Object>} { url, headers, error }
 */
async function fetchHeadersForTab(tabId) {
  try {
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: fetchPageHeaders
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    return { url: '', headers: {}, error: 'No result from script' };
  } catch (err) {
    return { url: '', headers: {}, error: err.message };
  }
}

/**
 * This function runs in the PAGE context (injected via scripting API).
 * It fetches the current page URL with HEAD and extracts response headers.
 * @returns {Object} { url, headers, error }
 */
function fetchPageHeaders() {
  return fetch(location.href, { method: 'HEAD', credentials: 'same-origin' })
    .then(function (response) {
      var headers = {};
      response.headers.forEach(function (value, key) {
        headers[key] = value;
      });
      return { url: location.href, headers: headers, error: null };
    })
    .catch(function (err) {
      return { url: location.href, headers: {}, error: err.message };
    });
}

/**
 * Update the extension badge with the grade letter and color.
 * Uses the grading functions from lib/headers.js but since service workers
 * cannot load scripts via script tags, we inline minimal grading here.
 * @param {number} tabId
 * @param {string} grade
 */
function updateBadge(tabId, grade) {
  var colorMap = {
    'A+': '#40a02b',
    'A':  '#40a02b',
    'B':  '#df8e1d',
    'C':  '#fe640b',
    'D':  '#d20f39',
    'F':  '#d20f39'
  };

  var bgColor = colorMap[grade] || '#6c7086';

  chrome.action.setBadgeText({ text: grade, tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: bgColor, tabId: tabId });
}

/**
 * Save a scan result to the history in chrome.storage.local.
 * Keeps the most recent 50 entries.
 * @param {Object} entry - { url, hostname, grade, percentage, timestamp }
 */
async function saveToHistory(entry) {
  var data = await chrome.storage.local.get({ scanHistory: [] });
  var history = data.scanHistory;

  // Add new entry at the beginning
  history.unshift(entry);

  // Keep only the last 50
  if (history.length > 50) {
    history = history.slice(0, 50);
  }

  await chrome.storage.local.set({ scanHistory: history });
}

/**
 * Listen for messages from the popup requesting a scan.
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'scanHeaders') {
    handleScan(message.tabId).then(sendResponse);
    return true; // keep the message channel open for async response
  }

  if (message.action === 'updateBadge') {
    updateBadge(message.tabId, message.grade);
    sendResponse({ ok: true });
    return false;
  }
});
