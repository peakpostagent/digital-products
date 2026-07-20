# Audit Report Generator — Fiverr Gig 1 Delivery Engine

Turns any URL into a branded, client-ready website audit report in ~5 seconds. This is how you deliver the **$95–$295 Website Audit gig** without hours of manual work.

## Usage

```bash
cd tools/audit-report-generator
node generate.js https://clientsite.com --client "Client Business Name"
```

Output: `reports/audit-clientsite.com-YYYY-MM-DD.html`

Then: open the HTML in a browser → **Print → Save as PDF** → that's the deliverable you send the buyer.

Batch several sites (e.g. Premium tier with competitor comparison):
```bash
node generate.js https://client.com https://competitor1.com https://competitor2.com
```

## What it audits (7 categories, all fetch-based, zero cost)

| Category | Checks |
|---|---|
| Security Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| SEO & Meta Tags | title, meta description, canonical, Open Graph, mobile viewport |
| Crawlability | robots.txt (catches Disallow: / disasters), sitemap.xml presence + URL count |
| Structured Data | JSON-LD detection + parse validation, Rich Results eligibility |
| Image Accessibility | missing alt, filename-as-alt (WCAG 1.1.1) |
| Privacy & Compliance | 6 major trackers + consent-banner detection (GDPR/PIPEDA flag) |
| HTTP & Performance | HTTPS, Brotli/gzip compression, HTTP/3, Cache-Control |

Overall A+–F grade = average of the seven category scores.

## Delivery workflow (per order)

1. Run the generator on the buyer's URL with `--client "Their Name"`
2. Open the HTML, skim it (~5 min) — sanity-check the findings against the live site
3. Print to PDF
4. **Basic tier:** send the PDF as-is
5. **Standard tier:** run on up to 25 key pages, note per-page issues in the message
6. **Premium tier:** add competitor sites (batch mode), plus offer the browser-only deep checks (WCAG contrast, Web Vitals, PWA) via the Apify Actors — `apify.com/pattonholdings`

## What it deliberately does NOT do

Three checks need a real browser (Playwright) and aren't in this fetch-based tool:
- Per-element WCAG **color contrast** → `color-contrast-auditor` Actor
- **Core Web Vitals** (LCP/CLS/INP) → `web-vitals-reporter` Actor
- **PWA installability** → `pwa-audit` Actor

The report footer already upsells these as Premium/add-on — run them via the Apify Actors when a buyer wants the deep version.

## Notes

- Node 18+ (uses native fetch). No dependencies, no install step.
- Fetch-only means it reads exactly what Google and attackers see — no admin access to the client site required.
- Reports are self-contained HTML (inline CSS) — they open and print anywhere.
