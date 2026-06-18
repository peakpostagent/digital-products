# Image Alt-Text Auditor

Audit every `<img>` on a page against WCAG 1.1.1. Letter grade (A+ to F), per-image flags, and overall pass rate.

## What it catches

| Flag | What it means |
|---|---|
| `missing-alt` | The `alt` attribute is entirely absent — a WCAG hard failure |
| `empty-alt-suspect` | `alt=""` without `role="presentation"` or `aria-hidden="true"` (often unintentional) |
| `decorative-should-be-empty` | Image marked decorative but still has alt text |
| `alt-too-long` | Alt over 150 chars (Lighthouse warning threshold) |
| `filename-as-alt` | `alt="IMG_1234.jpg"` — useless placeholder |

## Input

```json
{ "url": "https://example.com" }
```

## Output

```json
{
  "url": "...",
  "grade": "C",
  "passRate": 62.5,
  "totalImages": 24,
  "goodImages": 15,
  "issues": {
    "missingAlt": 3,
    "emptyAltSuspect": 4,
    "decorativeShouldBeEmpty": 0,
    "altTooLong": 1,
    "filenameAsAlt": 1
  },
  "images": [
    {
      "src": "https://example.com/hero.jpg",
      "alt": "Mountain landscape at sunrise",
      "altLength": 31,
      "flags": [],
      "severity": "good"
    }
  ]
}
```

## Use cases

- **A11y compliance audits** — required for EU/UK/Canadian government contracts
- **Pre-launch QA** — catch missing alts before they hit prod
- **Lead enrichment for a11y consultants** — find prospects with failing pages
- **WCAG monitoring** — schedule daily runs across your portfolio

## Pricing

Pay-per-result: **$0.005/URL.** Fetch-only, cheap.

## Note

Fetches the raw HTML. For SPAs that render images via JavaScript, pair this with a Playwright-based audit (Color Contrast Auditor or Web Vitals Reporter from the same author).

## Author

Built by [Peak Post](https://peakpost.ca). Part of the Accessibility Audit Suite alongside Color Contrast Auditor.
