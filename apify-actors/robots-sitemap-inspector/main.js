/**
 * Robots & Sitemap Inspector — Apify Actor
 *
 * Fetches /robots.txt, parses directives, then walks the linked sitemap.xml
 * (or default /sitemap.xml). Returns a structured health report with letter
 * grade — useful for SEO audits, crawl-budget triage, and migration health
 * checks.
 *
 * No browser needed — pure fetch + XML/text parse. Cheapest Actor in the
 * portfolio to operate.
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
    const result = await inspectSite(targetUrl);
    await Actor.pushData(result);
  }
});

async function inspectSite(targetUrl) {
  const origin = (() => {
    try {
      const u = new URL(targetUrl);
      return u.origin;
    } catch (_) {
      return null;
    }
  })();
  if (!origin) {
    return { url: targetUrl, error: 'invalid-url', scannedAt: new Date().toISOString() };
  }

  // --- robots.txt ---
  const robotsResult = await fetchRobots(origin + '/robots.txt');

  // --- Sitemap ---
  let sitemapUrls = robotsResult.sitemaps || [];
  if (sitemapUrls.length === 0) sitemapUrls = [origin + '/sitemap.xml'];

  const sitemapResults = [];
  for (const sm of sitemapUrls.slice(0, 5)) {
    sitemapResults.push(await fetchSitemap(sm));
  }

  // Aggregate
  const totalUrls = sitemapResults.reduce((sum, s) => sum + (s.urlCount || 0), 0);
  const allLastmods = sitemapResults.flatMap((s) => s.lastmods || []);
  const oldest = allLastmods.length ? allLastmods.reduce((a, b) => (a < b ? a : b)) : null;
  const newest = allLastmods.length ? allLastmods.reduce((a, b) => (a > b ? a : b)) : null;

  // --- Score ---
  const issues = [];
  let score = 100;
  if (!robotsResult.found) {
    issues.push('No robots.txt found');
    score -= 15;
  } else if (robotsResult.size > 500000) {
    issues.push('robots.txt is unusually large (>500KB)');
    score -= 10;
  }
  if (sitemapResults.every((s) => !s.found)) {
    issues.push('No accessible sitemap');
    score -= 25;
  }
  if (totalUrls === 0 && sitemapResults.some((s) => s.found)) {
    issues.push('Sitemap exists but contains no URLs');
    score -= 20;
  }
  if (oldest) {
    const oldDays = Math.floor((Date.now() - new Date(oldest).getTime()) / (1000 * 60 * 60 * 24));
    if (oldDays > 730) {
      issues.push('Oldest lastmod is >2 years ago');
      score -= 10;
    }
  }
  if (robotsResult.found && robotsResult.disallowAll) {
    issues.push('robots.txt disallows all crawlers');
    score -= 30;
  }

  let grade;
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    url: targetUrl,
    origin,
    grade,
    score: Math.max(0, score),
    robots: robotsResult,
    sitemaps: sitemapResults,
    summary: {
      totalUrls,
      sitemapCount: sitemapResults.filter((s) => s.found).length,
      oldestLastmod: oldest,
      newestLastmod: newest,
    },
    issues,
    scannedAt: new Date().toISOString(),
  };
}

async function fetchRobots(robotsUrl) {
  try {
    const resp = await fetch(robotsUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Apify-RobotsInspector/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      return { url: robotsUrl, found: false, httpStatus: resp.status };
    }
    const text = await resp.text();
    return { url: robotsUrl, found: true, httpStatus: 200, size: text.length, ...parseRobots(text) };
  } catch (err) {
    return { url: robotsUrl, found: false, error: err.message };
  }
}

function parseRobots(text) {
  const lines = text.split(/\r?\n/);
  const userAgentGroups = [];
  const sitemaps = [];
  let currentGroup = null;
  let disallowAll = false;
  let crawlDelay = null;

  for (const raw of lines) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'user-agent') {
      currentGroup = { userAgent: value, allows: [], disallows: [] };
      userAgentGroups.push(currentGroup);
    } else if (directive === 'disallow' && currentGroup) {
      currentGroup.disallows.push(value);
      if (value === '/' && (currentGroup.userAgent === '*' || /googlebot|bingbot/i.test(currentGroup.userAgent))) {
        disallowAll = true;
      }
    } else if (directive === 'allow' && currentGroup) {
      currentGroup.allows.push(value);
    } else if (directive === 'sitemap') {
      sitemaps.push(value);
    } else if (directive === 'crawl-delay') {
      const n = parseFloat(value);
      if (!isNaN(n)) crawlDelay = n;
    }
  }

  return {
    userAgents: userAgentGroups.map((g) => g.userAgent),
    groups: userAgentGroups,
    sitemaps,
    crawlDelay,
    disallowAll,
  };
}

async function fetchSitemap(sitemapUrl) {
  try {
    const resp = await fetch(sitemapUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Apify-RobotsInspector/1.0)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) {
      return { url: sitemapUrl, found: false, httpStatus: resp.status };
    }
    const text = await resp.text();
    return { url: sitemapUrl, found: true, httpStatus: 200, size: text.length, ...parseSitemap(text) };
  } catch (err) {
    return { url: sitemapUrl, found: false, error: err.message };
  }
}

function parseSitemap(xml) {
  // Detect type: sitemap index vs urlset
  const isIndex = /<sitemapindex/i.test(xml);
  const isUrlSet = /<urlset/i.test(xml);
  const type = isIndex ? 'sitemapindex' : isUrlSet ? 'urlset' : 'unknown';

  // Extract <loc> tags
  const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
  const lastmods = Array.from(xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g))
    .map((m) => m[1].trim())
    .filter(Boolean);

  return {
    type,
    urlCount: locs.length,
    lastmodCount: lastmods.length,
    sampleUrls: locs.slice(0, 20),
    lastmods,
  };
}
