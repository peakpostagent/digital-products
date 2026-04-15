// store.js — Thin wrapper around Vercel KV for MCC Pro insights subscribers.
// The KV SDK is loaded lazily so `vercel dev` works before env vars are set.
// Keys:
//   subscriber:{email}   -> { email, optIn, createdAt, lastSentAt, rate, currency }
//   subscriberIndex      -> [ email, email, ... ]   (for cron iteration)

let kv = null;

function getKv() {
  if (kv) return kv;
  try {
    // @vercel/kv is added at deploy time. If it's missing (local dev), callers
    // should handle the null case and operate in no-op mode.
    // eslint-disable-next-line global-require
    kv = require('@vercel/kv').kv;
  } catch (err) {
    kv = null;
  }
  return kv;
}

async function getSubscriber(email) {
  const store = getKv();
  if (!store) return null;
  return store.get('subscriber:' + email);
}

async function upsertSubscriber(email, patch) {
  const store = getKv();
  if (!store) return { ok: false, reason: 'kv_unavailable' };

  const existing = (await store.get('subscriber:' + email)) || { email, createdAt: Date.now() };
  const updated = { ...existing, ...patch, email };
  await store.set('subscriber:' + email, updated);

  const index = (await store.get('subscriberIndex')) || [];
  if (!index.includes(email)) {
    index.push(email);
    await store.set('subscriberIndex', index);
  }
  return { ok: true, subscriber: updated };
}

async function removeSubscriber(email) {
  const store = getKv();
  if (!store) return { ok: false, reason: 'kv_unavailable' };

  await store.del('subscriber:' + email);
  const index = (await store.get('subscriberIndex')) || [];
  const filtered = index.filter((e) => e !== email);
  await store.set('subscriberIndex', filtered);
  return { ok: true };
}

async function listSubscribers() {
  const store = getKv();
  if (!store) return [];
  const index = (await store.get('subscriberIndex')) || [];
  const subs = [];
  for (const email of index) {
    const sub = await store.get('subscriber:' + email);
    if (sub) subs.push(sub);
  }
  return subs;
}

module.exports = { getSubscriber, upsertSubscriber, removeSubscriber, listSubscribers };
