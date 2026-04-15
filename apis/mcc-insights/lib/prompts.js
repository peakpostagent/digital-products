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
function buildInsightPrompt(stats) {
  const safe = {
    totalMeetings: stats.totalMeetings || 0,
    totalCost: stats.totalCost || 0,
    avgCost: stats.avgCost || 0,
    valuablePercent: stats.valuablePercent || 0,
    weekKey: stats.weekKey || 'this week',
    currency: stats.currency || 'USD',
    prevTotalCost: stats.prevTotalCost || 0,
    prevTotalMeetings: stats.prevTotalMeetings || 0
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

module.exports = { buildInsightPrompt };
