/**
 * Schema.org / JSON-LD Validator — Apify Actor
 *
 * Extracts structured data from a page (application/ld+json + microdata),
 * validates against schema.org rules, and returns rich-snippet eligibility
 * per block. Helps SEO teams catch broken structured data before Google does.
 *
 * Heuristics are inspired by Google's Rich Results Test logic — we don't
 * call Google's API (rate-limited + closed), we reproduce the most common
 * checks locally.
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
    const result = await validateUrl(targetUrl);
    await Actor.pushData(result);
  }
});

// Schema.org types eligible for Google Rich Results, with required props
// Source: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
const RICH_RESULT_TYPES = {
  Article: { required: ['headline', 'image', 'datePublished', 'author'] },
  NewsArticle: { required: ['headline', 'image', 'datePublished', 'author'] },
  BlogPosting: { required: ['headline', 'image', 'datePublished', 'author'] },
  Recipe: { required: ['name', 'image', 'recipeIngredient', 'recipeInstructions'] },
  Product: { required: ['name', 'image', 'description', 'offers'] },
  Event: { required: ['name', 'startDate', 'location'] },
  FAQPage: { required: ['mainEntity'] },
  HowTo: { required: ['name', 'step'] },
  JobPosting: { required: ['title', 'description', 'datePosted', 'hiringOrganization'] },
  LocalBusiness: { required: ['name', 'address'] },
  Organization: { required: ['name'] },
  Person: { required: ['name'] },
  VideoObject: { required: ['name', 'description', 'thumbnailUrl', 'uploadDate'] },
  Review: { required: ['itemReviewed', 'reviewRating', 'author'] },
  Course: { required: ['name', 'description', 'provider'] },
  SoftwareApplication: { required: ['name', 'applicationCategory', 'operatingSystem'] },
  BreadcrumbList: { required: ['itemListElement'] },
};

async function validateUrl(targetUrl) {
  let response, html;
  try {
    response = await fetch(targetUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Apify-SchemaValidator/1.0)' },
      signal: AbortSignal.timeout(20000),
    });
    html = await response.text();
  } catch (err) {
    return { url: targetUrl, error: err.message, scannedAt: new Date().toISOString() };
  }

  const jsonLdBlocks = extractJsonLd(html);
  const microdataBlocks = extractMicrodata(html);

  const allEntities = [];
  let parseErrors = 0;

  for (const block of jsonLdBlocks) {
    const entities = flattenJsonLd(block.parsed);
    for (const e of entities) {
      allEntities.push({ source: 'json-ld', entity: e });
    }
    if (block.error) parseErrors++;
  }

  for (const m of microdataBlocks) {
    allEntities.push({ source: 'microdata', entity: m });
  }

  const validation = allEntities.map((wrap) => validateEntity(wrap.entity, wrap.source));

  // Aggregate
  const typesFound = new Set(validation.map((v) => v.type).filter(Boolean));
  const richResultEligible = validation.filter((v) => v.richResultEligible);
  const failures = validation.filter((v) => v.errors.length > 0);

  // Grade
  let score = 100;
  if (allEntities.length === 0) score -= 40;
  if (parseErrors > 0) score -= parseErrors * 10;
  if (failures.length > 0) score -= failures.length * 5;
  score = Math.max(0, score);

  let grade;
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    url: targetUrl,
    finalUrl: response?.url || targetUrl,
    httpStatus: response?.status ?? null,
    grade,
    score,
    summary: {
      totalEntities: allEntities.length,
      jsonLdBlocks: jsonLdBlocks.length,
      microdataBlocks: microdataBlocks.length,
      parseErrors,
      typesFound: Array.from(typesFound),
      richResultEligibleCount: richResultEligible.length,
      failureCount: failures.length,
    },
    entities: validation,
    scannedAt: new Date().toISOString(),
  };
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      blocks.push({ raw: raw.slice(0, 200), parsed, error: null });
    } catch (err) {
      blocks.push({ raw: raw.slice(0, 200), parsed: null, error: err.message });
    }
  }
  return blocks;
}

function flattenJsonLd(node) {
  // JSON-LD blocks can be:
  //  - a single entity
  //  - an array of entities
  //  - an entity with @graph containing entities
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenJsonLd);
  if (node['@graph'] && Array.isArray(node['@graph'])) {
    return node['@graph'].flatMap(flattenJsonLd);
  }
  if (node['@type']) return [node];
  return [];
}

function extractMicrodata(html) {
  // Lightweight microdata extraction — just type + key properties.
  // Full microdata parsing is heavy; we focus on detecting itemtype + itemprop pairs.
  const blocks = [];
  const itemtypeRe = /itemtype=["']([^"']+)["']/gi;
  let m;
  while ((m = itemtypeRe.exec(html)) !== null) {
    const url = m[1];
    const typeMatch = url.match(/schema\.org\/(\w+)/);
    if (typeMatch) {
      blocks.push({ '@type': typeMatch[1], source: 'microdata-itemtype' });
    }
  }
  return blocks;
}

function validateEntity(entity, source) {
  const type = Array.isArray(entity['@type']) ? entity['@type'][0] : entity['@type'];
  const spec = type ? RICH_RESULT_TYPES[type] : null;
  const errors = [];
  const warnings = [];

  if (!type) {
    errors.push('Missing @type');
  }

  if (spec) {
    for (const req of spec.required) {
      if (entity[req] === undefined || entity[req] === null || entity[req] === '') {
        errors.push(`Missing required property: ${req}`);
      }
    }
  }

  // @context check (JSON-LD only)
  if (source === 'json-ld' && !entity['@context']) {
    warnings.push('No @context — Google may not parse this');
  }

  return {
    source,
    type: type || null,
    richResultEligible: spec && errors.length === 0,
    errors,
    warnings,
    propertyCount: Object.keys(entity).filter((k) => !k.startsWith('@')).length,
  };
}
