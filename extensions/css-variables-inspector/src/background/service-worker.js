/**
 * service-worker.js
 * Minimal background service worker for the CSS Variables Inspector extension.
 * Handles extension lifecycle events.
 */

/* Log when the extension is installed or updated */
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    console.log('CSS Variables Inspector installed');
  } else if (details.reason === 'update') {
    console.log('CSS Variables Inspector updated to version', chrome.runtime.getManifest().version);
  }
});
