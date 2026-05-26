// apis/health/index.js — 15-minute self-monitoring cron.
//
// Runs every */15 min (see vercel.json crons). Pings every external dependency
// and routes failures through the alerts service. Designed to catch:
//   - Stripe API outage / key revoked
//   - Resend API outage / domain re-flagged unverified
//   - OpenAI / Anthropic quota exhausted
//   - mcc-insights weekly digest missed its window
//   - Vercel KV (subscriber index) became unreachable
//
// Each check has its own timeout (default 5s) so a single slow API can't
// stall the whole cron. Results aggregate; any FAIL or TIMEOUT routes a P1
// alert via apis/alerts/.

const ALERTS_URL = process.env.ALERTS_URL || 'https://peakpost-alerts.vercel.app/';

async function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function checkStripe(signal) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { check: 'stripe', status: 'skipped', reason: 'STRIPE_SECRET_KEY not set' };

  try {
    const r = await fetch('https://api.stripe.com/v1/charges?limit=1', {
      headers: { 'Authorization': 'Bearer ' + key },
      signal,
    });
    if (r.ok) return { check: 'stripe', status: 'ok' };
    return { check: 'stripe', status: 'fail', reason: 'HTTP ' + r.status };
  } catch (err) {
    return { check: 'stripe', status: 'fail', reason: err.message };
  }
}

async function checkResend(signal) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { check: 'resend', status: 'skipped', reason: 'RESEND_API_KEY not set' };

  try {
    const r = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': 'Bearer ' + key },
      signal,
    });
    if (!r.ok) return { check: 'resend', status: 'fail', reason: 'HTTP ' + r.status };
    const data = await r.json();
    // Find at least one verified domain — degraded if none verified
    const domains = data.data || [];
    const verified = domains.filter((d) => d.status === 'verified');
    if (verified.length === 0) {
      return { check: 'resend', status: 'fail', reason: 'No verified sending domain' };
    }
    return { check: 'resend', status: 'ok', detail: `${verified.length} verified domain(s)` };
  } catch (err) {
    return { check: 'resend', status: 'fail', reason: err.message };
  }
}

async function checkOpenAI(signal) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { check: 'openai', status: 'skipped', reason: 'OPENAI_API_KEY not set' };

  try {
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': 'Bearer ' + key },
      signal,
    });
    if (r.ok) return { check: 'openai', status: 'ok' };
    return { check: 'openai', status: 'fail', reason: 'HTTP ' + r.status };
  } catch (err) {
    return { check: 'openai', status: 'fail', reason: err.message };
  }
}

async function checkAnthropic(signal) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { check: 'anthropic', status: 'skipped', reason: 'ANTHROPIC_API_KEY not set' };

  try {
    // Cheap probe — request the models endpoint (no token spend)
    const r = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      signal,
    });
    if (r.ok) return { check: 'anthropic', status: 'ok' };
    return { check: 'anthropic', status: 'fail', reason: 'HTTP ' + r.status };
  } catch (err) {
    return { check: 'anthropic', status: 'fail', reason: err.message };
  }
}

async function checkMccDigestFreshness(signal) {
  // Skip if no KV configured
  let kv;
  try {
    kv = require('@vercel/kv').kv;
  } catch (_e) {
    return { check: 'mcc-digest', status: 'skipped', reason: 'KV not available' };
  }
  if (!process.env.KV_REST_API_URL) {
    return { check: 'mcc-digest', status: 'skipped', reason: 'KV_REST_API_URL not set' };
  }

  try {
    // Most recent send timestamp across all subscribers
    const emails = await kv.smembers('subscribers');
    if (!emails || emails.length === 0) {
      return { check: 'mcc-digest', status: 'ok', detail: 'No subscribers yet' };
    }
    let mostRecent = 0;
    for (const email of emails) {
      const sub = await kv.get('subscriber:' + email);
      if (sub && sub.lastSentAt > mostRecent) mostRecent = sub.lastSentAt;
    }
    if (mostRecent === 0) {
      return { check: 'mcc-digest', status: 'ok', detail: 'Digest never sent (new install)' };
    }
    const ageDays = (Date.now() - mostRecent) / (24 * 60 * 60 * 1000);
    if (ageDays > 8) {
      return { check: 'mcc-digest', status: 'fail', reason: `Last digest ${ageDays.toFixed(1)} days ago` };
    }
    return { check: 'mcc-digest', status: 'ok', detail: `Last digest ${ageDays.toFixed(1)} days ago` };
  } catch (err) {
    return { check: 'mcc-digest', status: 'fail', reason: err.message };
  }
}

async function postAlert(payload) {
  try {
    await fetch(ALERTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (_e) {
    /* If even the alerts service is down, we can't do much from here. */
  }
}

module.exports = async function handler(req, res) {
  // Cron auth (optional but recommended): if CRON_SECRET set, require Bearer
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers.authorization || '';
    if (provided !== 'Bearer ' + cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const results = await Promise.all([
    withTimeout(checkStripe, 5000),
    withTimeout(checkResend, 5000),
    withTimeout(checkOpenAI, 5000),
    withTimeout(checkAnthropic, 5000),
    withTimeout(checkMccDigestFreshness, 8000),
  ]);

  const failures = results.filter((r) => r.status === 'fail');
  const skipped = results.filter((r) => r.status === 'skipped');
  const okCount = results.filter((r) => r.status === 'ok').length;

  // Route a single consolidated alert per cron run, dedupe-keyed by the failure
  // set so we don't spam if the same thing fails every 15 min.
  if (failures.length > 0) {
    const dedupeKey = 'health:' + failures.map((f) => f.check).sort().join(',');
    await postAlert({
      severity: 'P1',
      source: 'health',
      subject: `Health check failures: ${failures.map((f) => f.check).join(', ')}`,
      body: failures.map((f) => `${f.check}: ${f.reason}`).join('\n'),
      dedupeKey,
    });
  }

  return res.status(200).json({
    ok: failures.length === 0,
    summary: { ok: okCount, fail: failures.length, skipped: skipped.length },
    results,
    timestamp: new Date().toISOString(),
  });
};
