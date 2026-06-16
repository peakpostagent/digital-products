# Best Possible CWS Extension + Gumroad Product — June 15 Research

User asked overnight for **the single best Chrome extension idea + the single best Gumroad product idea** to ship in 2026. Three parallel research agents ran rigorous validation. Here's the consolidated verdict.

---

## TL;DR

| Category | Pick | Score | Why it survived |
|---|---|---|---|
| **Chrome extension** | Amazon Review Checker — Fake Review Detector & Trust Score | **8.6/10** | Fakespot shut down July 2025 + ReviewMeta offline early 2026 = 10M+ orphaned users with no crowned successor. Same A-F grading pattern as Security Headers (which is the user's growing winner). |
| **Gumroad product** | ExtKit Pro — Chrome extension SaaS starter kit at $79 | **Sole survivor of 8 categories** | Only Gumroad idea that overcomes the "0 organic discovery + you have no audience" problem. Self-distributes via footer link in user's 22 existing extensions. Leverages credibility no competitor can fake (22 shipped + MCC Pro live billing experience). |

**The third agent's honest caveat:** even with both ideas being legitimately good, the channels themselves still have automation problems (CWS = manual upload, Gumroad = no creation API). The May 15 strategic pivot to Apify Actors stays the right primary bet. **These two ideas should be treated as supplementary upside, not the new core direction.**

---

## Idea #1 — Amazon Review Checker (Chrome Extension)

### The wedge

July 2025: Fakespot (10M+ users, Mozilla acquired then shut down) goes dark.
Early 2026: ReviewMeta also goes offline.
The 10M+ orphan users have NO crowned successor — the leading replacements (RateBud, SureVett, ReviewLens, Savinoo, FakeScan) are all sub-1K installs each.

Search demand is **massive and unmet**. Every "Fakespot alternative" listicle (and there are dozens) is a 5-7 name list with no clear winner — meaning getting on those lists is achievable.

### Scoring (out of 10)

| Step | Score | Evidence |
|---|---|---|
| Search-Demand | 9 | 10M orphan users + 75% of consumers concerned about review authenticity + 43% of Amazon reviews are fake (Capital One Shopping research) |
| CWS Saturation | 8 | 7 incumbents, ALL below 10K installs — vacuum unfilled |
| Monetization | 7 | ConsumerLab at $42/yr, RateBud premium tier prove buyers pay |
| Search-String Fit | 10 | "Amazon Review Checker" is literally the query non-tech buyers type |
| Page-Integration Moat | 9 | DOM-scrape reviewer profiles, verified-purchase ratios, timestamp clustering — ChatGPT in a tab cannot do this |

**Overall 8.6/10** — passes the user's ≥7 threshold cleanly.

### Why this isn't another failed dev-tool extension

Earlier 22-extension portfolio failed because devs don't browse CWS. This extension targets **Amazon shoppers** specifically — and uniquely, this is the one consumer audience that DOES have CWS search muscle memory (Fakespot trained them).

### Build plan (28 hours total)

**Reuses from existing portfolio:**
- `extensions/security-headers/src/lib/headers.js` evaluator pattern → A-F trust scoring
- `extensions/security-headers/src/popup/popup.js` badge + breakdown UI
- ExtensionPay SDK pattern from MCC Pro for free/Pro tier
- `extensions/security-headers/build-zip.ps1` template

**New code:**
- DOM scraper for amazon.com/ca/co.uk/de product + review pages
- Heuristic scoring: verified-purchase ratio, timestamp clustering, repeated phrasing detection, image-vs-text ratio, rating-distribution shape
- Trust badge injection on product cards (overlay, doesn't break Amazon's layout)
- Pro tier ($4.99/mo): reviewer-profile deep dive, cross-Reddit reference

**Permission profile:**
- `storage`, `activeTab`, `scripting`
- `host_permissions`: ONLY `*://*.amazon.com/*`, `*://*.amazon.ca/*`, `*://*.amazon.co.uk/*`, `*://*.amazon.de/*`
- **No `<all_urls>`** — dodges CWS in-depth review

### Launch plan to first 100 users

| Day | Action | Expected lift |
|---|---|---|
| 1 | Ship to CWS with exact title "Amazon Review Checker — Fake Review Detector" | Search ranking |
| 3 | Comment on top 6 "Fakespot alternative" listicles requesting inclusion | Backlinks + organic traffic |
| 5 | Post on r/AmazonReviewsTalk, r/AmazonDeals, r/BuyItForLife — "free Fakespot replacement" | First 50-100 installs |
| Wk 2 | SEO post on peakpost.ca: "Fakespot vs ReviewMeta vs [extension name] in 2026" | Compounding |
| Wk 3 | Submit to AlternativeTo as Fakespot/ReviewMeta alternative | Long-tail organic |
| Wk 4 | Product Hunt launch as "the Fakespot replacement that actually shipped" | Burst install |

### 90-day revenue

- Conservative (RateBud trajectory): 2,500 installs × 40% WAU × 2% paid × $4.99 = **$100/mo by day 90**
- Optimistic (Easy Folders trajectory at 6 months): 25,000 installs × 3% paid × $4.99 = **$3,750/mo**
- **Honest midpoint: $200–$500/mo by day 90**

### What could go wrong

1. **Amazon DOM changes break scraping** — defensive selectors + weekly health-check cron
2. **AI inference cost balloons** — keep grading local-only, LLM only for paid "explain why" feature
3. **Orphan users moved on** — position as "AI shopping advisor" not just "review checker"
4. **Funded competitor wins SEO war** — RateBud or SureVett could raise. **Ship in week 1 or skip.**
5. **Amazon C&D for client-side scraping** — extensions do this universally, low probability but non-zero
6. **Manual CWS upload friction** — 4-6 uploads/year is tolerable since heuristics are stable

---

## Idea #2 — ExtKit Pro (Gumroad / Polar.sh Product)

### What the research agent killed

Before landing here, the agent eliminated these candidates:
- **Cursor rules pack** — official Cursor marketplace + free cursor.directory in 2026
- **n8n template pack** — 9,000+ free community templates dominate
- **Notion templates** — wrong skill match (aesthetic design, not code)
- **ComfyUI workflows** — Civitai distributes free + Buzz tipping, not USD
- **Generic AI prompt packs** — user already failed 7 info-products this way

### Why ExtKit Pro survived

The user has the rarest possible credibility for this product:
- 22 shipped Chrome extensions
- MCC Pro with live ExtensionPay billing
- Security Headers with confirmed organic growth (33→56 users in 2 weeks)
- Working knowledge of every MV3 gotcha that bites first-time developers

No competitor can fake "I've shipped 22 paid extensions, here's the boilerplate." That's the moat.

### The product (concrete deliverables)

1. **MV3 + Vite + vanilla JS template** (matches user's stack rule — no React, no TypeScript)
2. **Vendored ExtensionPay SDK** wired into popup, options, service worker (clone of MCC Pro's `extpay-sdk.js`)
3. **`isPaid()` gating helper** with 6-hour `chrome.storage.local` cache (lifted from MCC Pro)
4. **Vercel serverless backend** (`/api/`) — webhook verification + dedupe-keyed cron pattern from `apis/mcc-insights/`
5. **Stripe-via-ExtensionPay** coupon/trial wiring
6. **Pre-built popup UI** with Free/Pro toggle + paywall modal
7. **Onboarding flow** — welcome page after install
8. **3 working example extensions** — AI sidebar (Ollama-compatible), SEO scanner (port of Security Headers), CSS inspector
9. **Privacy policy template** + CWS submission checklist (already drafted in `docs/cws-submission-template.md`)
10. **Failure-modes README** — the specific gotchas that hit on 22 extensions (CSP issues, host_permission audits, content-script style leakage)

### Pricing

**$79 one-time.**

Reasoning: SmolStack ($49) is too cheap to signal completeness; ShipFast ($199–$299) is the anchor at the high end. $79 undercuts ShipFast by 60% while pricing above SmolStack to signal "more complete kit + creator with proven shipped track record."

### Traffic source — first 100 buyers (concrete, not vague)

**Tier 1 — Footer link in 22 existing extensions:**
"Built with ExtKit — ship your own paid extension"
~104 active users × 1-2% click × 5% conversion ≈ 1-4 sales per month, self-renewing as new installs land.

**Tier 2 — Programmatic SEO on extkit.dev (subdomain of peakpost.ca):**
50-80 landing pages:
- "How to add Stripe to a Chrome extension"
- "Manifest V3 + ExtensionPay tutorial"
- "Chrome extension boilerplate vs WXT"
- "ChatGPT sidebar extension starter"

This is the Marc Lou DataFast playbook ($15.8K MRR proof point from CLAUDE.md).

**Tier 3 — IndieHackers + r/SideProject "I built X" post:**
Format: "I ship paid Chrome extensions for a living — here's the boilerplate I wish existed when I started."
Link Security Headers (33 → 56 organic) as social proof.

**Tier 4 — X build-in-public:**
"Day N of porting my paid Chrome extension stack into a boilerplate."

### Build time: **28 hours**

| Hours | Task |
|---|---|
| 8 | Extract MCC Pro's ExtensionPay layer into reusable lib |
| 6 | Write 3 example extensions |
| 6 | Vercel backend template + webhook tests |
| 4 | Docs + README |
| 4 | Landing page on extkit.dev + Gumroad listing + screencasts |

### First-month revenue projection

- Footer link: 1-4 sales × $79 = $79–$316
- IH/r/SideProject post: 3-8 sales × $79 = $237–$632
- X build-in-public: 2-5 sales × $79 = $158–$395
- Programmatic SEO: ~0 month 1 (12-week lag)

**Total month 1: $790–$1,580.** Compounds monthly via footer link + SEO.

### Why this isn't the 8th failed Gumroad attempt

| User's 7 failures | ExtKit Pro |
|---|---|
| Info-products | Working code that saves 40+ hours |
| Relied on Gumroad Discover | Self-distributes via 22 owned extensions |
| Generic audience | Hyper-specific: devs building paid CWS extensions |
| No credibility moat | 22 shipped + 1 paid = unfakeable |
| Competing with free alternatives | Free alternatives (WXT) don't include payments scaffolding |
| Zero pre-sale signal | IndieHackers thread = signal before commit |

### Platform choice

Use **Gumroad as checkout for first 20 sales** (Merchant-of-Record handles Canadian tax). Then evaluate switching to **Polar.sh** (4% + $0.40 vs Gumroad's 10% = saves ~1% per sale, more dev-credible). Don't lead with Polar (smaller buyer-trust signal yet).

---

## Channel honesty check — should you even ship these?

The third research agent ran an unbiased channel-vs-channel comparison. Here's the scorecard:

| Dimension | CWS Extensions | Gumroad | Apify Actors | Polar.sh |
|---|---|---|---|---|
| Solo 12mo ceiling | $2K-$10K/mo (flagships $50K) | <$100/mo modal | $1K-$12K MRR docs | $500-$5K MRR |
| Time-to-first-$ | 60-180 days | Median = never | 30-90 days | 30-90 days if you have audience |
| **Automation friendliness** | **2/10** (manual upload per version) | **1/10** (no creation API) | **9/10** (REST API for everything) | **8/10** (full REST API) |
| Compounding | Within portfolio yes, across users weak | None | Strong (profile page surfaces N+1) | Weak without audience |
| Cost of failure | 30-80 hrs + slot | 5-20 hrs + sunk cost | 8-20 hrs (port existing) | 5-15 hrs |
| 2026 signal | Security Headers grew 70% in 2 weeks ← non-trivial | Slight algorithm tweak, mixed reports | Rental pricing sunset Oct 2026 ← caution | Polar gaining indie share |

### The agent's honest recommendation

**Stick with the May 15 plan. The Apify Actors already scaffolded are still the highest-EV concrete moves available.**

But — and this is the nuance — both ideas above are genuinely good. The honest framing is:

- **Amazon Review Checker** is the strongest CWS bet the user could possibly make. If they're willing to do 4-6 manual uploads/year (the post-launch maintenance is light because heuristics are stable), it's worth doing AS A SECOND TRACK after Apify ships.
- **ExtKit Pro** is the strongest Gumroad bet — but it's structurally a "package up what you already have" play, not a new build. ~28 hours of mostly extraction work. Could ship between Apify Actor publishes without significant opportunity cost.

### Triggers that would flip the verdict

The agent listed specific data points that would change the recommendation. Watch for:

1. **CWS ships a publish API** — collapses the autonomy objection, makes CWS top channel again
2. **Security Headers crosses 500 users in next 60 days** — proves the user's CWS instincts are world-class, justifies second CWS cycle (Amazon Review Checker becomes obvious)
3. **Apify rental sunset October 2026 hurts solo MRR** — drops Apify as #1, makes Polar.sh + pSEO + CWS the path
4. **First Apify Actor flops at <10 paid runs in 60 days** — Apify discoverability assumption fails, deprioritize that channel
5. **User builds an audience (newsletter >2K subs)** — every channel's calculus changes, especially Gumroad/Polar

---

## Recommended execution order (when user returns to work)

### Week 1 — Apify (already planned)
Publish the 3 scaffolded Actors as soon as `APIFY_API_TOKEN` lands. Existing scaffolds, zero new design required.

### Week 2 — ExtKit Pro extraction
Spend 28 hours extracting the boilerplate from MCC Pro + Security Headers. Ship to Gumroad/extkit.dev. **Sells alongside Apify Actors without channel competition.**

### Week 3-4 — Amazon Review Checker
~28 hours. Reuses Security Headers grading pattern. Ship to CWS with a 6-month maintenance commitment plan. Treat as a "second CWS bet" — if it doesn't compound by Q4, accept the loss and move on.

### What NOT to do
- Don't build new Chrome extensions IF they're dev-tool-focused. The user already proved (22 extensions, average 5 users) that pattern fails.
- Don't make another info-product for Gumroad. ExtKit Pro is real working code, not a PDF or template pack.
- Don't try to spin up an audience before shipping. Audience-building is slow; ship the products that don't need an audience first (Apify + ExtKit), use that revenue to fund audience growth later.

---

## File locations

When the user reads this and decides to execute:

- Master plan (May 15 still canonical for primary direction): `C:\Users\colet\Documents\Digital Product\Wokring Ideas\docs\autonomous-business-plan-2026-05.md`
- Today's supplementary research (this doc): `C:\Users\colet\Documents\Digital Product\Wokring Ideas\docs\best-ideas-research-2026-06-15.md`
- Scaffolds (pre-staged tonight): see `extensions/amazon-review-checker/` and `gumroad/extkit-pro/`
- Build instructions per scaffold: each has its own README

---

## Sources

**Amazon Review Checker:**
- [Fakespot Shutting Down — RateBud blog](https://www.ratebud.ai/blog/fakespot-shutting-down-best-alternatives-2026)
- [ReviewMeta Down — voc.ai](https://www.voc.ai/blog/reviewmeta-alternative)
- [Fake Review Statistics — Capital One Shopping](https://capitaloneshopping.com/research/fake-review-statistics/)
- [Easy Folders $3.7K MRR — Indie Hackers](https://www.indiehackers.com/product/easy-folders/6-months-post-launch-my-chrome-extension-has-hit-3-700-in-mrr-and-42-000-in-total-revenue--O3qs28VAnAkcJw0j--M)

**ExtKit Pro:**
- [Marc Lou $133K/mo with ShipFast](https://thebuilderos.beehiiv.com/p/marc-lou-crosses-133kmo-simple-nextjs-boilerplate)
- [ExtensionPay $500K+ paid out](https://extensionpay.com/)
- [Gumroad Discover dead — IndieHackers](https://www.indiehackers.com/post/gumroad-has-zero-organic-discovery-im-cross-listing-my-data-product-everywhere-e9c4d8b629)
- [Polar.sh vs alternatives pricing](https://devtoolpicks.com/blog/polar-vs-lemon-squeezy-vs-creem-2026)

**Channel honesty check:**
- [Chrome Extension Revenue Benchmarks 2026](https://chromegoldmine.com/blog/chrome-extension-monetization/chrome-extension-revenue-benchmarks/)
- [Apify Actor monetization docs](https://docs.apify.com/platform/actors/publishing/monetize)
- [ParseForge Actor Factory](https://blog.apify.com/parseforge-actor-factory/)
- [Gumroad issue #4019 — no product creation API](https://github.com/antiwork/gumroad/issues/4019)
