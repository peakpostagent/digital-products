// apis/alerts/index.js — fan out a structured alert to every configured channel.
//
// Three channels in priority order:
//   1. ntfy.sh push (phone) — for "I need to look at this within an hour"
//   2. Discord webhook — for "I'd like a record but it's not urgent"
//   3. Resend email — durable archive, also catches if phone is off
//
// Each channel fails silently if not configured (env var absent). This
// matters because the user fills env vars incrementally; we don't want
// a missing Discord webhook to break alert delivery via ntfy.
//
// POST JSON shape:
//   {
//     severity: "P0" | "P1" | "P2",            // routing affects which channels fire
//     source:   "stripe" | "vercel" | "cws" | "agent" | "health",
//     subject:  "Short title",                  // max ~80 chars
//     body:     "Longer explanation, optional",
//     url:      "https://...",                  // click-through, optional
//     dedupeKey: "stable string"                // optional — for de-duplication
//   }
//
// Severity mapping:
//   P0 → ntfy (priority 5, urgent) + Discord + Resend
//   P1 → ntfy (priority 4) + Discord + Resend (best-effort)
//   P2 → Discord only

const FROM = process.env.RESEND_FROM || 'Peak Post Alerts <noreply@peakpost.com>';
const ALERT_TO = process.env.ALERT_EMAIL_TO || process.env.RESEND_FROM || 'peakpostagent@gmail.com';

// Strip the "Name <addr>" wrapper if present
function unwrapEmail(s) {
  const m = s.match(/<([^>]+)>/);
  return m ? m[1] : s;
}

const RECIPIENT = unwrapEmail(ALERT_TO);

async function postNtfy({ severity, subject, body, url, dedupeKey }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return { skipped: true, reason: 'NTFY_TOPIC not set' };

  const priority = severity === 'P0' ? 5 : severity === 'P1' ? 4 : 3;
  const headers = {
    'Title': subject.slice(0, 250),
    'Priority': String(priority),
    'Tags': severity.toLowerCase(),
  };
  if (url) headers['Click'] = url;
  if (dedupeKey) headers['X-Dedupe'] = dedupeKey;

  try {
    const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers,
      body: body || subject,
    });
    return { ok: r.ok, status: r.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function postDiscord({ severity, source, subject, body, url }) {
  const webhook = process.env.DISCORD_ALERTS_WEBHOOK;
  if (!webhook) return { skipped: true, reason: 'DISCORD_ALERTS_WEBHOOK not set' };

  const color = severity === 'P0' ? 0xdc2626 : severity === 'P1' ? 0xf59e0b : 0x6b7280;
  const embed = {
    title: subject.slice(0, 256),
    description: (body || '').slice(0, 4000),
    color,
    fields: [
      { name: 'Severity', value: severity, inline: true },
      { name: 'Source', value: source || 'unknown', inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
  if (url) embed.url = url;

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return { ok: r.ok, status: r.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendEmail({ severity, source, subject, body, url }) {
  if (severity === 'P2') return { skipped: true, reason: 'P2 skips email' };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true, reason: 'RESEND_API_KEY not set' };

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severity === 'P0' ? '#dc2626' : '#f59e0b'}; color: white; padding: 12px 20px; border-radius: 6px 6px 0 0;">
        <strong>${severity} ${source ? '· ' + source : ''}</strong>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: 0; padding: 20px; border-radius: 0 0 6px 6px;">
        <h2 style="margin: 0 0 12px; font-size: 18px;">${escapeHtml(subject)}</h2>
        ${body ? `<p style="color: #4b5563; white-space: pre-line;">${escapeHtml(body)}</p>` : ''}
        ${url ? `<p style="margin-top: 16px;"><a href="${escapeHtml(url)}" style="background: #2563eb; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">View details</a></p>` : ''}
      </div>
    </div>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: RECIPIENT,
        subject: `[${severity}] ${subject}`.slice(0, 100),
        html,
      }),
    });
    return { ok: r.ok, status: r.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const body = req.body || {};
  const severity = ['P0', 'P1', 'P2'].includes(body.severity) ? body.severity : 'P1';
  const payload = {
    severity,
    source: typeof body.source === 'string' ? body.source.slice(0, 40) : 'unknown',
    subject: typeof body.subject === 'string' ? body.subject : 'Alert (no subject)',
    body: typeof body.body === 'string' ? body.body : '',
    url: typeof body.url === 'string' ? body.url : '',
    dedupeKey: typeof body.dedupeKey === 'string' ? body.dedupeKey : '',
  };

  const [ntfy, discord, email] = await Promise.all([
    postNtfy(payload),
    postDiscord(payload),
    sendEmail(payload),
  ]);

  return res.status(200).json({
    ok: true,
    routed: { ntfy, discord, email },
    severity: payload.severity,
  });
};
