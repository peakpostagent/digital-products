# Schema.org / JSON-LD Validator

Extracts all structured data from a URL — JSON-LD blocks + microdata — validates against schema.org, and reports Google Rich Results eligibility per entity. A-F grade overall.

## What it does

- Pulls every `<script type="application/ld+json">` block, parses it, walks `@graph` arrays
- Detects microdata via `itemtype` attributes
- Validates required properties against 17 Rich Result types: Article, Recipe, Product, Event, FAQPage, HowTo, JobPosting, Review, VideoObject, and more
- Catches the common breakage patterns: missing `@context`, missing required props, JSON parse errors

## Input

```json
{ "url": "https://example.com/recipe-page" }
```

## Output

```json
{
  "url": "...",
  "grade": "A",
  "summary": {
    "totalEntities": 3,
    "typesFound": ["Recipe", "BreadcrumbList", "Organization"],
    "richResultEligibleCount": 2,
    "failureCount": 1
  },
  "entities": [
    {
      "type": "Recipe",
      "source": "json-ld",
      "richResultEligible": true,
      "errors": [],
      "warnings": [],
      "propertyCount": 14
    },
    {
      "type": "Article",
      "source": "json-ld",
      "richResultEligible": false,
      "errors": ["Missing required property: author"],
      "warnings": [],
      "propertyCount": 5
    }
  ]
}
```

## Use cases

- **SEO QA on content changes** — CMS updates often strip structured data; catch it before Google does
- **Pre-publish recipe / product sites** — validate every page before launch
- **Lead enrichment** — find ecom sites missing Product structured data → propose an SEO consult
- **Continuous monitoring** — schedule daily runs against your top 100 pages

## Pricing

Pay-per-result: **$0.005/URL audited.** Cheap, fetch-only.

## Author

Built by [Peak Post](https://peakpost.ca). Part of the SEO Audit Suite alongside Meta Tag Inspector, Robots & Sitemap Inspector, Web Vitals Reporter, and Security Headers Scanner.
