# Launch Post Drafts — Apify Audit Suite

**Status: DRAFTS ONLY — nothing has been posted anywhere.** Each needs your read + approval, then either you post it or you tell me "post the IH one" etc. and I'll walk you through it (the accounts are yours, so final submit is your click anyway).

Why these three venues, in order: IndieHackers is friendliest to "here's my system" posts and tolerates links; r/SEO has the exact buyer persona for the SEO suite but hates self-promotion (draft is written accordingly — value first, tools mentioned once); Show HN is highest-variance (front page = thousands of visits, usual case = 20).

---

## 1. IndieHackers post

**Title:** I built 13 website-audit APIs in 3 weeks using AI agents — here's the full system

**Body:**

Solo dev experiment: I've been running my side-project portfolio (20 Chrome extensions, ~100 users) mostly hands-off, and last month I pointed the same AI-agent workflow at a new channel: Apify Actors.

The system: Claude (Anthropic's agent) ports the scanning logic out of my existing Chrome extensions into cloud APIs, writes the Docker + input schemas, deploys via CLI, smoke-tests against real sites, sets pricing through the platform API, and monitors dailies via a cron that pings my phone. My total hands-on time per Actor is ~10 minutes (account approvals, publish clicks — things platforms gate behind a human).

Three weeks in: 13 audit APIs live (security headers, Core Web Vitals, WCAG contrast, broken links, structured data, robots/sitemap, GDPR cookie compliance, and more), all pay-per-result. Revenue so far: $0 — pricing only went live this week, and the honest lesson so far is that **distribution is the hard part, not production**. AI agents have made building nearly free; discovery is now the whole game.

What I'd tell anyone trying this:
1. Marketplace search ranking is usage-driven — new listings are invisible until first users arrive. Launch posts like this one ARE the strategy.
2. Fetch-only APIs (no headless browser) cost ~10x less to run — price accordingly.
3. Platforms gate the money steps (publish terms, payout KYC) behind humans deliberately. Budget your own time for exactly those steps and automate everything else.

The suite: apify.com/pattonholdings

Happy to answer anything about the agent workflow, Apify economics, or the Chrome-extension-to-API porting pattern.

---

## 2. r/SEO post (value-first, single mention)

**Title:** I automated my site-audit checklist into API calls — sharing what the data shows about common failures

**Body:**

I got tired of running the same launch-day checks by hand (security headers, meta tags, robots.txt, structured data, broken links, Core Web Vitals), so I turned each into a scriptable API and ran them against a few hundred sites while testing.

Patterns that surprised me:

- **White-on-white text passes visual review constantly.** Automated contrast checking caught hero-section headings with contrast ratio 1.0 (invisible text used for layout hacks) on well-known marketing sites — including stripe.com scoring only 95.9% AA pass rate.
- **The single most common structured-data failure** is an Article block missing `author` — which alone disqualifies the page from Rich Results.
- **robots.txt disasters are quiet.** A `Disallow: /` shipped to production tells no one. It just bleeds traffic until someone notices in Search Console weeks later.
- **Most sites still serve gzip, not Brotli** — free 15-25% transfer saving sitting on the table, one CDN toggle away.

If you want to script these checks yourself, the stack is: fetch the URL, parse headers/DOM, grade against published thresholds (Google's CWV thresholds, WCAG 2.2, schema.org required-properties lists — all public). I packaged mine as pay-per-result APIs on Apify (username pattonholdings) if you'd rather not build them, but honestly the DIY version is a weekend project and I just described the whole architecture.

What automated checks do you run on every client site? Looking for blind spots in my list.

---

## 3. Show HN post

**Title:** Show HN: 13 website-audit APIs (security, a11y, SEO, perf) built and operated by an AI agent

**Body (first comment, posted immediately after submission):**

Hi HN — solo dev here. This is half product, half experiment report.

The product: 13 pay-per-result audit APIs on Apify — security headers grading, Core Web Vitals measurement, WCAG 2.2 contrast auditing, broken-link crawling, structured-data validation, GDPR cookie-consent detection, and more. Each returns structured JSON with an A-F grade. Profile: https://apify.com/pattonholdings

The experiment: nearly everything — porting scanner logic from my Chrome extensions, writing Dockerfiles and input schemas, deploying, smoke-testing against live sites, setting prices via the platform API, daily monitoring — is done by an AI agent (Claude) running on my machine. My role has been ~10 minutes per Actor: account creation, accepting marketplace terms, payout KYC. The platforms deliberately gate those steps behind humans, which I think is correct.

Honest numbers, because HN: $0 revenue so far (pricing went live this week), ~100 users across my older Chrome extensions, and the biggest finding is that AI agents collapse the cost of BUILDING to near zero while leaving DISTRIBUTION as expensive as ever. The bottleneck has moved entirely to discovery.

Things I'll answer candidly: the actual agent workflow and where it fails, Apify's marketplace economics for small creators, why I killed my Gumroad channel, and what "autonomous business" actually looks like day-to-day (much more boring than the hype).

---

## Posting checklist (when you approve)

- [ ] IndieHackers: post from your IH account, flair "Share your product" or similar
- [ ] r/SEO: check subreddit rules pinned post first (self-promo rules change); if r/SEO rejects, r/TechSEO and r/bigseo are alternates
- [ ] Show HN: submit URL = your Apify profile; first comment = the body above, posted immediately
- [ ] All three: reply to every comment within the first 3 hours if you can — early engagement drives ranking on all three platforms
- [ ] Tell me when live — I'll monitor traffic → Actor runs correlation via the watchdog
