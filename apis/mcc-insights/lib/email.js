// email.js — Render + deliver the weekly insights email via Resend.
// Resend is the simplest transactional email provider for small launches;
// swap providers by changing sendEmail() — the rest of the pipeline is
// provider-agnostic.

/**
 * Convert a plain-text LLM insight + raw numbers into HTML.
 * @param {string} insight — LLM-generated body (plain text)
 * @param {object} stats — Weekly aggregates for the callout table
 * @returns {string}
 */
function renderEmailHtml(insight, stats) {
  const currency = stats.currency || 'USD';
  const cost = (stats.totalCost || 0).toFixed(2);
  const avg = (stats.avgCost || 0).toFixed(2);
  const prev = (stats.prevTotalCost || 0).toFixed(2);

  // Keep HTML deliberately simple — maximum client compatibility.
  return [
    '<!doctype html>',
    '<html><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;padding:24px;">',
    '<h1 style="color:#1a73e8;font-size:20px;margin:0 0 12px;">Your weekly meeting digest</h1>',
    '<p style="font-size:14px;line-height:1.6;white-space:pre-line;">' + escapeHtml(insight) + '</p>',
    '<table cellpadding="8" cellspacing="0" style="width:100%;margin:20px 0;border:1px solid #e8eaed;border-radius:8px;font-size:13px;">',
    '  <tr><td>Meetings</td><td style="text-align:right;font-weight:700">' + escapeHtml(String(stats.totalMeetings || 0)) + '</td></tr>',
    '  <tr><td>Total cost</td><td style="text-align:right;font-weight:700">' + currency + ' ' + escapeHtml(cost) + '</td></tr>',
    '  <tr><td>Avg per meeting</td><td style="text-align:right;font-weight:700">' + currency + ' ' + escapeHtml(avg) + '</td></tr>',
    '  <tr><td>Prev week total</td><td style="text-align:right">' + currency + ' ' + escapeHtml(prev) + '</td></tr>',
    '  <tr><td>Meetings rated valuable</td><td style="text-align:right">' + escapeHtml(String(stats.valuablePercent || 0)) + '%</td></tr>',
    '</table>',
    '<p style="font-size:11px;color:#9aa0a6;margin-top:24px;">',
    '  Meeting Cost Calculator Pro &middot; ',
    '  <a href="{{UNSUBSCRIBE_URL}}" style="color:#9aa0a6;">Unsubscribe</a>',
    '</p>',
    '</body></html>'
  ].join('\n');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Send an email via Resend. Returns { ok, id } or { ok: false, error }.
 */
async function sendEmail({ to, subject, html, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not set' };
  }

  const fromAddress = from || process.env.RESEND_FROM || 'MCC Pro <noreply@meeting-cost.app>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: fromAddress, to, subject, html })
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: 'Resend: ' + err };
  }

  const data = await res.json();
  return { ok: true, id: data.id };
}

module.exports = { renderEmailHtml, sendEmail };
