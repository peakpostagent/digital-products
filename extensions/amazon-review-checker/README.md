# Amazon Review Checker — Fake Review Detector & Trust Score

**Status: v0.1.0 scaffold (committed 2026-06-15). Not yet shipped.**

The Fakespot replacement that actually ships. Letter-graded (A+ to F) trust score on every Amazon product page, with a breakdown of which signals are weak.

## Why this exists

July 2025: Fakespot (Mozilla, 10M+ users) shut down.
Early 2026: ReviewMeta went offline.

10M+ orphan shoppers, no crowned successor. The leading replacements (RateBud, SureVett, ReviewLens, Savinoo) are all sub-1K installs each. The market is wide open.

Full validation report: `docs/best-ideas-research-2026-06-15.md`.

## Architecture

Identical pattern to `extensions/security-headers/`:

```
src/
  manifest.json                    # MV3, scoped host_permissions (no <all_urls>)
  content/content.js               # DOM-scrape reviews on product pages, inject badge
  background/service-worker.js     # Cache scores in chrome.storage.local
  popup/popup.{html,css,js}        # Score breakdown + Pro tier upsell
  lib/
    grader.js                      # PORT of security-headers grader.js — A-F scoring
    scraper.js                     # Amazon-specific DOM selectors
    badge.js                       # Trust grade overlay on product cards
  icons/                           # Generated via tools/extension-artwork/
store-listing/                     # CWS submission assets
tests/                             # Vitest unit tests for grader heuristics
```

## What's already ported

- `src/lib/grader.js` — A-F evaluator pattern from Security Headers, adapted to review-trust heuristics
- `src/manifest.json` — MV3 manifest with scoped host_permissions (only amazon.com/ca/co.uk/de)

## What still needs to be built (~28 hours total)

| Hours | Task |
|---|---|
| 6 | Amazon DOM scraper (`src/lib/scraper.js`) — robust selectors for product page + review pages |
| 4 | Content script that scrapes + computes grade + injects badge |
| 4 | Popup UI showing grade + heuristic breakdown |
| 3 | Service worker for caching + Pro tier `isPaid()` check |
| 4 | ExtensionPay integration for $4.99/mo Pro tier |
| 3 | Pro-tier reviewer-profile deep dive (sample 20 random reviews, check profile age + history) |
| 2 | Unit tests for `grader.js` |
| 2 | Icons + screenshots via `tools/extension-artwork/` |

## Free vs Pro feature split

**Free tier:**
- Letter grade A-F on every product page
- 6 heuristic scores (all except reviewer-profile diversity)
- 5 deep-scan requests per day

**Pro tier ($4.99/mo or $39/yr):**
- Reviewer-profile diversity heuristic (samples 20 reviewers' profile pages, checks if they're real)
- Unlimited deep scans
- Cross-reference with Reddit mentions for the product
- Export trust report as PDF
- AI "explain why this is a F" feature (uses OpenAI gpt-4o-mini, ~$0.0001/call)

## Launch plan (to first 100 users)

| Day | Action |
|---|---|
| 1 | CWS submission with title "Amazon Review Checker — Fake Review Detector" |
| 3 | Comment on top 6 "Fakespot alternative" listicles requesting inclusion |
| 5 | Post on r/AmazonReviewsTalk, r/AmazonDeals, r/BuyItForLife |
| Wk 2 | SEO post on peakpost.ca |
| Wk 3 | Submit to AlternativeTo as Fakespot/ReviewMeta alternative |
| Wk 4 | Product Hunt launch |

## Revenue expectations

- Conservative (RateBud trajectory): $100/mo by day 90
- Optimistic (Easy Folders trajectory at 6 months): $3,750/mo
- **Midpoint: $200-$500/mo by day 90**

## Risks

1. Amazon DOM changes (mitigate: defensive selectors + weekly health-check cron)
2. AI inference cost balloon (mitigate: local-only heuristics for grade, LLM only in paid "explain" feature)
3. Orphan users moved on (mitigate: position as "AI shopping advisor" not just "review checker")
4. Funded competitor wins SEO war (mitigate: **ship in week 1 or skip**)
5. Amazon C&D for scraping (mitigate: only read what user already sees, never proxy through backend)

## When to actually build this

Per the channel honesty agent's verdict: ship the **3 Apify Actors first** (already scaffolded at `apify-actors/`). They're higher-EV given the autonomy constraint. THEN come back to this — it's a secondary track, not the primary direction.

The May 15 strategic pivot to Apify stays canonical. This extension is a calculated supplementary bet, not a strategy reversal.
