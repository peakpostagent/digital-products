/**
 * Security Headers — Background service worker.
 *
 * Handles:
 *  - Updating the extension badge with the letter grade
 *  - Fetching headers from arbitrary URLs (batch scan / compare) via the
 *    extension's own fetch, which has host_permissions: <all_urls>
 */

/**
 * Update the extension badge with the grade letter and color.
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
 * Fetch headers for an arbitrary URL directly from the extension context.
 * Uses a HEAD request, falls back to GET if HEAD fails (some servers reject HEAD).
 * @param {string} url
 * @returns {Promise<Object>} { url, headers, error }
 */
async function fetchHeadersForUrl(url) {
  var attempts = [{ method: 'HEAD' }, { method: 'GET' }];

  for (var i = 0; i < attempts.length; i++) {
    try {
      var response = await fetch(url, {
        method: attempts[i].method,
        credentials: 'omit',
        redirect: 'follow',
        cache: 'no-store'
      });

      var headers = {};
      response.headers.forEach(function (value, key) {
        headers[key] = value;
      });

      return { url: response.url || url, headers: headers, status: response.status, error: null };
    } catch (err) {
      if (i === attempts.length - 1) {
        return { url: url, headers: {}, error: err && err.message ? err.message : 'Fetch failed' };
      }
    }
  }

  return { url: url, headers: {}, error: 'Fetch failed' };
}

/**
 * Listen for messages from the popup.
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'updateBadge') {
    updateBadge(message.tabId, message.grade);
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === 'fetchHeaders') {
    fetchHeadersForUrl(message.url).then(sendResponse);
    return true; // keep message channel open for async response
  }
});
