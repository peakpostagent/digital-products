# Robots & Sitemap Inspector

Audit any site's robots.txt + sitemap.xml in seconds. Letter grade (A+ to F), structured health report, and actionable issues.

## What it does

- Fetches `/robots.txt`, parses every directive (User-agent groups, Allow/Disallow, Sitemap, Crawl-delay)
- Walks linked sitemaps (or falls back to `/sitemap.xml`), up to 5 sub-sitemaps from a sitemap index
- Counts URLs, tracks oldest + newest `lastmod`, flags health issues
- Detects the catastrophic "disallow: /" that silently kills SEO

## Input

```json
{ "url": "https://example.com" }
```

Batch mode:

```json
{ "urls": ["https://a.com", "https://b.com"] }
```

## Output

```json
{
  "url": "https://example.com",
  "grade": "B",
  "score": 75,
  "robots": {
    "found": true,
    "size": 1240,
    "userAgents": ["*", "Googlebot"],
    "sitemaps": ["https://example.com/sitemap.xml"],
    "crawlDelay": null,
    "disallowAll": false
  },
  "sitemaps": [
    { "url": "https://example.com/sitemap.xml", "found": true, "urlCount": 124, "type": "urlset", "lastmodCount": 124 }
  ],
  "summary": {
    "totalUrls": 124,
    "sitemapCount": 1,
    "oldestLastmod": "2024-03-15",
    "newestLastmod": "2026-06-17"
  },
  "issues": []
}
```

## Use cases

- **SEO migration QA** — verify sitemaps survived a CMS move
- **Crawl-budget triage** — find sites whose robots.txt accidentally blocks Googlebot
- **Lead enrichment for SEO agencies** — find prospects with broken sitemaps
- **Pre-launch checks** — confirm staging robots.txt isn't pushed to prod

## Pricing

Pay-per-result: **$0.005/URL audited.** Fetch-only, so this Actor is cheap to run — perfect for nightly audits across hundreds of sites.

## Author

Built by [Peak Post](https://peakpost.ca) — 22+ Chrome extensions, 6+ Apify Actors. Part of an "SEO portfolio" that pairs with Meta Tag Inspector, Schema Validator, and Security Headers Scanner.
