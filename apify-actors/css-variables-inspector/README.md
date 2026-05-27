# CSS Variables Inspector

Extract every CSS custom property (`--var-name`) declared or referenced on any webpage. Useful for design-system audits, theme migrations, brand-token extraction, and competitive design analysis.

Port of the [CSS Variables Inspector Chrome extension](https://chromewebstore.google.com/) (18 active users, growing organically) to a programmatic API.

## Use cases

- **Design system audit** — pull all design tokens from a competitor's site to compare
- **Theme migration** — extract every var() reference before refactoring to a new design system
- **Brand color extraction** — find the canonical hex/hsl values without screenshotting
- **CSS hygiene** — detect `var(--foo)` references with no matching declaration (dead variables / broken references)

## Input

```json
{ "url": "https://example.com" }
```

Or batch:

```json
{ "urls": ["https://stripe.com", "https://linear.app", "https://vercel.com"] }
```

## Output (per URL)

```json
{
  "url": "https://stripe.com",
  "totalDeclarations": 142,
  "rootCount": 87,
  "otherScopeCount": 12,
  "usedButNotDefinedCount": 3,
  "root": {
    "--brand-primary": "#635bff",
    "--brand-secondary": "#0a2540",
    "--space-1": "4px",
    "--space-2": "8px"
    /* ... 83 more ... */
  },
  "byScope": {
    ".dark-theme": {
      "--brand-primary": "#7a73ff"
    }
  },
  "usedButNotDefined": [
    "--legacy-blue",
    "--old-token"
  ],
  "scannedAt": "2026-05-15T22:00:00.000Z",
  "scannerVersion": "1.0.0"
}
```

## Pricing

- **Free tier:** 50 pages/month
- **Standard:** $0.01 per page
- **Subscription:** $19/month for 5,000 pages

Higher per-call cost than the Security Headers Scanner because this Actor uses Playwright (browser-based scraping) rather than plain fetch.
