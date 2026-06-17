# Web Vitals Reporter

Measure Google Core Web Vitals (LCP, CLS, INP, FCP, TTFB) for any URL using a real Chromium browser, with per-metric pass/needs-improvement/poor classification and an overall A-F grade.

## What it does

Loads the URL in headless Chromium, injects Google's `web-vitals` library, simulates user scroll + mouse movement to trigger INP measurement, and returns a structured report.

Each metric is classified per [Google's 2026 thresholds](https://web.dev/articles/vitals):

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5 s | ≤ 4.0 s | > 4.0 s |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| INP | ≤ 200 ms | ≤ 500 ms | > 500 ms |
| FCP | ≤ 1.8 s | ≤ 3.0 s | > 3.0 s |
| TTFB | ≤ 0.8 s | ≤ 1.8 s | > 1.8 s |

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
  "percentage": 75,
  "lcp": 1850, "lcpStatus": "good",
  "cls": 0.08, "clsStatus": "good",
  "inp": 220, "inpStatus": "needs-improvement",
  "fcp": 1200, "fcpStatus": "good",
  "ttfb": 450, "ttfbStatus": "good",
  "measuredAt": "2026-06-17T04:30:00.000Z",
  "durationMs": 14500
}
```

## Use cases

- **Performance CI** — schedule a daily run against your production pages, alert if grade drops
- **Competitive analysis** — measure your top 10 competitors weekly
- **Lead enrichment** — find sites failing Web Vitals (they need a perf consultant)
- **SEO audits** — Web Vitals is a Google ranking signal

## Pricing model (when published)

Pay-per-result: **$0.15 per URL measured.** Each measurement takes ~15-20 seconds (real Chromium).

## Why this instead of PageSpeed Insights API?

- **No quota cap** — PSI is rate-limited; this Actor scales horizontally
- **Custom interactions** — extend `main.js` to scroll a specific way, click a CTA, then measure post-interaction vitals
- **Includes TTFB and FCP** — PSI only reports the Core 3
- **Real browser** — no estimated lab metrics; field-style measurement on each run

## Author note

Built by [Peak Post](https://peakpost.ca) — solo developer running 22 Chrome extensions. Ports the always-visible Web Vitals badge from the Web Vitals Lite Chrome extension into a programmatic API.

## Roadmap

- v1.1: throttling presets (slow 3G, fast 3G, no throttle)
- v1.2: device emulation (mobile / desktop / tablet)
- v1.3: filmstrip screenshots at LCP / FCP timestamps
- v2.0: sitemap-aware batch with parallel browser pool
