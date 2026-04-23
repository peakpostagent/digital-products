// api/cron/weekly-digest.js — Vercel cron entry point.
// Fires every Monday 09:00 UTC (see vercel.json). For each opted-in
// subscriber, generates an LLM insight paragraph and emails it via Resend.
//
// This is a fire-and-forget batch job. If it fails midway we'll re-run it
// manually via Vercel's "Run Now" button — the store marks lastSentAt so we
// won't double-send.

const crypto = require('crypto');
const { listSubscribers, upsertSubscriber } = require('../../lib/store');
const { generateInsight } = require('../../lib/llm');
const { renderEmailHtml, sendEmail } = require('../../lib/email');

// Only send at most once per 6 days — protects against re-triggering the cron.
const MIN_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000;

function buildUnsubscribeUrl(email) {
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://mcc-insights.vercel.app';
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return baseUrl + '/api/unsubscribe';
  const token = crypto.createHmac('sha256', secret).update(email).digest('hex');
  return baseUrl + '/api/unsubscribe?email=' + encodeURIComponent(email) + '&token=' + token;
}

// Safety cap on per-run subscriber count. Prevents a registration-spam attack
// (see register.js) from ballooning OpenAI + Resend costs. At 500 subscribers
// × $0.0002/LLM call ≈ $0.10 per run — well under the $10/mo ceiling. Real
// production growth past 500 means moving to a queue, not raising this cap.
const MAX_SUBSCRIBERS_PER_RUN = 500;

module.exports = async function handler(req, res) {
  // Fail CLOSED in production when CRON_SECRET is missing. Previous behavior
  // fell open ("dev/test mode"), which meant a forgotten Vercel env var turned
  // this endpoint into a free email-send + OpenAI-spend trigger.
  const cronSecret = process.env.CRON_SECRET;
  const isProd = process.env.VERCEL_ENV === 'production';
  if (isProd && !cronSecret) {
    console.error('[cron] CRON_SECRET not set in production — refusing to run');
    return res.status(500).json({ error: 'Service misconfigured' });
  }
  if (cronSecret) {
    const provided = req.headers.authorization || '';
    if (provided !== 'Bearer ' + cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const allSubscribers = await listSubscribers();
  const subscribers = allSubscribers.slice(0, MAX_SUBSCRIBERS_PER_RUN);
  if (allSubscribers.length > MAX_SUBSCRIBERS_PER_RUN) {
    console.warn('[cron] subscriber count ' + allSubscribers.length +
      ' exceeds cap ' + MAX_SUBSCRIBERS_PER_RUN + ' — processing first batch only');
  }
  const now = Date.now();

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const sub of subscribers) {
    try {
      if (!sub.optIn) { skipped++; continue; }
      if (sub.lastSentAt && (now - sub.lastSentAt) < MIN_INTERVAL_MS) {
        skipped++;
        continue;
      }

      const stats = sub.lastWeekStats || {
        totalMeetings: 0, totalCost: 0, avgCost: 0,
        valuablePercent: 0, prevTotalCost: 0, prevTotalMeetings: 0,
        currency: sub.currency || 'USD', weekKey: 'this week'
      };

      const insight = await generateInsight(stats);
      if (!insight.ok) { errors++; continue; }

      const html = renderEmailHtml(insight.text, stats)
        .replace('{{UNSUBSCRIBE_URL}}', buildUnsubscribeUrl(sub.email));

      const result = await sendEmail({
        to: sub.email,
        subject: 'Your meeting cost digest',
        html: html
      });

      if (!result.ok) { errors++; continue; }

      await upsertSubscriber(sub.email, { lastSentAt: now, lastSendId: result.id });
      sent++;
    } catch (err) {
      console.error('weekly-digest per-subscriber error', sub.email, err);
      errors++;
    }
  }

  return res.status(200).json({
    ok: true,
    total: subscribers.length,
    sent,
    skipped,
    errors,
    timestamp: new Date().toISOString()
  });
};
