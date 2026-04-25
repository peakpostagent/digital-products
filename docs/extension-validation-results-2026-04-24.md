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

## Wave 2 Candidates — Better-Shaped (in validation)

The agents suggested pivots that fit the page-integration pattern:
1. **Webpage Text Simplifier (Rewordify-style)** — select text → rewrite at chosen reading grade
2. **ATS Keyword Optimizer for Recruiters** — scan a job posting, extract ATS-relevant keywords
3. **LinkedIn Salary Estimator** — scan a job posting, estimate salary range from comparable jobs DB
4. **Etsy SEO Tag Generator** — scan an Etsy listing, suggest better-performing tags
5. **YouTube Title CTR Predictor** — score a YouTube title against historical CTR data

Each has the page-integration moat. Wave 2 validation runs in parallel after this commit.

---

## Implications for the diversification plan

The original research doc (`docs/diversification-research-2026-04-24.md`) recommended 3 specific extensions. **Two of those three would have been built, run, and abandoned without producing revenue.** The validation procedure paid for itself ~3x over the cost of running it.

**Updated guidance:**
- Keep the 4-step validation procedure as a hard gate
- The 14-candidate list in the original doc remains useful as a **brainstorming starter**, not a build list
- Add the "page-integration moat" test as Step 5 of the procedure
- Run candidates in batches of 3, kill ruthlessly, keep only what passes ALL 5 steps

The only thing the validation revealed about the original recommendations was that they were Wrong-Mostly-Right: the framework (Search-String Fit) holds, but the specific candidates lacked the page-integration moat.
