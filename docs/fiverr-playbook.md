# Fiverr Operations Playbook

How to win and deliver the first orders. All buyer-facing messages are drafted by Claude and **sent by you** — never auto-send client comms.

## Where the first orders come from

New sellers rank low in search, so early orders come from two places:
1. **Fiverr Briefs** — buyers post requests, Fiverr matches them to seller profiles. Check the Briefs tab daily; respond within an hour when possible (speed wins these).
2. **Buyer messages** — someone finds a gig and asks a question before ordering. Answer fast, be specific, offer a Custom Offer.

## Response templates

### Brief response — Website Audit
```
Hi [name] — I can deliver exactly this. I run a 13-point audit (security,
SEO, speed, accessibility) against your live site and send back a graded
PDF report with a prioritized fix list — what to fix first and why.

For [their site type], the areas I'd expect to matter most are [pick 2:
security headers / structured data / Core Web Vitals / accessibility].

Turnaround: 2 days for the Essential package ($95), 3 days for the Deep
audit with per-page breakdown and copy-paste fixes ($175). Happy to start
today — want me to send a Custom Offer?
```

### Brief response — Automation
```
Hi [name] — this is squarely what I build. Quick question so I quote it
right: which apps/tools are involved, and roughly how often does this
process run today?

I build on n8n, Make, or fully custom depending on what's cheapest and
most reliable for your case — with error handling and a written runbook so
your team can maintain it. Most single workflows land in the $150-400
range. I can usually start within a day.
```

### Brief response — Web Scraping
```
Hi [name] — I can pull this. Two quick things: (1) the exact site URL(s),
and (2) which fields/columns you need. I'll confirm feasibility for free
before you commit a dollar.

Delivered clean in CSV, JSON, or straight to a Google Sheet. One-time
pulls start at $60; if you'll need it refreshed on a schedule, I can deploy
a self-running version that delivers fresh data automatically. Want a
Custom Offer?
```

### Order intake (buyer just ordered — send immediately)
```
Thanks for the order, [name]! Kicking this off now. To make sure I nail
it, quick confirm:
- [URL / process / fields — whatever the intake left open]
Anything specific you want me to focus on? Otherwise I'll run the full
scope and have your [report / workflow / data] to you by [date]. 👍
```

### Delivery message — Website Audit
```
Your audit is ready — attached as a PDF.

Headline: [site] scored [grade] overall. The biggest wins are on page 2
("Priority Fixes") — I'd start with #1-3, they're quick and high-impact.

Every issue includes what to change and why it matters. If you'd like me
to implement the fixes rather than hand them off, just say the word — audit
clients get priority scheduling.

If everything looks good, a 5-star review genuinely helps a new seller like
me more than you know. Thank you! 🙏
```

## Delivery workflow — Website Audit (the automated one)

1. `cd tools/audit-report-generator`
2. `node generate.js <buyer-url> --client "<Their Business>"`
3. Open the HTML report, skim against the live site (~5 min), fix any false positive
4. Print → Save as PDF
5. Standard tier: run the top ~25 pages, mention notable per-page issues in the message
6. Premium tier: batch-run competitor sites too; run the 3 browser-only Apify Actors (contrast, web vitals, PWA) and fold results in
7. Deliver PDF + the delivery message above

## First-orders strategy (ranking currency = reviews)

- **Overdeliver on the first 3-5 orders.** Deliver early, add one surprise extra (an extra page audited, a bonus quick-win they didn't ask for). Reviews are everything for a new seller.
- **Never miss the delivery clock** — late delivery tanks ranking harder than anything.
- **Ask for the review** in the delivery message (politely, once).
- After 5 five-star reviews: raise prices ($95→$150 audit, $150→$200 workflow) — social proof lets you charge more, and low prices can signal low quality.

## Guardrails (our rules + Fiverr ToS)

- Claude drafts messages; **you send them.** No auto-messaging buyers.
- Scraping gig: public data only. Refuse login-walled, paywalled, or personal-data-harvesting requests — protects the account.
- Deliver what was promised; if a job is out of scope, send a Custom Offer rather than silently over/under-delivering.
- Keep client URLs/data out of anything public (no committing client reports to the repo — `reports/` should be gitignored).
```
