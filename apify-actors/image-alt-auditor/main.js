/**
 * Image Alt-Text Auditor — Apify Actor
 *
 * Walks a URL (or list), extracts every <img> tag, reports alt-text
 * coverage + per-image flags. WCAG 1.1.1 (Non-text Content) compliance.
 *
 * Detects four common patterns:
 *  - Missing alt entirely (illegal — alt is required, even if empty)
 *  - Empty alt with no role=presentation (often unintentional)
 *  - Decorative alt that should be empty
 *  - Useful alt text with proper length
 *
 * Fetch-only; for SPAs with JS-rendered images you'd want a Playwright Actor.
 */

const { Actor } = require('apify');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};
  const urls = Array.isArray(input.urls) && input.urls.length
    ? input.urls
    : input.url
      ? [input.url]
      : ['https://example.com'];

  for (const targetUrl of urls.slice(0, 1000)) {
    const result = await auditUrl(targetUrl);
    await Actor.pushData(result);
  }
});

async function auditUrl(targetUrl) {
  let response, html;
  try {
    response = await fetch(targetUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Apify-ImageAltAuditor/1.0)' },
      signal: AbortSignal.timeout(20000),
    });
    html = await response.text();
  } catch (err) {
    return { url: targetUrl, error: err.message, scannedAt: new Date().toISOString() };
  }

  const images = extractImages(html, response.url || targetUrl);
  const checks = images.map(checkImage);

  const total = checks.length;
  const issues = {
    missingAlt: checks.filter((c) => c.flags.includes('missing-alt')).length,
    emptyAltSuspect: checks.filter((c) => c.flags.includes('empty-alt-suspect')).length,
    decorativeShouldBeEmpty: checks.filter((c) => c.flags.includes('decorative-should-be-empty')).length,
    altTooLong: checks.filter((c) => c.flags.includes('alt-too-long')).length,
    filenameAsAlt: checks.filter((c) => c.flags.includes('filename-as-alt')).length,
  };

  const goodImages = checks.filter((c) => c.severity === 'good').length;
  const passRate = total > 0 ? Math.round((goodImages / total) * 1000) / 10 : 100;

  let grade;
  if (passRate >= 95) grade = 'A+';
  else if (passRate >= 85) grade = 'A';
  else if (passRate >= 70) grade = 'B';
  else if (passRate >= 55) grade = 'C';
  else if (passRate >= 40) grade = 'D';
  else grade = 'F';

  return {
    url: targetUrl,
    finalUrl: response?.url || targetUrl,
    httpStatus: response?.status ?? null,
    grade,
    passRate,
    totalImages: total,
    goodImages,
    issues,
    images: checks.slice(0, 200),
    scannedAt: new Date().toISOString(),
  };
}

function extractImages(html, baseUrl) {
  const out = [];
  // Match <img> tags and pull every attribute we care about
  const tagRe = /<img\s+([^>]*)\/?>/gi;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const attrs = parseAttrs(m[1]);
    out.push({
      src: attrs.src ? resolveUrl(attrs.src, baseUrl) : null,
      alt: attrs.alt, // undefined = attribute missing; '' = empty alt
      title: attrs.title,
      role: attrs.role,
      ariaHidden: attrs['aria-hidden'],
      ariaLabel: attrs['aria-label'],
      width: attrs.width,
      height: attrs.height,
      loading: attrs.loading,
    });
  }
  return out;
}

function parseAttrs(str) {
  const attrs = {};
  const re = /(\w+(?:-\w+)*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
  }
  // Detect attribute-without-value: e.g. <img alt>
  // (rare but valid HTML — treat as empty string)
  const boolRe = /\b(alt|aria-hidden)\b(?!\s*=)/gi;
  let bm;
  while ((bm = boolRe.exec(str)) !== null) {
    const name = bm[1].toLowerCase();
    if (attrs[name] === undefined) attrs[name] = '';
  }
  return attrs;
}

function resolveUrl(src, base) {
  try {
    return new URL(src, base).href;
  } catch (_) {
    return src;
  }
}

function checkImage(img) {
  const flags = [];

  // Per WCAG 1.1.1: every <img> needs alt. Missing alt is the only hard failure.
  if (img.alt === undefined) {
    flags.push('missing-alt');
  }

  // Empty alt is valid IF the image is decorative. We flag it as suspect
  // when no role=presentation / aria-hidden=true is present.
  if (img.alt === '' && img.role !== 'presentation' && img.ariaHidden !== 'true') {
    flags.push('empty-alt-suspect');
  }

  // Decorative images SHOULD have empty alt — flag if they have text
  if ((img.role === 'presentation' || img.ariaHidden === 'true') && img.alt && img.alt.length > 0) {
    flags.push('decorative-should-be-empty');
  }

  // Alt text >150 chars is a Lighthouse warning
  if (img.alt && img.alt.length > 150) {
    flags.push('alt-too-long');
  }

  // Filename-as-alt detection (e.g. alt="IMG_1234.jpg")
  if (img.alt && /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(img.alt.trim())) {
    flags.push('filename-as-alt');
  }

  // Severity
  let severity = 'good';
  if (flags.includes('missing-alt')) severity = 'critical';
  else if (flags.includes('filename-as-alt') || flags.includes('decorative-should-be-empty')) severity = 'warning';
  else if (flags.includes('empty-alt-suspect') || flags.includes('alt-too-long')) severity = 'info';

  return {
    src: img.src,
    alt: img.alt ?? null,
    altLength: img.alt?.length ?? null,
    role: img.role ?? null,
    ariaHidden: img.ariaHidden ?? null,
    flags,
    severity,
  };
}
