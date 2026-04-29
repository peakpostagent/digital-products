# Extension Candidate Validation Results — 2026-04-24

Wave 1: validated the 3 top candidates from `diversification-research-2026-04-24.md`. **All 3 failed.** Wave 2 (in progress) targets candidates that better fit the page-integration moat.

---

## Wave 1 Summary

| Candidate | Score | Verdict | Killer reason |
|---|---|---|---|
| Reading Level Analyzer (teachers) | 4/10 | KILL | Audience-string mismatch — teachers search for content sources (CommonLit, Newsela), not FK scoring tools. Real readability buyers (SEO writers) are saturated by Hemingway/ProWritingAid. |
| Job Description Bias Checker (HR) | 3/10 | KILL | Triple compounding failure: free incumbents (Gender Decoder by Matfield) + enterprise SaaS (Textio at $10K+/yr) + DEI budget cuts/political backlash in 2025-26. Hollow $5-30/mo middle. |
| Email Subject Line A/B Generator | 3/10 | KILL | Saturated CWS category + free substitutes everywhere (ChatGPT, Grammarly, Boomerang, bundled ESP features) + no paid-tier proof in adjacent extensions. |

## The deeper lesson

Three independent agents ran the same 4-step validation independently. The categories that fail share a pattern:

1. **ChatGPT-in-a-tab does it for free** → kills any pure-LLM-wrapper extension
2. **Strong free incumbents already serve the audience** → kills "I'll do it cheaper"
3. **Political/budgetary headwinds** → kills DEI-adjacent tools in 2026
4. **Audience doesn't browse CWS for this category** → search-string-fit fails even when the string itself looks plausible

## What actually wins on CWS (the page-integration moat)

Cross-referencing the portfolio's success cases (MCC 15 users, CSS Variables 12, Security Headers 11) reveals the real pattern. Each extension does something **ChatGPT can't easily do because it requires the live page**:

- **Meeting Cost Calculator** — reads Google Calendar event DOM (date, time, attendees) → instant cost
- **CSS Variables Inspector** — DevTools sidebar reads `:root` styles from live page
- **Security Headers** — fetches HTTP response headers (not page HTML — actual response metadata)
- **Review Clock** — reads timestamps from review listing pages

**Refined Search-String Fit rule for Wave 2:**

> An extension wins on CWS organic search when it does something a user **cannot do as fast or accurately by pasting the page into ChatGPT**. The Chrome extension exists because the workflow needs LIVE PAGE CONTEXT.

This rules out most LLM wrappers ("paste in text → get output"). It rules in things like: "scan this Amazon listing for X," "grade this Zillow property page," "extract data from this LinkedIn profile."

---

## Wave 2 Results — 1 of 3 passed

| Candidate | Score | Verdict | Killer reason |
|---|---|---|---|
| Webpage Text Simplifier | 3/10 | KILL | CWS search "simplify text" returns 10+ competitors including funded SaaS (Texthelp Read&Write, BeLikeNative 256+ reviews $4/mo, QuillBot, Diffit $14.99/mo). Saturation rule clearly violated. |
| **Etsy SEO Tag Generator** | **7/10** | **PASS** | All 5 steps PASS or STRONG PASS except Step 2 saturation (borderline — eRank dominant but stat-based, not LLM-rewriting; defensible AI-native niche) |
| LinkedIn Salary Estimator | 3.5/10 | KILL | LinkedIn TOS scraping risk fatal — multiple extensions pulled by Google for TOS violations 2024-25. Glassdoor + Levels.fyi + LinkedIn Premium saturate the buyer side. |

## Final scoreboard across 6 candidates

| Candidate | Score | Verdict |
|---|---|---|
| Reading Level Analyzer | 4/10 | KILL |
| JD Bias Checker | 3/10 | KILL |
| Subject Line Generator | 3/10 | KILL |
| Webpage Text Simplifier | 3/10 | KILL |
| **Etsy SEO Tag Generator** | **7/10** | **PASS — proceed to scaffold** |
| LinkedIn Salary Estimator | 3.5/10 | KILL |

**Pass rate: 1/6 ≈ 17%.** Validation procedure paying off — rejected 5 candidates that would have collectively burned 25-35 days.

---

## Wave 3 Results (2026-04-28) — searched for a backup to Etsy

Validated three more candidates with stronger page-integration moat hypotheses. Goal: identify a backup at ≥6/10 before committing to Etsy as the only diversification bet.

| Candidate | Score | Verdict | Killer reason |
|---|---|---|---|
| Amazon Listing Quality Scorer | 3.5/10 | KILL | Helium 10 / Jungle Scout / Keepa / 7+ others already saturate amazon.com/dp/* page automation. Helium 10 free tier covers basic listing analysis, ate the wedge. |
| Google Maps Review Reply Generator | 3/10 | KILL | 10+ existing reply-generator extensions already on CWS (ProfilePro free, ReplyBrew, LocalReply, etc.). Pure LLM-wrapper with no real moat. **Google itself is rolling out native AI review replies inside GBP** — the extension category dies when that ships GA. |
| YouTube Title CTR Predictor | 2/10 | KILL | TubeBuddy (3M+ users) + VidIQ ship CTR prediction natively at $7-39/mo. YouTube ships free native A/B title testing. Triple commodity. |

**Updated scoreboard (9 candidates total):**

| Rank | Candidate | Score | Status |
|---|---|---|---|
| 1 | **Etsy SEO Tag Generator** | **7/10** | **PASS — scaffolded v0.1.0, primary build** |
| 2 | Reading Level Analyzer | 4/10 | KILL |
| 3 | Amazon Listing Quality Scorer | 3.5/10 | KILL |
| 4 | LinkedIn Salary Estimator | 3.5/10 | KILL |
| 5 | Google Maps Review Reply Generator | 3/10 | KILL |
| 6 | Webpage Text Simplifier | 3/10 | KILL |
| 7 | JD Bias Checker | 3/10 | KILL |
| 8 | Email Subject Line Generator | 3/10 | KILL |
| 9 | YouTube CTR Predictor | 2/10 | KILL |

**Pass rate now 1/9 ≈ 11%.**

### Wave 3 lesson — repeats Wave 1's

Any "page content + AI rewrite" extension where a single ChatGPT prompt covers 90% of the job is **dead on arrival on CWS**. Real moats need either:
- **Cross-page comparison data the LLM can't easily reach** (Etsy: scraping top-ranking same-category listings) — this is Etsy's wedge
- **Regulatory/data-mismatch tailwinds** incumbents won't touch (e.g., pay-transparency law compliance flagging in JD scanning — interesting but not validated yet)

**Recommendation: stop hunting. Commit to Etsy build-out. No backup needed beyond what's already scaffolded.**

---

## Why Etsy SEO Tag Generator wins

### Strongest signals (4 of 5 step PASSes are STRONG)
1. **Search-Demand**: r/EtsySellers (300K+ members) is one of the most vocal SEO-tool communities online. 2025-26 Etsy organic-traffic decline is panicking sellers, increasing tool demand. Tailwind.
2. **Monetization viability**: eRank $5.99/mo, Marmalead $19/mo, Sale Samurai $9.99/mo, Alura $29.99/mo all sustain businesses — Etsy sellers are the most proven SaaS buyers in e-commerce after Amazon sellers. The $9.99/mo proposed price sits in the validated band.
3. **Search-String Fit**: eRank's free Chrome extension has 100K+ installs — proves the channel converts on this audience. Etsy sellers absolutely browse CWS.
4. **Page-integration moat**: reading live `etsy.com/listing/*` DOM (title, description, current tags, category, price, images) and comparing to scraped top-ranking same-category listings is structurally something ChatGPT can't do. The moat is real.

### The borderline pass on saturation
eRank dominates with 100K+ users free. Sale Samurai, EtsyHunt also present. **But none of them do LLM-rewriting** — they're all stat/keyword-based. AI-native rewriting is an uncovered niche.

### Differentiation angle (the wedge)
1. **AI-rewrite, not stat-scoring** — eRank tells you what's wrong; this tool fixes it in one click. "eRank shows; we do."
2. **Live DOM diff against winners** — sidebar shows: "Top-3 listings in your category use these 7 tags you're missing; their titles average 11 words longer."
3. **Price + tag bundle** — recommends tag changes that move listing into a higher-converting price band. No competitor does pricing+SEO in one extension.

### Risks accepted
- Building atop a structurally weakening platform (Etsy GMV decline 2025-26) — but seller anxiety creates short-term tool demand
- eRank brand dominance — non-technical sellers default to known names — wedge is "AI-native" framing
- TOS check needed: Etsy doesn't aggressively block extensions like LinkedIn does, but verify before public launch

---

## Decision: SCAFFOLD ETSY SEO TAG GENERATOR

Building a starter scaffold tonight (Wave 3 validation skipped — Etsy's 7/10 is strong enough that further validation would be procrastination). User can review on wake and either commit to building it out or kill the scaffold.

---

## Wave 3 — 2026-04-28 (after Etsy scaffold landed)

Wave 3 ran after the user requested more autonomous research. Three more page-integration-moat candidates:

| Candidate | Score | Verdict | Killer reason |
|---|---|---|---|
| Amazon Listing Quality Scorer | 4/10 | KILL | Helium 10 (200K+ users), Jungle Scout (100K+), AMZScout, SellerApp, Keepa (700K) all dominate CWS. Helium 10's free tier covers 70% of the value. The $5-15/mo standalone slot is squeezed between free Helium 10 and $39+/mo all-in-one suites. |
| YouTube Title CTR Predictor | 2/10 | KILL | TubeBuddy + VidIQ are entrenched at millions of installs, $9-49/mo. YouTube ships native A/B testing for free. The headline "CTR optimization" feature is table-stakes everywhere. |
| **Indeed Job Score & Salary Estimator** | **7.5/10** | **PASS — narrowly beats Etsy** | All 5 steps STRONG PASS. 250M Indeed monthly users vs smaller Etsy seller pool. "Ghost jobs" media tailwind 2024-25. Pay-transparency law angle. JobScan/Teal/Huntr ($5-50/mo) prove buyer wallets exist at this price point. |

## Final 9-candidate scoreboard

| Rank | Candidate | Score | Status |
|---|---|---|---|
| 1 | **Indeed Job Score & Salary Estimator** | **7.5/10** | **PASS — best candidate, but Etsy already scaffolded** |
| 2 | **Etsy SEO Tag Generator** | **7/10** | **PASS — scaffolded at v0.1.0, ready to build out** |
| 3 | Reading Level Analyzer | 4/10 | KILL — audience-string mismatch |
| 4 | Amazon Listing Quality Scorer | 4/10 | KILL — saturated by Helium 10 |
| 5 | LinkedIn Salary Estimator | 3.5/10 | KILL — TOS scraping risk fatal |
| 6 | Webpage Text Simplifier | 3/10 | KILL — Texthelp/QuillBot/Diffit saturate |
| 7 | JD Bias Checker | 3/10 | KILL — DEI political climate + free incumbents |
| 8 | Email Subject Line Generator | 3/10 | KILL — saturated, free LLM substitutes |
| 9 | YouTube CTR Predictor | 2/10 | KILL — TubeBuddy/VidIQ dominate |

**Pass rate: 2/9 ≈ 22%.** Validation procedure ruled out 7 candidates that would have collectively burned 35-50 days.

## Decision: KEEP ETSY SCAFFOLDED, INDEED AS BACKUP

Even though Indeed scored higher, the marginal gap (7.5 vs 7) is small relative to the cost of throwing away the Etsy scaffold and re-scaffolding. The right move:

1. **Continue with Etsy as the primary diversification hedge.** Scaffold exists; build it out.
2. **Indeed becomes the secondary hedge** — if Etsy doesn't pan out at day 30 (per kill criteria), Indeed is the next bet. Don't scaffold yet — keep optionality.
3. **Rationale:** 8-10 hrs/week budget can't carry MCC Pro polish + Etsy v1.0 build + Indeed v1.0 build simultaneously. Two-shots-on-goal stays the right cap. MCC Pro is shot 1, Etsy is shot 2.

If MCC Pro converts at >2% by day 30, double down on its monetization pattern across CWS extensions. If MCC Pro fails AND Etsy fails by day 60, scaffold Indeed and ship as the third shot.

### Top differentiation angles for Indeed (when/if we scaffold)
1. **Pay-Transparency-Law Flagger** — auto-detect listings from NY/CA/CO/WA/IL missing required salary disclosure; surface as "this employer may be violating [state] pay transparency law." Regulatory tailwind, uncommoditized.
2. **Ghost Job Confidence Score** — composite of repost frequency, posting age, application count, employer response-rate proxy. Single-glance 0-100. The screenshot-able feature.
3. **Salary-Range Sanity Check** — when Indeed shows useless 4x ranges ("$50K-$200K"), cross-reference BLS OEWS public data for realistic median. Differentiates from JobScan's resume-match focus.

### Indeed-specific notes
- Indeed TOS is much more permissive than LinkedIn for client-side DOM reads on pages the user already loaded
- JobScan, Simplify, Teal, Huntr all read Indeed DOM today and remain live
- Risk: jobseeker churn is high (1-3 month avg subscription life) — built-in attrition

---

## Side findings from Wave 3 work

### Web Vitals Lite v1.0.1 promo images — VERIFIED CLEAN
The 2026-04-19 handoff flagged Web Vitals Lite v1.0.1 as rejected because the promo images said "Service Worker Inspector". Visual inspection of the current PNGs confirms:
- `marquee.png` — clearly branded "Web Vitals Lite", shows LCP/CLS/INP card
- `promo-small.png` — branded "Web Vitals Lite" with LCP/CLS/INP badges
- No "Service Worker Inspector" text anywhere

The promo image issue is fixed. v1.0.1 should be ready to resubmit (combined with the permission audit commit `95c4de8` from Apr 21). User just needs to rebuild the zip + resubmit when bandwidth allows.

---

## Implications for the diversification plan

The original research doc (`docs/diversification-research-2026-04-24.md`) recommended 3 specific extensions. **Two of those three would have been built, run, and abandoned without producing revenue.** The validation procedure paid for itself ~3x over the cost of running it.

**Updated guidance:**
- Keep the 4-step validation procedure as a hard gate
- The 14-candidate list in the original doc remains useful as a **brainstorming starter**, not a build list
- Add the "page-integration moat" test as Step 5 of the procedure
- Run candidates in batches of 3, kill ruthlessly, keep only what passes ALL 5 steps

The only thing the validation revealed about the original recommendations was that they were Wrong-Mostly-Right: the framework (Search-String Fit) holds, but the specific candidates lacked the page-integration moat.
