/**
 * ExtKit Pro — ExtensionPay webhook handler (Vercel serverless)
 *
 * Receives webhook events from ExtensionPay (Stripe under the hood).
 * Verifies the signature, dedupes events by event ID, and updates a
 * subscriber index in Vercel KV (or any KV-compatible store).
 *
 * Drop this in your /api/ folder. Configure the matching webhook URL
 * inside your ExtensionPay dashboard:
 *   https://your-app.vercel.app/api/webhook
 *
 * Required env vars:
 *   EXTPAY_WEBHOOK_SECRET   — shared secret from ExtensionPay dashboard
 *   KV_REST_API_URL         — Vercel KV (or Upstash) REST endpoint
 *   KV_REST_API_TOKEN       — KV REST token
 *
 * Optional env vars:
 *   ALERTS_WEBHOOK_URL      — POST event summaries to your alerts service
 *                             (works with the Peak Post `apis/alerts/` pattern)
 *
 * Event types handled:
 *   - payment.succeeded     → mark user as paid + expiry
 *   - subscription.renewed  → bump expiry
 *   - subscription.canceled → mark canceled (keep paid until expiry)
 *   - refund.issued         → immediately downgrade
 *   - trial.started         → record trial expiry
 *
 * The receiver returns 200 quickly and runs side effects async, because
 * ExtensionPay treats slow responses as failures and retries.
 */

import crypto from 'node:crypto';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const WEBHOOK_SECRET = process.env.EXTPAY_WEBHOOK_SECRET;
const ALERTS_URL = process.env.ALERTS_WEBHOOK_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  // --- Signature verification ---
  const signature = req.headers['x-extpay-signature'];
  const rawBody = await readRawBody(req);
  if (!verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
    res.status(401).json({ error: 'invalid-signature' });
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    res.status(400).json({ error: 'invalid-json' });
    return;
  }

  if (!event || !event.id || !event.type) {
    res.status(400).json({ error: 'missing-fields' });
    return;
  }

  // --- Dedupe by event ID ---
  const dedupeKey = 'extpay:event:' + event.id;
  const alreadySeen = await kvGet(dedupeKey);
  if (alreadySeen) {
    res.status(200).json({ ok: true, deduplicated: true });
    return;
  }
  // Lock with 7-day TTL — protects against ExtensionPay retries
  await kvSet(dedupeKey, '1', 60 * 60 * 24 * 7);

  // --- Apply the event ---
  try {
    await applyEvent(event);
  } catch (err) {
    console.error('[ExtKit Pro] applyEvent failed:', err);
    // Still 200 so ExtensionPay doesn't retry infinitely on a logic bug
  }

  // --- Fire-and-forget alert ---
  if (ALERTS_URL) {
    fetch(ALERTS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        severity: 'info',
        title: 'ExtPay event: ' + event.type,
        details: { eventId: event.id, userEmail: event.user?.email },
      }),
    }).catch(() => {});
  }

  res.status(200).json({ ok: true, applied: event.type });
}

async function applyEvent(event) {
  const userKey = event.user?.email ? 'extpay:user:' + event.user.email : null;
  if (!userKey) return;

  switch (event.type) {
    case 'payment.succeeded':
    case 'subscription.renewed': {
      await kvSet(
        userKey,
        JSON.stringify({
          status: 'paid',
          plan: event.user?.plan || 'unknown',
          paidAt: Date.now(),
          subscriptionExpiresAt: event.subscription?.expiresAt || null,
        })
      );
      break;
    }
    case 'subscription.canceled': {
      const existing = await kvGet(userKey);
      const parsed = existing ? safeParse(existing) : {};
      await kvSet(
        userKey,
        JSON.stringify({ ...parsed, status: 'canceled', canceledAt: Date.now() })
      );
      break;
    }
    case 'refund.issued': {
      await kvSet(userKey, JSON.stringify({ status: 'refunded', refundedAt: Date.now() }));
      break;
    }
    case 'trial.started': {
      await kvSet(
        userKey,
        JSON.stringify({
          status: 'trialing',
          trialStartedAt: Date.now(),
          trialExpiresAt: event.trial?.expiresAt || null,
        })
      );
      break;
    }
    default:
      // Unknown event — log and ignore
      console.log('[ExtKit Pro] Unhandled event type:', event.type);
  }
}

// ---------- Vercel KV REST helpers ----------

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(KV_URL + '/get/' + encodeURIComponent(key), {
    headers: { Authorization: 'Bearer ' + KV_TOKEN },
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.result;
}

async function kvSet(key, value, ttlSec) {
  if (!KV_URL || !KV_TOKEN) return;
  const cmd = ttlSec
    ? ['set', key, value, 'ex', String(ttlSec)]
    : ['set', key, value];
  await fetch(KV_URL + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + KV_TOKEN,
      'content-type': 'application/json',
    },
    body: JSON.stringify([cmd]),
  });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (_) {
    return {};
  }
}

// ---------- Signature ----------

function verifySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  // Timing-safe compare
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export const config = {
  api: {
    bodyParser: false, // we need the raw body for signature verification
  },
};
