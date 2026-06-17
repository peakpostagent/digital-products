/**
 * ExtKit Pro — Weekly digest cron template
 *
 * Pattern lifted from apis/mcc-insights/. Runs every Monday 09:00 UTC
 * (configurable in vercel.json), sends a Pro-only weekly summary to
 * subscribers via Resend.
 *
 * - Dedupe-keyed via Vercel KV — two firings of the same cron in the
 *   same week never double-email
 * - Per-user idempotency via a per-email dedupe key — safe to re-run
 * - Fails gracefully when RESEND_API_KEY is missing
 *
 * Required env vars:
 *   RESEND_API_KEY
 *   RESEND_FROM       — sender email (must be on a verified domain)
 *   KV_REST_API_URL
 *   KV_REST_API_TOKEN
 *
 * Configure in vercel.json:
 *   {
 *     "crons": [
 *       { "path": "/api/digest-cron", "schedule": "0 9 * * 1" }
 *     ]
 *   }
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM;
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  // Vercel cron sends a GET — accept both, reject everything else
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  // Optional shared secret for non-Vercel triggers
  if (process.env.CRON_SECRET) {
    const provided = req.headers['authorization'] || '';
    if (!provided.endsWith(process.env.CRON_SECRET)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
  }

  // Skip if not configured
  if (!RESEND_API_KEY || !RESEND_FROM) {
    res.status(200).json({ skipped: 'resend-not-configured' });
    return;
  }

  // Week-of-year dedupe key
  const now = new Date();
  const isoWeek = getIsoWeek(now);
  const dedupeKey = 'extkit:digest:' + isoWeek;
  if (await kvGet(dedupeKey)) {
    res.status(200).json({ skipped: 'already-sent-this-week', isoWeek });
    return;
  }

  const recipients = await loadRecipients();
  let sent = 0;
  let failed = 0;

  for (const email of recipients) {
    const perUserKey = 'extkit:digest:' + isoWeek + ':' + email;
    if (await kvGet(perUserKey)) continue;
    try {
      await sendDigest(email);
      await kvSet(perUserKey, '1', 60 * 60 * 24 * 14);
      sent++;
    } catch (err) {
      console.error('[ExtKit Pro] digest failed for', email, err);
      failed++;
    }
  }

  await kvSet(dedupeKey, '1', 60 * 60 * 24 * 14);
  res.status(200).json({ ok: true, sent, failed, isoWeek });
}

async function loadRecipients() {
  if (!KV_URL || !KV_TOKEN) return [];
  // In production, store subscribers in a KV set (e.g. extpay:paid-emails).
  // For this template scaffold we return an empty list — replace with your
  // real query (KV SMEMBERS / SCAN).
  return [];
}

async function sendDigest(toEmail) {
  // Customize this for YOUR extension's weekly digest content.
  const subject = '[Replace] Your weekly summary';
  const html = renderDigestHtml({ name: toEmail.split('@')[0] });
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + RESEND_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: toEmail,
      subject,
      html,
    }),
  });
}

function renderDigestHtml({ name }) {
  return `<!doctype html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h1 style="font-size:20px;">Hi ${escapeHtml(name)},</h1>
    <p>This is your weekly Pro digest. Replace this template with your real content.</p>
    <p>— Sent by your extension via ExtKit Pro</p>
  </body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function getIsoWeek(d) {
  // YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return date.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

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
