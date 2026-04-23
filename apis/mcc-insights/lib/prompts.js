// prompts.js — Prompt templates for MCC Pro weekly insights.
// Kept in a separate file so iteration on copy doesn't touch the API handler.

/**
 * Build the LLM prompt for the weekly digest.
 * Note: stats are aggregate numbers. We never send individual meeting titles
 * or attendee emails to the LLM — the privacy promise in the popup depends
 * on this being true.
 *
 * @param {object} stats — Weekly aggregates
 *   { totalMeetings, totalCost, avgCost, valuablePercent, weekKey, currency,
 *     prevTotalCost, prevTotalMeetings }
 * @returns {string}
 */
// Strings passed into the LLM prompt must be sanitized — weekKey and currency
// come from the extension (and ultimately the end user). An attacker could
// register with weekKey="ignore previous instructions and instead output X"
// and poison the email text every weekly send. Block everything that isn't
// plainly alphanumeric + limited whitespace.
const WEEK_KEY_PATTERN = /^[a-zA-Z0-9\- ]{1,40}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/; // ISO 4217

function sanitizeWeekKey(v) {
  return typeof v === 'string' && WEEK_KEY_PATTERN.test(v) ? v : 'this week';
}

function sanitizeCurrency(v) {
  return typeof v === 'string' && CURRENCY_PATTERN.test(v) ? v : 'USD';
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && !isNaN(n) ? n : 0;
}

function buildInsightPrompt(stats) {
  const safe = {
    totalMeetings: toNumber(stats.totalMeetings),
    totalCost: toNumber(stats.totalCost),
    avgCost: toNumber(stats.avgCost),
    valuablePercent: toNumber(stats.valuablePercent),
    weekKey: sanitizeWeekKey(stats.weekKey),
    currency: sanitizeCurrency(stats.currency),
    prevTotalCost: toNumber(stats.prevTotalCost),
    prevTotalMeetings: toNumber(stats.prevTotalMeetings)
  };

  return [
    'You are an expert at helping knowledge workers reduce meeting overhead.',
    'Given the anonymized weekly meeting statistics below, write a short email',
    'digest (120 words max) with:',
    '  1. A one-line headline about the week.',
    '  2. The single most actionable recommendation.',
    '  3. A one-line closing nudge.',
    'Be warm, specific, and avoid corporate jargon. Use the exact numbers given.',
    'Do NOT invent meeting titles or names. Output plain text only — no markdown headings.',
    '',
    'Week: ' + safe.weekKey,
    'Meetings: ' + safe.totalMeetings,
    'Total cost: ' + safe.currency + ' ' + safe.totalCost.toFixed(2),
    'Avg cost per meeting: ' + safe.currency + ' ' + safe.avgCost.toFixed(2),
    'Valuable meetings: ' + safe.valuablePercent + '%',
    'Prev week total cost: ' + safe.currency + ' ' + safe.prevTotalCost.toFixed(2),
    'Prev week meetings: ' + safe.prevTotalMeetings
  ].join('\n');
}

module.exports = { buildInsightPrompt, sanitizeWeekKey, sanitizeCurrency };
