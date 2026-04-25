/**
 * service-worker.js — Manifest V3 background script.
 *
 * Currently a no-op. Reserved for:
 *   - LLM API calls to a backend (when paid tier ships)
 *   - Cross-tab competitor scraping (when "live DOM diff" feature ships)
 *   - Caching tag suggestions in chrome.storage.local
 *
 * Keeping the file present + declared in manifest.json so future features
 * are an edit, not a manifest change (which triggers CWS re-review).
 */
chrome.runtime.onInstalled.addListener(function (_details) {
  /* intentional no-op for v0.1.0 */
});
