/**
 * ExtKit Pro — `isPaid()` helper with 6-hour cache
 *
 * The popup checks isPaid() on every open. To avoid 1 round-trip to
 * ExtensionPay per popup open, results are cached in chrome.storage.local
 * for up to 6 hours. The background service worker is responsible for
 * refreshing the cache whenever the ExtensionPay SDK fires its
 * `paid-status-changed` event.
 *
 * Cache key: `extkit:paid-cache`
 * Cache shape: { paid: boolean, fetchedAt: number, subscriptionStatus: string }
 *
 * This is a vanilla ES module — works in popup pages, options pages,
 * and content scripts via dynamic import().
 */

const CACHE_KEY = 'extkit:paid-cache';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Read the cached paid status. Returns null if cache is missing or stale.
 * @returns {Promise<{paid: boolean, fetchedAt: number, subscriptionStatus: string}|null>}
 */
export async function readPaidCache() {
  const cached = await chrome.storage.local.get([CACHE_KEY]);
  const entry = cached[CACHE_KEY];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry;
}

/**
 * Write a fresh paid-status result to the cache. Called by the service worker
 * after every successful ExtensionPay round-trip.
 */
export async function writePaidCache(result) {
  const entry = {
    paid: !!(result && result.paid),
    fetchedAt: Date.now(),
    subscriptionStatus:
      result && result.subscriptionStatus ? result.subscriptionStatus : 'free',
  };
  await chrome.storage.local.set({ [CACHE_KEY]: entry });
  return entry;
}

/**
 * Clear the cache — useful on logout / refund webhooks.
 */
export async function clearPaidCache() {
  await chrome.storage.local.remove([CACHE_KEY]);
}

/**
 * Synchronous-feeling helper for UI code. Returns the cached value if fresh,
 * else falls back to whatever the service worker most recently wrote. UI
 * should accept the small race window (cache stale → free experience until
 * the worker re-fetches, which it does on every popup open via a message).
 *
 * @returns {Promise<boolean>}
 */
export async function isPaid() {
  const cached = await readPaidCache();
  if (cached) return cached.paid;
  // Cache stale — ask the worker to refresh, but don't block the UI on the
  // round-trip. The next isPaid() call will read the fresh value.
  try {
    chrome.runtime.sendMessage({ type: 'extkit/refresh-paid-status' });
  } catch (_) {
    // Service worker may be inactive; no-op
  }
  return false;
}
