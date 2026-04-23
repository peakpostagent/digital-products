// api/register.js — Register a subscriber for the weekly insights email.
// Called by the Chrome extension after the user confirms they want emails.
// POST body: { email, optIn, weekStats? }
//
// Security: this endpoint is deliberately lightweight. The real access gate is
// ExtensionPay's "paid" check inside the extension — this endpoint just stores
// contact prefs. Abuse vector would be email-bombing a stranger, which is why
// we send a confirmation email on first opt-in (see LAUNCH-CHECKLIST.md).

const { upsertSubscriber, removeSubscriber } = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const optIn = !!body.optIn;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    if (!optIn) {
      await removeSubscriber(email);
      return res.status(200).json({ ok: true, action: 'removed' });
    }

    // Build the patch conditionally — only include lastWeekStats if the
    // caller actually sent stats. Otherwise an opt-in-without-stats request
    // would overwrite the last real stats with null and the next digest
    // would email zeros.
    const patch = {
      optIn: true,
      currency: body.currency || 'USD',
      updatedAt: Date.now()
    };
    if (body.weekStats && typeof body.weekStats === 'object') {
      patch.lastWeekStats = body.weekStats;
    }

    const result = await upsertSubscriber(email, patch);
    return res.status(200).json({ ok: true, action: 'registered', subscriber: result.subscriber });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
