/**
 * SEO Scanner — Example library
 *
 * Pure functions that audit the current page's SEO. Run in the page context
 * via the content script. Returns a typed result for the popup to render.
 *
 * This is intentionally lightweight — the goal is to demonstrate the
 * free-vs-Pro gating pattern, not to compete with full Lighthouse audits.
 */

export const FREE_HEURISTICS = ['title', 'description', 'h1', 'canonical', 'viewport'];

export const PRO_HEURISTICS = ['openGraph', 'twitter', 'structuredData', 'imageAltCoverage'];

export function scanPage(doc) {
  const titleEl = doc.querySelector('title');
  const descEl = doc.querySelector('meta[name="description"]');
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const viewportEl = doc.querySelector('meta[name="viewport"]');
  const h1Els = doc.querySelectorAll('h1');

  // Free-tier checks
  const title = titleEl?.textContent?.trim() || '';
  const description = descEl?.getAttribute('content')?.trim() || '';
  const canonical = canonicalEl?.getAttribute('href') || '';
  const viewport = viewportEl?.getAttribute('content') || '';

  // Pro-tier checks
  const og = {};
  doc.querySelectorAll('meta[property^="og:"]').forEach((el) => {
    og[el.getAttribute('property')] = el.getAttribute('content') || '';
  });
  const tw = {};
  doc.querySelectorAll('meta[name^="twitter:"]').forEach((el) => {
    tw[el.getAttribute('name')] = el.getAttribute('content') || '';
  });
  const ld = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      ld.push(JSON.parse(s.textContent));
    } catch (_) {
      // ignore invalid JSON
    }
  });

  const imgs = doc.querySelectorAll('img');
  let withAlt = 0;
  imgs.forEach((img) => {
    if (img.getAttribute('alt')) withAlt++;
  });
  const imageAltCoverage = imgs.length === 0 ? 1 : withAlt / imgs.length;

  // --- Per-check scoring ---
  return {
    free: {
      title: {
        value: title,
        length: title.length,
        score: title.length >= 30 && title.length <= 60 ? 'good' : title.length > 0 ? 'weak' : 'missing',
      },
      description: {
        value: description,
        length: description.length,
        score: description.length >= 120 && description.length <= 158 ? 'good' : description.length > 0 ? 'weak' : 'missing',
      },
      h1: {
        count: h1Els.length,
        firstText: h1Els[0]?.textContent?.trim() || '',
        score: h1Els.length === 1 ? 'good' : h1Els.length === 0 ? 'missing' : 'weak',
      },
      canonical: {
        value: canonical,
        score: canonical ? 'good' : 'missing',
      },
      viewport: {
        value: viewport,
        score: viewport.includes('width=device-width') ? 'good' : viewport ? 'weak' : 'missing',
      },
    },
    pro: {
      openGraph: {
        keys: Object.keys(og),
        hasTitle: !!og['og:title'],
        hasDescription: !!og['og:description'],
        hasImage: !!og['og:image'],
        score: og['og:title'] && og['og:image'] ? 'good' : Object.keys(og).length > 0 ? 'weak' : 'missing',
      },
      twitter: {
        card: tw['twitter:card'] || null,
        score: tw['twitter:card'] ? 'good' : 'missing',
      },
      structuredData: {
        count: ld.length,
        types: ld.map((d) => d['@type']).filter(Boolean),
        score: ld.length > 0 ? 'good' : 'missing',
      },
      imageAltCoverage: {
        totalImages: imgs.length,
        withAlt,
        ratio: Math.round(imageAltCoverage * 100) / 100,
        score: imageAltCoverage >= 0.9 ? 'good' : imageAltCoverage >= 0.5 ? 'weak' : 'missing',
      },
    },
  };
}

export function calculateGrade(result, includesPro) {
  let total = 0;
  let score = 0;
  for (const key of FREE_HEURISTICS) {
    const r = result.free[key];
    if (!r) continue;
    total += 1;
    if (r.score === 'good') score += 1;
    else if (r.score === 'weak') score += 0.5;
  }
  if (includesPro) {
    for (const key of PRO_HEURISTICS) {
      const r = result.pro[key];
      if (!r) continue;
      total += 1;
      if (r.score === 'good') score += 1;
      else if (r.score === 'weak') score += 0.5;
    }
  }
  const pct = total > 0 ? (score / total) * 100 : 0;
  let grade;
  if (pct >= 95) grade = 'A+';
  else if (pct >= 85) grade = 'A';
  else if (pct >= 70) grade = 'B';
  else if (pct >= 55) grade = 'C';
  else if (pct >= 40) grade = 'D';
  else grade = 'F';
  return { grade, percentage: Math.round(pct) };
}
