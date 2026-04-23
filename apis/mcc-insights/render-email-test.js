#!/usr/bin/env node
// render-email-test.js — Dry-run the weekly-digest pipeline locally.
//
// Generates a sample insight (via OpenAI if OPENAI_API_KEY is set, else a
// canned stub), renders it through the real email template, and writes the
// result to preview.html so you can open it in a browser and see exactly
// what Pro subscribers will receive.
//
// Does NOT hit Resend or send any email.
//
// Usage:
//   cd apis/mcc-insights
//   node render-email-test.js
//
//   # Optional: override sample stats
//   node render-email-test.js --meetings 12 --cost 850 --currency USD

const fs = require('fs');
const path = require('path');

const { buildInsightPrompt } = require('./lib/prompts');
const { renderEmailHtml } = require('./lib/email');
const { generateInsight } = require('./lib/llm');

// --- parse CLI flags ----------------------------------------------------------

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1 || i === process.argv.length - 1) return fallback;
  const v = process.argv[i + 1];
  const n = Number(v);
  return Number.isFinite(n) && !isNaN(n) ? n : v;
}

const sampleStats = {
  totalMeetings: arg('meetings', 9),
  totalCost: arg('cost', 640.50),
  avgCost: arg('avg', 71.17),
  valuablePercent: arg('valuable', 55),
  weekKey: arg('week', 'week-of-2026-04-13'),
  currency: arg('currency', 'USD'),
  prevTotalCost: arg('prev-cost', 780.00),
  prevTotalMeetings: arg('prev-meetings', 11)
};

// --- main --------------------------------------------------------------------

async function main() {
  console.log('Input stats:');
  console.log(JSON.stringify(sampleStats, null, 2));
  console.log();

  const prompt = buildInsightPrompt(sampleStats);
  console.log('--- Prompt sent to LLM ---');
  console.log(prompt);
  console.log('--- end prompt ---\n');

  let insight;
  if (process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY detected — calling gpt-4o-mini...');
    try {
      insight = await generateInsight(prompt);
      console.log('LLM response:\n' + insight + '\n');
    } catch (err) {
      console.warn('LLM call failed: ' + err.message);
      console.warn('Falling back to stub insight.\n');
      insight = stubInsight(sampleStats);
    }
  } else {
    console.log('No OPENAI_API_KEY — using stub insight (set the env var to test the real prompt).\n');
    insight = stubInsight(sampleStats);
  }

  // Render to HTML (same function used in production)
  let html = renderEmailHtml(insight, sampleStats);

  // Replace the unsubscribe template token the cron normally fills in
  const demoUnsub = 'https://example.com/unsubscribe?demo';
  html = html.replace('{{UNSUBSCRIBE_URL}}', demoUnsub);

  const outPath = path.join(__dirname, 'preview.html');
  fs.writeFileSync(outPath, html);
  console.log('Wrote: ' + outPath);
  console.log('Size: ' + html.length + ' chars');
  console.log();
  console.log('Open it:');
  console.log('  start "" "' + outPath + '"        (Windows)');
  console.log('  open "' + outPath + '"             (macOS)');
  console.log('  xdg-open "' + outPath + '"         (Linux)');
}

// --- stub for offline preview -------------------------------------------------

function stubInsight(stats) {
  const trend = stats.totalCost < stats.prevTotalCost ? 'down' : 'up';
  const delta = Math.abs(stats.totalCost - stats.prevTotalCost).toFixed(2);
  return [
    'Your meetings were ' + trend + ' ' + stats.currency + ' ' + delta + ' vs. last week.',
    '',
    'With ' + stats.valuablePercent + '% of meetings marked valuable and an average cost of ' +
      stats.currency + ' ' + stats.avgCost.toFixed(2) + ', the pattern is clear: fewer, shorter meetings ' +
      'on the days you can swing it. Try blocking Tuesday and Thursday mornings as "maker time" next week ' +
      'and see what drops off the calendar without anyone noticing.',
    '',
    'Small edit this week: ' + stats.totalMeetings + ' meetings, $' + stats.totalCost.toFixed(2) + ' spent. ' +
      'You do not need to attend all of them.'
  ].join('\n');
}

main().catch((err) => {
  console.error('FATAL: ' + err.message);
  process.exit(1);
});
