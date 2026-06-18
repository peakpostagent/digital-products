// Security Headers Scanner — Apify Actor
//
// Takes a URL (or array of URLs), fetches the HTTP response headers, runs
// them through the same evaluator logic that ships in the Security Headers
// Chrome extension v1.3.0 (33 active users on CWS as of 2026-05-15), and
// returns a structured grade report.
//
// This Actor is a direct port — same evaluators, same scoring, same letter
// grade. The Chrome extension is the proven-organic-traction signal; the
// Apify Actor monetizes that demand on the Apify marketplace where:
//   - Apify handles billing (per-result or per-compute-unit pricing)
//   - Apify handles marketplace discovery
//   - No human upload required for new versions
//   - Solo creators in this category hit $1k–$10k MRR
//
// Pricing model (set in actor.json or Apify Console):
//   Free tier: 100 scans/month
//   Paid:      $0.005 per URL scanned (Apify takes 20% platform fee)
//
// Input schema: see INPUT_SCHEMA.json

const { Actor } = require('apify');
const { analyzeHeaders, calculateGrade, formatReport } = require('./lib/headers.js');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};

  // Accept either a single URL or an array. Normalize to array.
  // Fall back to https://example.com so Apify's daily auto-test passes.
  const urls = Array.isArray(input.urls) && input.urls.length
    ? input.urls
    : input.url
      ? [input.url]
      : ['https://example.com'];

  // Cap to prevent runaway costs from malformed input
  const MAX_URLS_PER_RUN = 1000;
  if (urls.length > MAX_URLS_PER_RUN) {
    console.warn(`Capping ${urls.length} URLs to first ${MAX_URLS_PER_RUN}`);
    urls.length = MAX_URLS_PER_RUN;
  }

  console.log(`Scanning ${urls.length} URL(s)...`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] ${url}`);

    const result = await scanOne(url);
    await Actor.pushData(result);
  }

  console.log(`Done. Scanned ${urls.length} URL(s).`);
});

async function scanOne(url) {
  // Normalize URL — add https:// if no scheme
  let normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    return { url, error: 'Empty URL' };
  }
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Try HEAD first (cheap), fall back to GET (some servers reject HEAD)
  const attempts = [{ method: 'HEAD' }, { method: 'GET' }];
  let response = null;
  let lastError = null;

  for (const attempt of attempts) {
    try {
      response = await fetch(normalizedUrl, {
        method: attempt.method,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      break;
    } catch (err) {
      lastError = err.message || String(err);
    }
  }

  if (!response) {
    return {
      url: normalizedUrl,
      error: 'Fetch failed: ' + lastError,
      scannedAt: new Date().toISOString(),
    };
  }

  // Extract headers as lowercase-keyed object
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const results = analyzeHeaders(headers);
  const grade = calculateGrade(results);

  // Per-header summary (more useful than raw results for downstream consumers)
  const headerSummary = results.map((r) => ({
    name: r.name,
    status: r.status,           // 'good' | 'weak' | 'missing'
    value: r.value || null,
    severity: r.severity,
    deprecated: r.deprecated || false,
    recommendation: r.recommendation,
  }));

  return {
    url: response.url || normalizedUrl,
    finalUrl: response.url || normalizedUrl,
    httpStatus: response.status,
    grade: grade.grade,
    percentage: grade.percentage,
    score: grade.score,
    maxScore: grade.maxScore,
    criticalIssues: grade.criticalIssues,
    importantIssues: grade.importantIssues,
    optionalIssues: grade.optionalIssues,
    headers: headerSummary,
    rawHeaders: headers,
    plainTextReport: formatReport(response.url || normalizedUrl, grade, results),
    scannedAt: new Date().toISOString(),
    scannerVersion: '1.3.0',
  };
}
