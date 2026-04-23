/**
 * service-worker.js
 * Minimal background service worker for the CSS Variables Inspector extension.
 * Handles extension lifecycle events.
 */

/* Extension lifecycle hooks. Kept as no-op — reserved for migration logic
 * if needed later. Prior lifecycle console.logs removed (noise in user
 * DevTools, no debug value). */
chrome.runtime.onInstalled.addListener(function (_details) {
  // intentional no-op
});
