# Broken Link Crawler

Crawl any site, find every broken link, get a CSV with each broken URL + the pages that link to it. Fetch-only (no headless browser) for speed and predictable cost.

## What it does

1. Starts from a single URL
2. Walks same-origin pages up to your `maxPages` cap (default 25)
3. Extracts every `<a href>` from each page
4. HEAD-checks every link; GET-fallback if HEAD fails
5. Returns one summary row + one row per broken link with HTTP status + up to 10 referring pages

## Input

```json
{
  "url": "https://example.com",
  "maxPages": 25,
  "includeExternal": true
}
```

## Output

Summary row:
```json
{
  "type": "summary",
  "startUrl": "https://example.com",
  "pagesCrawled": 24,
  "linksChecked": 487,
  "brokenCount": 12,
  "redirectCount": 31,
  "okCount": 444
}
```

Per-broken-link rows:
```json
{
  "type": "broken-link",
  "href": "https://example.com/old-page",
  "status": 404,
  "isExternal": false,
  "referrers": ["https://example.com/", "https://example.com/blog/post"]
}
```

Pipe straight to CSV in Apify Console — perfect for QA reports + client deliverables.

## Use cases

- **Pre-launch QA** — catch broken nav before going live
- **CMS migration recovery** — find every dead internal link after a Wordpress → Webflow move
- **SEO health checks** — broken internal links waste crawl budget
- **Client deliverables for SEO agencies** — auto-generate broken-link reports for monthly retainers
- **Continuous monitoring** — schedule weekly, alert on `brokenCount > N`

## Pricing

Pay-per-result: **$0.05/run.** A typical 25-page crawl with 500 links checked takes ~1-2 min.

## Author

Built by [Peak Post](https://peakpost.ca). Part of the SEO Audit Suite.
