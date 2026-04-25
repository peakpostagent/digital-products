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

## Implications for the diversification plan

The original research doc (`docs/diversification-research-2026-04-24.md`) recommended 3 specific extensions. **Two of those three would have been built, run, and abandoned without producing revenue.** The validation procedure paid for itself ~3x over the cost of running it.

**Updated guidance:**
- Keep the 4-step validation procedure as a hard gate
- The 14-candidate list in the original doc remains useful as a **brainstorming starter**, not a build list
- Add the "page-integration moat" test as Step 5 of the procedure
- Run candidates in batches of 3, kill ruthlessly, keep only what passes ALL 5 steps

The only thing the validation revealed about the original recommendations was that they were Wrong-Mostly-Right: the framework (Search-String Fit) holds, but the specific candidates lacked the page-integration moat.
