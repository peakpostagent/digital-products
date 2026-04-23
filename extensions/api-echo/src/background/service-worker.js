/**
 * service-worker.js
 * Minimal background service worker for the API Echo extension.
 * Handles extension lifecycle events.
 */

/* Extension lifecycle hooks.
 * Kept as a no-op listener today — reserved for first-install welcome page
 * or migration logic if we need it later. Silenced the prior lifecycle
 * console.logs since they printed to every user's DevTools without serving
 * a debug purpose. */
chrome.runtime.onInstalled.addListener(function (_details) {
  // intentional no-op
});
