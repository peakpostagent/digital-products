// Meta Tag Inspector — Apify Actor
//
// Takes a URL, fetches the HTML (no JS execution needed — meta tags live
// in the static markup), and returns structured SEO metadata: title,
// description, Open Graph, Twitter Cards, canonical, robots, viewport,
// charset, favicon.
//
// Direct port of the Meta Tag Viewer Chrome extension (port underway, v1.0.1
// fixes the policy/manifest mismatch that caused the original rejection).
// The Actor version doesn't need the extension — anyone can call it via API.
//
// Pricing model (set in actor.json):
//   Free tier: 200 pages/month
//   Paid:      $0.003 per page scanned (cheaper than CSS Variables because
//              no browser needed)

const { Actor } = require('apify');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};

  const urls = Array.isArray(input.urls)
    ? input.urls
    : (input.url ? [input.url] : []);

  if (urls.length === 0) {
    throw new Error('No URLs provided. Pass either "url" (string) or "urls" (array of strings).');
  }

  const MAX_URLS_PER_RUN = 1000;
  if (urls.length > MAX_URLS_PER_RUN) {
    console.warn(`Capping ${urls.length} URLs to first ${MAX_URLS_PER_RUN}`);
    urls.length = MAX_URLS_PER_RUN;
  }

  console.log(`Inspecting ${urls.length} URL(s)...`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] ${url}`);
    const result = await inspectOne(url);
    await Actor.pushData(result);
  }

  console.log(`Done.`);
});

// Extract a meta tag's content by name OR property attribute. Returns the
// first match found, or empty string.
function getMeta(html, attr, value) {
  // Build a regex that finds <meta ... attr="value" ... content="..."> in
  // either attribute order (content can come before or after the name/property).
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]*\\s${attr}=["']${escaped}["'][^>]*\\scontent=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*\\scontent=["']([^"']*)["'][^>]*\\s${attr}=["']${escaped}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decodeEntities(m[1].trim());
  }
  return '';
}

// Simple HTML entity decoder — enough for meta tag values
function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

async function inspectOne(url) {
  let normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) return { url, error: 'Empty URL' };
  if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = 'https://' + normalizedUrl;

  let response;
  try {
    response = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PeakPostMetaInspector/1.0; +https://peakpost.ca)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    return {
      url: normalizedUrl,
      error: 'Fetch failed: ' + (err.message || String(err)),
      scannedAt: new Date().toISOString(),
    };
  }

  const html = await response.text();

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : '';

  // Extract canonical link
  const canonicalMatch = html.match(/<link[^>]*\srel=["']canonical["'][^>]*\shref=["']([^"']*)["']/i)
    || html.match(/<link[^>]*\shref=["']([^"']*)["'][^>]*\srel=["']canonical["']/i);
  const canonical = canonicalMatch ? decodeEntities(canonicalMatch[1].trim()) : '';

  // Extract favicon
  const faviconMatch = html.match(/<link[^>]*\srel=["'](?:shortcut )?icon["'][^>]*\shref=["']([^"']*)["']/i)
    || html.match(/<link[^>]*\shref=["']([^"']*)["'][^>]*\srel=["'](?:shortcut )?icon["']/i);
  let favicon = faviconMatch ? decodeEntities(faviconMatch[1].trim()) : '';
  if (favicon && !favicon.startsWith('http') && !favicon.startsWith('data:')) {
    try { favicon = new URL(favicon, normalizedUrl).href; } catch (_e) { /* keep as-is */ }
  }

  // Extract charset
  const charsetMatch = html.match(/<meta[^>]*\scharset=["']?([^"'\s>]+)/i);
  const charset = charsetMatch ? charsetMatch[1].trim() : '';

  // SEO score: count present fields
  const fields = {
    title: !!title,
    description: !!getMeta(html, 'name', 'description'),
    canonical: !!canonical,
    ogTitle: !!getMeta(html, 'property', 'og:title'),
    ogDescription: !!getMeta(html, 'property', 'og:description'),
    ogImage: !!getMeta(html, 'property', 'og:image'),
    twitterCard: !!getMeta(html, 'name', 'twitter:card'),
    viewport: !!getMeta(html, 'name', 'viewport'),
    charset: !!charset,
    favicon: !!favicon,
  };
  const presentCount = Object.values(fields).filter(Boolean).length;
  const score = Math.round((presentCount / Object.keys(fields).length) * 100);

  return {
    url: response.url || normalizedUrl,
    finalUrl: response.url || normalizedUrl,
    httpStatus: response.status,
    seoScore: score,                                  // 0-100 completeness score

    title,
    titleLength: title.length,
    titleWarning: title.length > 60 ? 'Title over 60 chars — may be truncated in SERPs' : '',

    description: getMeta(html, 'name', 'description'),
    descriptionLength: getMeta(html, 'name', 'description').length,
    descriptionWarning: getMeta(html, 'name', 'description').length > 160
      ? 'Description over 160 chars — may be truncated in SERPs' : '',

    canonical,
    canonicalDiffers: canonical && canonical !== response.url && canonical !== normalizedUrl,

    robots: getMeta(html, 'name', 'robots'),
    viewport: getMeta(html, 'name', 'viewport'),
    charset,
    favicon,

    openGraph: {
      title: getMeta(html, 'property', 'og:title'),
      description: getMeta(html, 'property', 'og:description'),
      image: getMeta(html, 'property', 'og:image'),
      url: getMeta(html, 'property', 'og:url'),
      type: getMeta(html, 'property', 'og:type'),
      siteName: getMeta(html, 'property', 'og:site_name'),
    },

    twitterCards: {
      card: getMeta(html, 'name', 'twitter:card'),
      title: getMeta(html, 'name', 'twitter:title'),
      description: getMeta(html, 'name', 'twitter:description'),
      image: getMeta(html, 'name', 'twitter:image'),
    },

    presentFields: fields,
    scannedAt: new Date().toISOString(),
    scannerVersion: '1.0.0',
  };
}
