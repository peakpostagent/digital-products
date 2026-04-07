/**
 * Console Catcher — Content Script (ISOLATED world)
 *
 * Listens for messages from the page-context override script
 * (page/override.js running in MAIN world) and relays them
 * to the background service worker.
 */

window.addEventListener('message', function (event) {
  /* Only accept messages from our injected script on the same page */
  if (event.source !== window) return;
  if (!event.data || event.data.source !== '__console_catcher__') return;

  /* Forward to background service worker */
  try {
    chrome.runtime.sendMessage({
      type: 'console_log',
      level: event.data.level,
      message: event.data.message,
      stack: event.data.stack || '',
      timestamp: event.data.timestamp,
      url: window.location.href
    });
  } catch (_e) {
    /* Extension context may have been invalidated (page stayed open
       after extension update). Silently ignore. */
  }
});
