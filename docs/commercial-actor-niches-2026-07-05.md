# Commercial-Intent Actor Niches — Empirical Scan 2026-07-05

Method: queried Apify Store API across 40 commercial-intent search terms; scored each by demand proxy (leader's user count) vs entrenchment (actors with ≥100 users). Raw data captured in session scratchpad (niche_scan.json). Context: per verified research (docs/agentic-income-research-2026-07-03.md), only PAID-plan Apify users generate developer payouts — so niches whose buyers are businesses (lead-gen, recruiting, e-commerce intelligence) matter; hobbyist-dev niches don't.

## Scan highlights (demand vs entrenchment)

| Niche | Leader users | Actors ≥100 users | Read |
|---|---:|---:|---|
| linkedin jobs | 112,755 | 9 | Huge demand, saturated top |
| reddit / youtube comments / amazon | 18-31K | 5-14 | Saturated |
| yellow pages | 4,880 | **2** | Demand + thin competition; YP.com blocking risk |
| google maps leads | 1,057 | 3 | Real lead-gen demand; browser+proxy heavy, giant adjacent incumbent |
| **job postings (ATS aggregate)** | 222 | **2** | Real B2B demand, nearly empty, fetch-only viable ✅ |
| glassdoor reviews | 455 | **1** | Thin competition; Cloudflare-walled (proxy costs) |
| **news articles** | 181 | **1** | Broad demand, one weak leader, fetch-only viable ✅ |
| booking hotels | 281 | 1 | Anti-bot heavy |
| trustpilot / g2 / capterra | 165-1,017 | 5-9 | Moderately crowded review niches |

## Picks (build order)

### 1. ATS Job Postings Scraper — BUILD TONIGHT
Company careers pages on Greenhouse / Lever / Workable expose **public JSON APIs** (verified live 2026-07-05: all 200). Input: company slugs or careers URLs → output: normalized job postings (title, dept, location, remote flag, salary when present, description, apply URL).
- Buyers: recruiters, sales teams prospecting hiring companies (hiring = budget signal), job boards, market researchers — all paid-plan profiles
- Competition: 2 entrenched in "job postings" aggregate; nobody owns the multi-ATS normalizer position
- Cost: fetch-only, pennies per thousand jobs
- Risks: low — these APIs are officially public for job-board embedding

### 2. News Article Extractor — BUILD TONIGHT IF TIME
URL → clean title/author/date/full-text/images JSON. Leader has just 181 users; generic demand (research agents, monitoring, LLM pipelines). Fetch-only + readability heuristics. Also the most "agent-consumed" shaped tool we'd own (LLM pipelines want clean article text).

### 3. Yellow Pages / local-business leads — SCOUT LATER
Best demand/competition ratio in the scan (4,880-user leader, only 2 entrenched) but needs anti-blocking validation before committing. Test YP.com fetch behavior from Apify IPs first.

## Explicitly rejected
- Big-platform scrapers (Google Maps, Instagram, TikTok, Amazon, LinkedIn): 9-14 entrenched winners each, proxy wars, ToS heat — wrong fight for a solo dev
- Glassdoor/Booking: anti-bot cost exceeds solo-dev margin at our scale
- More audit tools: buyers are free-plan devs → $0 payouts (verified)
