// store.js — Thin wrapper around Vercel KV for MCC Pro insights subscribers.
// The KV SDK is loaded lazily so `vercel dev` works before env vars are set.
// Keys:
//   subscriber:{email}   -> { email, optIn, createdAt, lastSentAt, rate, currency }
//   subscribers          -> Redis Set of emails (for cron iteration)

let kv = null;
let kvLoadLoggedOnce = false;

function getKv() {
  if (kv) return kv;
  try {
    // @vercel/kv is added at deploy time. If it's missing (local dev), callers
    // should handle the null case and operate in no-op mode.
    // eslint-disable-next-line global-require
    kv = require('@vercel/kv').kv;
  } catch (err) {
    if (!kvLoadLoggedOnce) {
      console.warn('[store] @vercel/kv not available — KV ops will no-op. '
        + 'In production this means KV_REST_API_URL / KV_REST_API_TOKEN '
        + 'are not set.');
      kvLoadLoggedOnce = true;
    }
    kv = null;
  }
  return kv;
}

async function getSubscriber(email) {
  const store = getKv();
  if (!store) return null;
  return store.get('subscriber:' + email);
}

/**
 * Upsert a subscriber record. Patch is merged over the existing record.
 * Falsy / undefined fields in `patch` are NOT written (so callers can pass
 * partial updates without accidentally clobbering prior data).
 *
 * Uses a Redis Set (`subscribers`) for the index so concurrent registrations
 * don't lose each other — the previous JSON-array approach had a last-write-
 * wins race that dropped subscribers under any burst.
 */
async function upsertSubscriber(email, patch) {
  const store = getKv();
  if (!store) return { ok: false, reason: 'kv_unavailable' };

  const existing = (await store.get('subscriber:' + email)) || { email, createdAt: Date.now() };
  const cleanPatch = {};
  for (const key of Object.keys(patch || {})) {
    const val = patch[key];
    if (val !== undefined && val !== null) cleanPatch[key] = val;
  }
  const updated = { ...existing, ...cleanPatch, email };
  await store.set('subscriber:' + email, updated);

  // SADD is idempotent — fine to call on existing members
  await store.sadd('subscribers', email);
  return { ok: true, subscriber: updated };
}

async function removeSubscriber(email) {
  const store = getKv();
  if (!store) return { ok: false, reason: 'kv_unavailable' };

  await store.del('subscriber:' + email);
  await store.srem('subscribers', email);
  return { ok: true };
}

async function listSubscribers() {
  const store = getKv();
  if (!store) return [];
  const emails = await store.smembers('subscribers');
  if (!Array.isArray(emails) || emails.length === 0) return [];
  const subs = [];
  for (const email of emails) {
    const sub = await store.get('subscriber:' + email);
    if (sub) subs.push(sub);
  }
  return subs;
}

module.exports = { getSubscriber, upsertSubscriber, removeSubscriber, listSubscribers };
