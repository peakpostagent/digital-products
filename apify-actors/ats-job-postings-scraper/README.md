# ATS Job Postings Scraper — Greenhouse, Lever, Ashby, Workable

Scrape live job postings from any company's career board hosted on the four major ATS platforms. Give it company slugs or careers-page URLs; get back one normalized JSON row per job.

## Why this Actor

Company careers pages on Greenhouse, Lever, Ashby, and Workable are backed by public JSON APIs — the same ones their own job boards call. This Actor speaks all four, auto-detects the platform, and normalizes the output into a single schema. No browser, no proxies, no flakiness.

## Use cases

- **Sales prospecting / lead-gen** — companies hiring for a role are budget-active buyers of tools in that category. Track hiring signals across your target-account list.
- **Recruiting intelligence** — monitor competitor hiring by department, location, seniority.
- **Job boards & aggregators** — ingest normalized postings from thousands of boards.
- **Market research** — salary transparency data (Ashby compensation tiers included when published), remote-work trends, tech-stack signals from job descriptions.
- **Job seekers** — track dream-company boards daily with a scheduled run + filter.

## Input

```json
{
  "companies": [
    "https://boards.greenhouse.io/stripe",
    "https://jobs.lever.co/spotify",
    "https://jobs.ashbyhq.com/openai",
    "https://apply.workable.com/blueground",
    "netflix"
  ],
  "titleFilter": "engineer",
  "locationFilter": "remote",
  "remoteOnly": false,
  "includeDescription": true
}
```

- **companies** — URLs or bare slugs (bare slugs are tried against all four platforms). Max 500 per run.
- **titleFilter / locationFilter** — case-insensitive substring filters.
- **remoteOnly** — only jobs flagged remote.
- **includeDescription** — set false for lighter datasets.

## Output (one row per job)

```json
{
  "company": "stripe",
  "platform": "greenhouse",
  "title": "Backend Engineer, Payments",
  "department": "Engineering",
  "location": "Toronto, Canada",
  "isRemote": false,
  "employmentType": "Full-time",
  "compensation": "$150K – $210K",
  "url": "https://boards.greenhouse.io/stripe/jobs/123456",
  "publishedAt": "2026-06-28T14:02:11Z",
  "description": "Stripe is looking for...",
  "scrapedAt": "2026-07-05T09:00:00.000Z"
}
```

Boards that can't be found return a single `type: "error"` row naming the input, so batch runs never fail silently.

## Scheduling

Pair with Apify Schedules for daily monitoring. Combine `companies` list + `titleFilter` and export to Google Sheets / webhook for a zero-maintenance hiring-signals pipeline.

## Pricing

Pay-per-result: **$0.001 per job posting** ($1 per 1,000 jobs). A 50-company batch typically returns 1,000-5,000 postings in under 2 minutes.

## Fair use

This Actor reads only officially public job-board APIs intended for embedding. It sends no credentials, bypasses no auth, and respects each platform's public data surface.

## Author

Built by [Peak Post](https://peakpost.ca) — also maintainer of the 13-Actor Website Audit Suite (security headers, Core Web Vitals, WCAG, structured data, and more).
