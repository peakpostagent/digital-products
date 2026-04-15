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

module.exports = async function handler(req, res) {
  // Vercel's cron calls set a specific header; keep public GET for manual test
  // but require a secret header in production. If CRON_SECRET isn't set we
  // treat the environment as "dev/test" and allow the call through.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers.authorization || '';
    if (provided !== 'Bearer ' + cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const subscribers = await listSubscribers();
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
