# Meta Tag Inspector

Extract SEO meta tags from any webpage. Returns title, description, Open Graph, Twitter Cards, canonical URL, robots, viewport, charset, favicon — plus a 0-100 SEO completeness score and length warnings for title/description.

Lightweight plain-fetch implementation (no browser required) — fastest in the Peak Post Apify portfolio at $0.003/page.

## Use cases

- **SEO audit at scale** — score 1000 URLs in one run
- **Migration verification** — confirm canonical URLs survived a domain change
- **Social preview check** — extract Open Graph + Twitter Card config for every page in a sitemap
- **Compliance** — verify required meta tags are present (charset, viewport, canonical)
- **Competitor analysis** — what description/og:image strategy do they use?

## Input

```json
{ "url": "https://example.com" }
```

Or batch (up to 1000 URLs):

```json
{ "urls": ["https://stripe.com/pricing", "https://stripe.com/checkout"] }
```

## Output (per URL)

```json
{
  "url": "https://stripe.com/pricing",
  "httpStatus": 200,
  "seoScore": 90,
  "title": "Pricing — Stripe",
  "titleLength": 16,
  "titleWarning": "",
  "description": "Stripe's pricing is simple and transparent...",
  "descriptionLength": 145,
  "descriptionWarning": "",
  "canonical": "https://stripe.com/pricing",
  "canonicalDiffers": false,
  "robots": "max-image-preview:large",
  "viewport": "width=device-width, initial-scale=1",
  "charset": "UTF-8",
  "favicon": "https://stripe.com/img/v3/favicon.ico",
  "openGraph": {
    "title": "Pricing — Stripe",
    "description": "Stripe's pricing is simple and transparent...",
    "image": "https://stripe.com/img/v3/home/twitter.png",
    "url": "https://stripe.com/pricing",
    "type": "website",
    "siteName": "Stripe"
  },
  "twitterCards": {
    "card": "summary_large_image",
    "title": "Pricing — Stripe",
    "description": "...",
    "image": "https://stripe.com/img/v3/home/twitter.png"
  },
  "presentFields": {
    "title": true,
    "description": true,
    "canonical": true,
    "ogTitle": true,
    "ogDescription": true,
    "ogImage": true,
    "twitterCard": true,
    "viewport": true,
    "charset": true,
    "favicon": true
  },
  "scannedAt": "2026-05-15T22:00:00.000Z",
  "scannerVersion": "1.0.0"
}
```

## SEO completeness score

The score is a 0-100 percentage of these 10 fields being present:
title, description, canonical, og:title, og:description, og:image, twitter:card, viewport, charset, favicon.

Length warnings fire when:
- **title** > 60 chars (SERP truncation risk)
- **description** > 160 chars (SERP truncation risk)
- **canonical** points to a different URL than the page itself (intentional or duplicate-content red flag)

## Pricing

- **Free tier:** 200 pages/month
- **Standard:** $0.003 per page
- **Subscription:** $19/month for 50,000 pages
