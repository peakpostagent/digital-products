/**
 * service-worker.js
 * Minimal background service worker for the API Echo extension.
 * Handles extension lifecycle events.
 */

/* Log when the extension is installed or updated */
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    console.log('API Echo installed');
  } else if (details.reason === 'update') {
    console.log('API Echo updated to version', chrome.runtime.getManifest().version);
  }
});
