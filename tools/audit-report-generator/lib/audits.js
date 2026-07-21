/**
 * audits.js — Fetch-based website audits for the Peak Post audit report.
 *
 * Reuses the grading logic from the published Apify Actors, but runs
 * locally (Node native fetch) so a client audit costs nothing and needs
 * no Apify plan. Covers the eight fetch-only checks; the three
 * browser-only checks (color contrast, web vitals, PWA) are noted in the
 * report as "available on request" for the Premium tier.
 *
 * Every audit returns: { key, name, grade, score, findings[] }
 * where findings are { severity: 'good'|'warn'|'crit', label, detail }.
 */

const UA = 'Mozilla/5.0 (compatible; PeakPostAudit/1.0; +https://peakpost.ca)';

async function fetchWithMeta(url, opts = {}) {
  const started = Date.now();
  const r = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
    ...opts,
  });
  const body = await r.text();
  const headers = {};
  r.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  return { status: r.status, finalUrl: r.url, headers, body, ms: Date.now() - started };
}

function letter(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Robust <meta> content extractor. Handles quoted OR unquoted attribute
 * values (name=viewport vs name="viewport") and either attribute order.
 * Returns null if the tag is absent, '' if present but empty.
 */
function metaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const target = name.toLowerCase();
  for (const tag of tags) {
    const nameAttr = tag.match(/\b(?:name|property)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!nameAttr) continue;
    const nm = (nameAttr[1] ?? nameAttr[2] ?? nameAttr[3] ?? '').toLowerCase();
    if (nm !== target) continue;
    const contentAttr = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!contentAttr) return '';
    return contentAttr[1] ?? contentAttr[2] ?? contentAttr[3] ?? '';
  }
  return null;
}

/**
 * Correctly determine whether robots.txt blocks ALL crawlers.
 * Parses per user-agent group so a "Disallow: /" scoped to a specific bot
 * (e.g. deepcrawl) is never misread as a site-wide block. Handles grouped
 * consecutive User-agent lines that share a rule set.
 */
function robotsBlocksAll(robotsText) {
  const lines = robotsText.split(/\r?\n/);
  let currentAgents = [];
  let accumulatingAgents = false;
  for (const raw of lines) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === 'user-agent') {
      if (!accumulatingAgents) currentAgents = [];
      currentAgents.push(value.toLowerCase());
      accumulatingAgents = true;
    } else {
      accumulatingAgents = false;
      if (field === 'disallow' && value === '/' && currentAgents.includes('*')) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 1. Security headers
// ---------------------------------------------------------------------------
function auditSecurityHeaders(ctx) {
  const h = ctx.headers;
  const checks = [
    { name: 'Content-Security-Policy', weight: 20, sev: 'crit', present: !!h['content-security-policy'],
      weak: (v) => /unsafe-inline|unsafe-eval/i.test(v || '') },
    { name: 'Strict-Transport-Security', weight: 20, sev: 'crit', present: !!h['strict-transport-security'] },
    { name: 'X-Content-Type-Options', weight: 12, sev: 'warn', present: (h['x-content-type-options'] || '').toLowerCase() === 'nosniff' },
    { name: 'X-Frame-Options', weight: 14, sev: 'crit', present: !!h['x-frame-options'] || /frame-ancestors/i.test(h['content-security-policy'] || '') },
    { name: 'Referrer-Policy', weight: 10, sev: 'warn', present: !!h['referrer-policy'] },
    { name: 'Permissions-Policy', weight: 10, sev: 'warn', present: !!h['permissions-policy'] },
  ];
  let score = 0, max = 0;
  const findings = [];
  for (const c of checks) {
    max += c.weight;
    const val = h[c.name.toLowerCase()];
    if (c.present && c.weak && c.weak(val)) {
      score += c.weight * 0.5;
      findings.push({ severity: 'warn', label: `${c.name}: weak`, detail: `Present but contains unsafe directives — tighten it.` });
    } else if (c.present) {
      score += c.weight;
      findings.push({ severity: 'good', label: `${c.name}: set`, detail: '' });
    } else {
      findings.push({ severity: c.sev, label: `${c.name}: missing`, detail: recommendFor(c.name) });
    }
  }
  const pct = Math.round((score / max) * 100);
  return { key: 'security', name: 'Security Headers', grade: letter(pct), score: pct, findings };
}

function recommendFor(name) {
  const map = {
    'Content-Security-Policy': "Add a policy starting with default-src 'self' to block injection attacks.",
    'Strict-Transport-Security': 'Add max-age=31536000; includeSubDomains to force HTTPS.',
    'X-Content-Type-Options': 'Add "nosniff" to stop MIME-type confusion attacks.',
    'X-Frame-Options': 'Add DENY or SAMEORIGIN (or CSP frame-ancestors) to prevent clickjacking.',
    'Referrer-Policy': 'Add strict-origin-when-cross-origin to avoid leaking URLs.',
    'Permissions-Policy': 'Restrict camera/microphone/geolocation access explicitly.',
  };
  return map[name] || '';
}

// ---------------------------------------------------------------------------
// 2. SEO meta tags
// ---------------------------------------------------------------------------
function auditMeta(ctx) {
  const html = ctx.body;
  const meta = (name) => metaContent(html, name);
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || null;
  const desc = meta('description');
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) || [])[1] || null;
  const ogTitle = meta('og:title');
  const ogImage = meta('og:image');
  const viewport = meta('viewport');

  const findings = [];
  let score = 100;
  if (!title) { findings.push({ severity: 'crit', label: 'No <title> tag', detail: 'Every page needs a unique, descriptive title.' }); score -= 25; }
  else if (title.length < 30 || title.length > 60) { findings.push({ severity: 'warn', label: `Title length ${title.length} chars`, detail: 'Aim for 30-60 characters for full SERP display.' }); score -= 8; }
  else findings.push({ severity: 'good', label: `Title: "${title.slice(0, 50)}"`, detail: '' });

  if (!desc) { findings.push({ severity: 'crit', label: 'No meta description', detail: 'Add a 120-158 char description — it drives click-through from search.' }); score -= 20; }
  else if (desc.length < 120 || desc.length > 158) { findings.push({ severity: 'warn', label: `Description ${desc.length} chars`, detail: 'Aim for 120-158 characters.' }); score -= 6; }
  else findings.push({ severity: 'good', label: 'Meta description: good length', detail: '' });

  if (!canonical) { findings.push({ severity: 'warn', label: 'No canonical URL', detail: 'Add <link rel="canonical"> to prevent duplicate-content dilution.' }); score -= 10; }
  else findings.push({ severity: 'good', label: 'Canonical URL: set', detail: '' });

  if (!ogTitle || !ogImage) { findings.push({ severity: 'warn', label: 'Incomplete Open Graph tags', detail: 'Add og:title and og:image so shared links show a rich preview.' }); score -= 12; }
  else findings.push({ severity: 'good', label: 'Open Graph: title + image present', detail: '' });

  if (viewport == null) { findings.push({ severity: 'crit', label: 'No mobile viewport', detail: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> — without it the page renders zoomed-out on phones.' }); score -= 15; }
  else if (!/width=device-width/i.test(viewport)) { findings.push({ severity: 'warn', label: 'Viewport missing width=device-width', detail: 'A viewport is set but omits width=device-width — add it for correct responsive scaling.' }); score -= 6; }
  else findings.push({ severity: 'good', label: 'Mobile viewport: set', detail: '' });

  score = Math.max(0, score);
  return { key: 'seo', name: 'SEO & Meta Tags', grade: letter(score), score, findings };
}

// ---------------------------------------------------------------------------
// 3. Robots + sitemap
// ---------------------------------------------------------------------------
async function auditRobots(ctx) {
  const origin = new URL(ctx.finalUrl).origin;
  const findings = [];
  let score = 100;
  let robots = null;
  try {
    const r = await fetchWithMeta(origin + '/robots.txt');
    if (r.status === 200) {
      robots = r.body;
      if (robotsBlocksAll(r.body)) {
        findings.push({ severity: 'crit', label: 'robots.txt blocks all crawlers', detail: 'A "Disallow: /" for User-agent: * is silently killing your search visibility.' });
        score -= 40;
      } else {
        findings.push({ severity: 'good', label: 'robots.txt present and permissive', detail: '' });
      }
    } else {
      findings.push({ severity: 'warn', label: 'No robots.txt', detail: 'Add one to guide crawlers and declare your sitemap.' });
      score -= 15;
    }
  } catch (_) {
    findings.push({ severity: 'warn', label: 'robots.txt unreachable', detail: '' });
    score -= 10;
  }

  const sitemaps = (robots || '').match(/sitemap:\s*(\S+)/gi)?.map((l) => l.split(/:\s*/)[1]) || [origin + '/sitemap.xml'];
  try {
    const sm = await fetchWithMeta(sitemaps[0]);
    if (sm.status === 200 && /<urlset|<sitemapindex/i.test(sm.body)) {
      const count = (sm.body.match(/<loc>/g) || []).length;
      findings.push({ severity: 'good', label: `Sitemap found (${count} URLs)`, detail: '' });
    } else {
      findings.push({ severity: 'warn', label: 'No valid sitemap.xml', detail: 'Generate one so search engines discover every page.' });
      score -= 20;
    }
  } catch (_) {
    findings.push({ severity: 'warn', label: 'Sitemap unreachable', detail: '' });
    score -= 15;
  }
  score = Math.max(0, score);
  return { key: 'crawl', name: 'Crawlability (robots + sitemap)', grade: letter(score), score, findings };
}

// ---------------------------------------------------------------------------
// 4. Structured data
// ---------------------------------------------------------------------------
function auditSchema(ctx) {
  const html = ctx.body;
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const findings = [];
  let score = 100;
  if (blocks.length === 0) {
    findings.push({ severity: 'warn', label: 'No structured data (JSON-LD)', detail: 'Add schema.org markup to become eligible for Google Rich Results (stars, FAQs, breadcrumbs).' });
    score -= 35;
  } else {
    let types = [];
    let parseErr = 0;
    for (const b of blocks) {
      try {
        const node = JSON.parse(b[1].trim());
        const nodes = Array.isArray(node) ? node : node['@graph'] || [node];
        types.push(...nodes.map((n) => (Array.isArray(n['@type']) ? n['@type'][0] : n['@type'])).filter(Boolean));
      } catch (_) { parseErr++; }
    }
    if (parseErr) { findings.push({ severity: 'crit', label: `${parseErr} JSON-LD block(s) fail to parse`, detail: 'Invalid JSON means Google ignores it entirely.' }); score -= parseErr * 15; }
    if (types.length) findings.push({ severity: 'good', label: `Structured data: ${[...new Set(types)].join(', ')}`, detail: '' });
  }
  score = Math.max(0, score);
  return { key: 'schema', name: 'Structured Data', grade: letter(score), score, findings };
}

// ---------------------------------------------------------------------------
// 5. Image alt text
// ---------------------------------------------------------------------------
function auditImageAlt(ctx) {
  const imgs = [...ctx.body.matchAll(/<img\s+[^>]*>/gi)].map((m) => m[0]);
  const findings = [];
  if (imgs.length === 0) {
    return { key: 'alt', name: 'Image Accessibility', grade: 'A', score: 100, findings: [{ severity: 'good', label: 'No images to audit', detail: '' }] };
  }
  let missing = 0, filename = 0, decorative = 0;
  for (const tag of imgs) {
    // Distinguish: no alt attribute at all (fail) vs alt="" / bare alt
    // (explicitly decorative — valid WCAG) vs filename-as-alt (weak).
    const hasAltAttr = /\salt(\s*=|[\s>])/i.test(tag);
    const altMatch = tag.match(/\salt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const altVal = altMatch ? (altMatch[1] ?? altMatch[2] ?? altMatch[3] ?? '').trim() : '';
    if (!hasAltAttr) missing++;
    else if (altVal === '') decorative++;
    else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(altVal)) filename++;
  }
  const good = imgs.length - missing - filename; // decorative counts as acceptable
  const pct = Math.round((good / imgs.length) * 100);
  if (missing) findings.push({ severity: missing / imgs.length > 0.3 ? 'crit' : 'warn', label: `${missing} of ${imgs.length} images missing an alt attribute`, detail: 'Screen readers and Google Image search both need alt text. WCAG 1.1.1 requires every <img> to have an alt attribute (empty is fine only for decorative images).' });
  if (filename) findings.push({ severity: 'warn', label: `${filename} image(s) use a filename as alt`, detail: 'alt="IMG_1234.jpg" tells a screen-reader user nothing — describe the image.' });
  if (decorative && !missing && !filename) findings.push({ severity: 'good', label: `${imgs.length} images have alt attributes (${decorative} marked decorative)`, detail: '' });
  else if (!missing && !filename) findings.push({ severity: 'good', label: `All ${imgs.length} images have descriptive alt text`, detail: '' });
  return { key: 'alt', name: 'Image Accessibility', grade: letter(pct), score: pct, findings };
}

// ---------------------------------------------------------------------------
// 6. Trackers + privacy
// ---------------------------------------------------------------------------
function auditPrivacy(ctx) {
  const html = ctx.body;
  const trackers = [
    ['Google Analytics / GTM', /googletagmanager\.com|google-analytics\.com/i],
    ['Meta (Facebook) Pixel', /connect\.facebook\.net|fbevents\.js|fbq\(/i],
    ['TikTok Pixel', /analytics\.tiktok\.com|ttq\./i],
    ['LinkedIn Insight', /snap\.licdn\.com|_linkedin_partner_id/i],
    ['Hotjar', /static\.hotjar\.com|hjBootstrap/i],
    ['Microsoft Clarity', /clarity\.ms/i],
  ];
  const found = trackers.filter(([, re]) => re.test(html)).map(([n]) => n);
  const cmp = /onetrust|cookiebot|cookieyes|iubenda|termly|cookie-consent|cookielaw/i.test(html);
  const findings = [];
  let score = 100;
  if (found.length) {
    findings.push({ severity: 'good', label: `Trackers detected: ${found.join(', ')}`, detail: '' });
    if (!cmp) {
      findings.push({ severity: 'crit', label: 'Trackers present but no consent banner detected', detail: 'This is a likely GDPR/PIPEDA violation — trackers must not fire before consent in the EU/Canada/UK.' });
      score -= 45;
    } else {
      findings.push({ severity: 'good', label: 'Cookie consent platform detected', detail: '' });
    }
  } else {
    findings.push({ severity: 'good', label: 'No third-party trackers detected in initial HTML', detail: '' });
  }
  score = Math.max(0, score);
  return { key: 'privacy', name: 'Privacy & Compliance', grade: letter(score), score, findings };
}

// ---------------------------------------------------------------------------
// 7. HTTP / performance config
// ---------------------------------------------------------------------------
async function auditHttpConfig(url) {
  const findings = [];
  let score = 100;
  const isHttps = url.startsWith('https://');
  if (!isHttps) { findings.push({ severity: 'crit', label: 'Not served over HTTPS', detail: 'Modern baseline — required for HTTP/2, security, and SEO.' }); score -= 30; }
  else findings.push({ severity: 'good', label: 'HTTPS enabled', detail: '' });

  try {
    const r = await fetchWithMeta(url, { headers: { 'user-agent': UA, 'accept-encoding': 'br, gzip' } });
    const enc = (r.headers['content-encoding'] || '').toLowerCase();
    if (!enc) { findings.push({ severity: 'warn', label: 'No compression', detail: 'Enable Brotli or gzip — pages transfer 60-80% smaller.' }); score -= 20; }
    else if (enc === 'gzip') { findings.push({ severity: 'warn', label: 'Using gzip (Brotli would be better)', detail: 'Brotli saves another 15-25% over gzip.' }); score -= 6; }
    else findings.push({ severity: 'good', label: `Compression: ${enc}`, detail: '' });

    if (/h3/.test(r.headers['alt-svc'] || '')) findings.push({ severity: 'good', label: 'HTTP/3 advertised', detail: '' });
    else { findings.push({ severity: 'warn', label: 'HTTP/3 not advertised', detail: 'HTTP/3 speeds up repeat visits on mobile/flaky networks.' }); score -= 8; }

    if (!r.headers['cache-control']) { findings.push({ severity: 'warn', label: 'No Cache-Control header', detail: 'Set caching so returning visitors load instantly.' }); score -= 10; }
    else findings.push({ severity: 'good', label: 'Cache-Control: set', detail: '' });
  } catch (_) {
    findings.push({ severity: 'warn', label: 'Could not measure compression/protocol', detail: '' });
  }
  score = Math.max(0, score);
  return { key: 'http', name: 'HTTP & Performance Config', grade: letter(score), score, findings };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------
async function fetchWithRetry(url, opts = {}, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetchWithMeta(url, opts);
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 1200));
    }
  }
  throw lastErr;
}

async function runAllAudits(url) {
  // Retry once — a client's site having a momentary blip shouldn't fail
  // the whole audit. A genuinely unreachable site still throws (caught by
  // the CLI, which reports it clearly rather than crashing).
  const ctx = await fetchWithRetry(url);
  if (ctx.body && !/<html|<!doctype/i.test(ctx.body.slice(0, 2000)) && !ctx.body.includes('<meta')) {
    throw new Error(`URL did not return an HTML page (content looks non-HTML). Confirm it's a website URL, not a file or API endpoint.`);
  }
  const results = [
    auditSecurityHeaders(ctx),
    auditMeta(ctx),
    await auditRobots(ctx),
    auditSchema(ctx),
    auditImageAlt(ctx),
    auditPrivacy(ctx),
    await auditHttpConfig(ctx.finalUrl),
  ];
  const overall = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  return {
    url,
    finalUrl: ctx.finalUrl,
    httpStatus: ctx.status,
    overallScore: overall,
    overallGrade: letter(overall),
    audits: results,
    scannedAt: new Date().toISOString(),
  };
}

module.exports = { runAllAudits, letter };
