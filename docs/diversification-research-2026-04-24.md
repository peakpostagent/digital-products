# Agentic Business Diversification Research — 2026-04-24

Generated autonomously overnight from three independent research sources:
- **Web research agent** — ~15 WebSearch / WebFetch queries across IndieHackers, StarterStory, Latka, Medium, etc.
- **Zero-sales post-mortem agent** — analysis of why 7 Gumroad products + most extensions got zero traction
- **Ollama (qwen3:14b) via 3 sequential calls** — ideation, critique, devil's advocate

All three converged on the same primary bet. Secondary bets disagree — I've included both.

---

## The Convergent Finding

**The zero-sales problem is a channel problem, not a product problem.**

7 Gumroad products shipped at retail-grade quality; zero sales. The only channel that has ever produced a user for this portfolio is Chrome Web Store organic search (MCC: 15 users, CSS Variables: 12, Security Headers: 11 — all without marketing).

**The testable rule** (call it "Search-String Fit") extracted from MCC's success:

> An extension gets organic CWS traction when:
> 1. Its exact name is a search string a **non-technical** person would type into CWS search
> 2. It solves a concrete, nameable pain (not a "nice to have")
> 3. The competitor set is weak or absent
> 4. The category is business/utility — **not dev tools** (developers don't browse CWS, they ask colleagues)

MCC hits all 4. DotEnv Preview / API Echo / Shadow DOM Debugger hit 1-3 but fail on #4 — which is why they're stuck at 0-8 users despite being technically good.

---

## Primary Recommendation (3 independent sources agree)

**Ship 3 new Chrome extensions in NON-DEVELOPER B2B verticals**, applying the Search-String Fit rule. Apply the MCC Pro monetization pattern once free-tier traction is proven.

### Expected outcome at 90 days
- **$500–$1,500 MRR** (web research math, cross-validated)
- 2-3 extensions live with 100-500 users each (if Search-String Fit is reproducible)
- 1 of the 3 clones MCC's monetization pattern ($4.99/mo paid tier)
- If all 3 flop: definitive data that MCC was a fluke, pivot to next archetype

### Why this beats the alternatives

| Alternative | Why it lost | Source |
|---|---|---|
| More Gumroad products | Gumroad Discover is dead; channel produces zero | Agent B + user's own 0-for-7 |
| RapidAPI endpoints | Slower first-dollar (60-90 days to real usage) but viable hedge | Web agent (ranked #2) |
| Programmatic SEO directory | 3-6 month revenue lag; too slow for 90-day window | Web agent (ranked #3) |
| VS Code marketplace port | No native paywall infra; only works as lead-gen | Web agent (ranked #8) |
| Newsletter play | Requires audience-building first — same channel problem Gumroad has | Agent B |
| LegalDocBot / generic AI tools | Saturated, dev-heavy, no distribution advantage | Ollama |
| Shopify / Figma plugins | Steeper build cost per plugin, uncertain first-dollar | Web agent (#4, #7) |

---

## Secondary Bet — Disagreement between sources

The primary bet is clear. The HEDGE (in case MCC Pro and all 3 new extensions flop) is disputed:

| Source | Hedge recommendation |
|---|---|
| Web research agent | 3-5 RapidAPI endpoints — shares Vercel backend with mcc-insights |
| Post-mortem agent | 1 VS Code marketplace port of an existing extension |
| Ollama | Combination A+B (extensions + RapidAPI with shared auth/backend) |

**My read:** RapidAPI wins on *revenue potential* + *infrastructure reuse* (Vercel serverless already in play for mcc-insights); VS Code wins on *time-to-first-install* + *brand consistency*. If forced to pick one: **RapidAPI** — because:
- The MCC insights backend pattern clones cleanly into metered endpoints
- Distribution is real (RapidAPI has 4M developers browsing)
- Zero incremental infra cost if Vercel is already deployed for MCC

**Best possible outcome:** do ONE RapidAPI endpoint in parallel with the 3 new extensions, total additional effort ~5 hours.

---

## Validation Procedures (before building ANY new extension)

From Ollama's devil's-advocate pass — **run all 4 of these against any candidate idea, kill the idea if it fails any one**:

### 1. Search-Demand Validation (2 hours)
- **Google Trends** for the target keyword (e.g., "HR time tracker") → must show stable or rising interest, not declining
- **Keywords Everywhere** → target ≥ 50 searches/month on the exact keyword string
- **Reddit + LinkedIn groups** → find 3+ posts from the last 12 months asking for this specific tool or complaining about existing ones
- Kill if: flat/declining trend, <50 searches/month, or no community demand signal

### 2. Saturation Check (30 min)
- Search CWS for the exact target keyword
- **Kill if:** >5 existing extensions with >1,000 installs appear in first 10 results
- Also check AppSumo / G2 for saturated SaaS alternatives

### 3. Monetization Viability (30 min)
- Check if competitor CWS extensions in the category have paid tiers — **if 0/10 do, kill** (no buyer demand at this price point for this niche)
- Check AppSumo / G2 for tools in the niche with $5-10/mo pricing — **need ≥ 3 to exist**
- Check Google Trends for `keyword + "paid"` / `keyword + "subscription"` — any signal is good

### 4. Search-String-Fit Double-Check
- Pick 3 candidate names. For each, imagine an HR person / teacher / marketer typing it into CWS search. Would they? Ask: *"If I didn't already know my tool existed, would I search for this exact string?"*
- Kill if: the name is clever, requires technical vocabulary, or doesn't self-describe

---

## Kill Criteria (from Ollama — use as gospel)

Once launched, pull the plug at specific thresholds:

| Day | Install threshold | Action if below |
|---|---|---|
| 14 | <10 installs | **Pause promotion**, rewrite listing + regenerate screenshots |
| 30 | <50 installs | **Pull from CWS** to free the 20-slot cap; redirect effort |
| 60 | <5 paid conversions (even on free-only install base) | **Don't clone the paid-tier pattern** to it; keep as free-only |
| 90 | <100 total users | **Abandon**, free the slot |

**Slot rotation rule:** always cut the oldest zero-user extension first when reaching 20/20 cap. Per `feedback_cws_item_limit.md` — already in memory.

---

## Candidate Extension Ideas (pre-validation)

These need to be run through the validation procedure before commitment. Listed with a rough "Search-String Fit" read. **Do not build without validating.**

### HR / Recruiting
- **"Job Description Bias Checker"** — pastes a JD, highlights gendered / ageist language. Legal pressure + real pain for recruiters.
- **"Interview Question Generator from Resume"** — paste resume, get 10 tailored questions
- **"Candidate Email Personalizer"** — reads LinkedIn profile, writes cold outreach

### Teachers / Educators
- **"Reading Level Analyzer"** — paste text, return Flesch-Kincaid grade level + rewrite suggestions
- **"Lesson Plan Generator"** — subject + grade → outputs plan. Heavy AI use; real pain.
- **"Rubric Maker"** — input assignment description, outputs scoring rubric

### Accessibility (end-user)
- **"Alt Text Writer for Twitter/Instagram"** — vision model generates accessible alt text
- **"Dyslexia Font Switcher"** — toggles any webpage to OpenDyslexic font
- **"Page Contrast Fixer"** — dims/bumps contrast on low-legibility pages (end-user version, not the dev tool)

### Marketing / SMB
- **"Email Subject Line A/B Generator"** — paste draft, get 3 variants with emoji + urgency options
- **"Instagram Caption Optimizer"** — hashtag suggestions + length grading
- **"Meta Description Writer"** — SEO end-user tool (non-dev — SEO consultants, not engineers)

### Real Estate / Finance
- **"Listing Description Generator"** — for realtors, not for dev use
- **"Mortgage Affordability Calculator"** — non-US people-finance tool
- **"Strata Fee Analyzer"** — Canadian-specific; niche but maybe search-fit

### Health / Medical
- **"EOB (Explanation of Benefits) Decoder"** — like Pay Decoder but for medical bills
- **"Nutrition Label Comparer"** — compare two products' nutrition labels side-by-side

### My top-3 picks to validate first

1. **Reading Level Analyzer** — clear Search-String Fit; teachers are a known-underserved CWS audience; strong pain; likely weak competitor set
2. **Job Description Bias Checker** — legal-pressure-driven buyers; clear pain; HR has budget; monetization likely
3. **Email Subject Line A/B Generator** — small marketers buy tools; Search-String Fit with "subject line generator"; LLM does the work

Before building ANY of these, spend **the 2-hour validation procedure** — then commit or kill.

---

## Explicit STOP-DOING list

From agents + Ollama, consensus:

| Stop | Why |
|---|---|
| Shipping Gumroad products | 0-for-7 is definitive; fix the channel before you ship another |
| Shipping dev-tool Chrome extensions | Devs don't browse CWS search; ceiling is ~10-40 users; not a buyer base |
| Polishing Gumroad listings, covers, banners | Polishing pages nobody visits = motion not progress |
| Reddit / Medium posts without 3x/week cadence for 12 months | Sporadic content compounds at zero |
| Fantasy RPG NPC Portraits | 0 of 120 portraits generated; IPAdapter workflow never written; parked on ComfyUI restart. Kill the product if ComfyUI isn't back within 30 days. |
| New product experiments outside the "Search-String Fit" rule | Stop trying to invent; pattern-match what works |

**Reclaimed time from stopping above: 4-6 hrs/week.** Redirect to: validating the 3 extension candidates, then building them.

---

## Combined Infrastructure Play

If you accept the primary bet (3 extensions) + secondary bet (1 RapidAPI endpoint), the shared-infrastructure savings are real:

| Component | Shared across |
|---|---|
| Vercel serverless function template | MCC Insights + any RapidAPI endpoint |
| Ollama-on-localhost | Pre-launch content generation (listing copy, JD samples, etc.) |
| ComfyUI artwork pipeline | Icon + screenshot generation for ALL extensions |
| ExtensionPay billing wiring | Clones to any new paid-tier extension (copy `lib/extpay.js` + manifest host_permissions) |
| `generate-icons.js` SVG template | Already parametric — change 3 constants, get a new brand-consistent icon set |

Genuine saving: ~30% of per-extension build time is boilerplate that's already solved. First new extension: 5-7 days. Subsequent: 2-3 days each.

---

## 90-Day Minimal Diversification Plan

Weekly budget: 8-10 hours.

### Week 1-2 — Validate 3 candidates
- Run the 4-step validation procedure against ~6 candidate ideas from the list above
- Pick the 3 highest-scoring that pass ALL 4 checks
- **Hours: 6-8**

### Week 3-5 — Ship extension #1 (first new non-dev extension)
- 2-3 day build using existing boilerplate
- Generate icons via `generate-icons.js` template
- Write permission justifications from SUBMISSION-TEXT.md template
- Submit to CWS, wait 1-5 days for review
- **Hours: 10-15**

### Week 6-8 — Ship extensions #2 and #3
- Parallel. Each 2-3 days.
- Do NOT go wider than 3 in this cycle.
- **Hours: 16-20**

### Week 9-12 — Measure + Cut + Clone
- Day 30 check on extension #1: apply kill criteria
- Day 30 check on extensions #2, #3
- For the top performer: port MCC Pro ExtensionPay pattern (5-hour copy-paste job)
- For the laggards: either rewrite listing/screenshots or pull

### Parallel track (optional, 2 hrs/week)
- Deploy 1 RapidAPI endpoint as the hedge. Best candidate: wrap the MCC aggregator logic into a public-facing `POST /api/calculate-meeting-cost` endpoint — zero net new code, just repackages what's already live.

### Success metric at day 90
- **Green light:** MCC Pro + 1 of the 3 new extensions generating $100+ MRR combined → double down
- **Yellow:** No MRR but 1+ new extension got 100+ free users → iterate on monetization
- **Red:** All 4 ships (MCC + 3 new) at <100 users each → Search-String Fit doesn't generalize; pivot to VS Code marketplace port

---

## Hidden Costs to Budget For

From Ollama:

1. **Listing maintenance** — screenshots / descriptions / keywords need refreshes every 3 months per extension. Mitigation: `extension-artwork` tool + `generate-icons.js` are already automation-ready. ~1 hour per extension per refresh cycle.

2. **Permission audits on each CWS resubmission** — every version bump triggers a re-review; new permissions trigger slower review. Mitigation: the CWS permission-audit commit pattern already in the portfolio.

3. **MV3 migration debt** — Chrome's manifest spec continues to evolve (V4 eventually). Any API you rely on today may deprecate. Mitigation: keep extensions small + vanilla; avoid clever framework bindings.

4. **ExtensionPay lock-in** — if ExtensionPay gets acquired / changes terms, all paid-tier extensions are at risk. Mitigation: eventually port to direct Stripe (larger effort, defer until ≥3 paid tiers exist).

---

## Source Attribution

**Web research agent** — top sources:
- [RatePunk $50K/mo](https://www.starterstory.com/stories/ratepunk) — Chrome extension flagship revenue case
- [Easy Folders $3.7K MRR in 6 months](https://www.indiehackers.com/product/easy-folders) — realistic solo-indie trajectory
- [Shopify App Store statistics](https://uptek.com/shopify-statistics/app-store/) — $93K-$167K median dev revenue
- [beehiiv State of Newsletters 2026](https://www.beehiiv.com/blog/beehiiv-the-state-of-newsletters-2026) — newsletter reality check
- [Zapier programmatic SEO case study](https://salt.agency/blog/how-zapier-quadrupled-organic-traffic/) — 70K pages for organic growth

**Post-mortem agent** — drew from `docs/agentic-income-research.md`, `docs/competitive-extension-research.md`, `docs/performance-tracker.md`, `docs/traffic-and-marketing-strategy.md`, and user's live 2026-04-19 portfolio snapshot.

**Ollama (qwen3:14b)** — 3 turns: ideation (5 ideas), critique (graded A/B/C 0-10 on 4 axes), devil's advocate (5 failure scenarios, kill criteria, hidden costs).

---

## What I'd Do If I Were You — Opinionated Summary

1. **Don't ship anything new this week.** MCC Pro review is in flight. See the result before starting anything else.
2. **Spend the first 6 hours of the next availability block on VALIDATION of 6 non-dev candidate extensions** against the 4-step check. Keep only those that pass all 4. That alone weeds out ~4 of every 6 ideas.
3. **First new extension: Reading Level Analyzer** (teachers). Strongest Search-String Fit signal I can predict. 3-day build using existing boilerplate.
4. **Stop polishing the Gumroad portfolio.** Put it in maintenance mode; no new products; redirect ALL time saved.
5. **The fantasy-rpg-npc-portraits product should be parked with a 30-day ComfyUI restart deadline. Cut if not resumed.**
6. **Track everything via weekly self-review against the day-14/30/60/90 kill criteria.** Don't be polite to your own projects.

If MCC Pro generates even $20/mo by day 60: the monetization pattern is real and we accelerate. If it generates $0: the pattern isn't reproducible and we pivot to the VS Code hedge.

Bet the money — at least, the time money.
