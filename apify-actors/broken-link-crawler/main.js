/**
 * Broken Link Crawler — Apify Actor
 *
 * Walks N pages of a site, extracts every <a href>, checks each link's HTTP
 * status (HEAD with GET fallback), and returns a CSV-friendly report of
 * broken links + their referrers.
 *
 * Built fetch-only (no Playwright) for speed + cheap pricing. Same-origin
 * pages are crawled; external links are checked but not crawled.
 */

const { Actor } = require('apify');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};
  const startUrl = input.url || 'https://example.com';
  const maxPages = Math.min(input.maxPages || 25, 500);
  const maxLinksPerPage = Math.min(input.maxLinksPerPage || 200, 1000);
  const includeExternal = input.includeExternal !== false;

  const startOrigin = (() => {
    try {
      return new URL(startUrl).origin;
    } catch (_) {
      return null;
    }
  })();
  if (!startOrigin) {
    await Actor.pushData({ error: 'invalid-url', url: startUrl, scannedAt: new Date().toISOString() });
    return;
  }

  // Crawl queue (same-origin pages only)
  const queue = [startUrl];
  const visited = new Set();
  const allLinks = new Map(); // href -> {referrers: Set, isExternal}

  while (queue.length > 0 && visited.size < maxPages) {
    const pageUrl = queue.shift();
    if (visited.has(pageUrl)) continue;
    visited.add(pageUrl);

    const html = await fetchPage(pageUrl);
    if (!html) continue;

    const links = extractLinks(html, pageUrl).slice(0, maxLinksPerPage);
    for (const link of links) {
      const isExternal = !link.startsWith(startOrigin);
      if (!allLinks.has(link)) {
        allLinks.set(link, { referrers: new Set(), isExternal });
      }
      allLinks.get(link).referrers.add(pageUrl);

      // Crawl same-origin pages
      if (!isExternal && !visited.has(link) && !queue.includes(link)) {
        queue.push(link);
      }
    }
  }

  // Check each unique link
  const linkResults = [];
  let broken = 0;
  let redirects = 0;
  let okCount = 0;

  for (const [href, info] of allLinks.entries()) {
    if (info.isExternal && !includeExternal) continue;
    const check = await checkLink(href);
    const result = {
      href,
      status: check.status,
      finalUrl: check.finalUrl,
      redirected: check.redirected,
      isExternal: info.isExternal,
      isBroken: check.status >= 400 || check.status === null,
      referrers: Array.from(info.referrers).slice(0, 10),
      checkedAt: new Date().toISOString(),
    };
    if (result.isBroken) broken++;
    else if (check.status >= 300 && check.status < 400) redirects++;
    else okCount++;
    linkResults.push(result);
  }

  // Push one summary row + one row per broken link (so dataset CSV is useful)
  await Actor.pushData({
    type: 'summary',
    startUrl,
    pagesCrawled: visited.size,
    linksChecked: linkResults.length,
    brokenCount: broken,
    redirectCount: redirects,
    okCount,
    scannedAt: new Date().toISOString(),
  });
  for (const r of linkResults.filter((r) => r.isBroken)) {
    await Actor.pushData({ type: 'broken-link', ...r });
  }
});

async function fetchPage(url) {
  try {
    const r = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Apify-BrokenLinkCrawler/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    return await r.text();
  } catch (_) {
    return null;
  }
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const re = /<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let href = m[1].trim();
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }
    try {
      const abs = new URL(href, baseUrl).href;
      links.add(abs.replace(/#.*$/, ''));
    } catch (_) {
      // ignore malformed
    }
  }
  return Array.from(links);
}

async function checkLink(url) {
  // Try HEAD first (cheap), fall back to GET if HEAD fails
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(url, {
        method,
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; Apify-BrokenLinkCrawler/1.0)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      return { status: r.status, finalUrl: r.url, redirected: r.redirected };
    } catch (err) {
      if (method === 'GET') return { status: null, finalUrl: url, redirected: false, error: err.message };
    }
  }
  return { status: null, finalUrl: url, redirected: false };
}
