# Color Contrast Auditor (WCAG 2.2)

Audit any webpage for color contrast accessibility issues — letter-graded report (A+ to F), pass rates for AA and AAA, and the 25 worst offenders with full selector + color hex details.

## What it does

Loads a URL in a real browser, walks every visible text element, computes the WCAG contrast ratio between the resolved foreground and background colors, and grades pass/fail against:

- **WCAG 2.2 AA** — 4.5:1 normal text, 3:1 large text
- **WCAG 2.2 AAA** — 7:1 normal text, 4.5:1 large text

"Large text" is 18pt+ (24px) regular OR 14pt+ (18.66px) bold per the spec.

## Input

```json
{ "url": "https://example.com" }
```

Or batch:

```json
{ "urls": ["https://a.com", "https://b.com"] }
```

Max 1000 URLs per run.

## Output

Each URL produces one dataset item:

```json
{
  "url": "https://example.com",
  "grade": "B",
  "passRateAA": 92.3,
  "passRateAAA": 78.1,
  "elementsChecked": 247,
  "failAA": 19,
  "failAAA": 54,
  "worstOffenders": [
    {
      "selector": ".btn-cta",
      "textPreview": "Sign up free",
      "fgHex": "#FFFFFF",
      "bgHex": "#A0A0A0",
      "fontSizePx": 14,
      "fontWeight": 600,
      "isLargeText": false,
      "contrastRatio": 2.85,
      "aaThreshold": 4.5,
      "aaaThreshold": 7.0,
      "passAA": false,
      "passAAA": false
    }
  ],
  "allElements": [ /* full list, capped at 500 per page */ ]
}
```

## Use cases

- **a11y monitoring pipelines** — wire into CI to catch contrast regressions
- **Pre-launch design reviews** — feed staging URLs, get a grade
- **WCAG audit automation** — drop a sitemap, get a portfolio-wide report
- **Lead enrichment for a11y agencies** — find prospects with failing pages

## Pricing model (when published)

Pay-per-result: **$0.10 per URL audited.** Most pages return in 10-15 seconds.

## Author note

Built by [Peak Post](https://peakpost.ca) — solo developer running 22 Chrome extensions with ~104 active users. This Actor ports the contrast-checking logic from the [Color Contrast Checker Chrome extension](https://chromewebstore.google.com/) into a programmatic API.

## Roadmap

- v1.1: pass non-text elements (icon contrast 3:1 minimum, WCAG 1.4.11)
- v1.2: detect and skip decorative/aria-hidden text
- v1.3: focus state contrast (hover/focus pseudo-elements)
- v2.0: site-wide crawl mode with sitemap.xml ingestion
