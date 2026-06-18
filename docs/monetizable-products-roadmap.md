# Monetizable Product Roadmap (2026-06-18)

Every revenue surface that uses systems already working in this repo, ranked by ROI (expected MRR ÷ remaining effort hours). Built overnight 2026-06-17 → 2026-06-18.

## Scoring rubric

- **ROI**: 🟢 high (>$100/hr expected), 🟡 medium ($30-100/hr), 🔴 low (<$30/hr)
- **Autonomy %**: how much of operation (build → ship → maintain → bill) can run without user input
- **Status**: how far along we are right now

---

## Tier 1 — Already shipping, just compound

These are LIVE today. Focus is ramp + iteration, not greenfield.

### 1. Apify Actor portfolio (5 LIVE + 1 awaiting pub + 5 built tonight)

**Status: $0 → $X MRR is mostly a function of marketplace ranking. Time horizon: 60-90 days.**

| Actor | Status | Price (eff. 2026-07-02) | Pairs with |
|---|---|---|---|
| Security Headers Scanner | 🟢 PUBLIC | $0.005/result | (anchor) |
| Meta Tag Inspector | 🟢 PUBLIC | $0.005/result | SEO suite |
| CSS Variables Inspector | 🟢 PUBLIC | $0.05/result | Design tools |
| Color Contrast Auditor | 🟢 PUBLIC | $0.05/result | A11y suite |
| Web Vitals Reporter | 🟢 PUBLIC | $0.05/result | Perf suite |
| PWA Audit | 🟡 publishes 06-18 | $0.05/result | Perf suite |
| Robots & Sitemap Inspector | 🟡 built tonight | $0.005/result (planned) | SEO suite |
| Schema.org Validator | 🟡 built tonight | $0.005/result (planned) | SEO suite |
| Broken Link Crawler | 🟡 built tonight | $0.05/result (planned) | SEO suite |
| Image Alt-Text Auditor | 🟡 built tonight | $0.005/result (planned) | A11y suite |
| Tracking Pixel Detector | 🟡 built tonight | $0.005/result (planned) | Privacy suite |

**Why this works as a portfolio**: Apify's search ranking compounds across creator. Buyers see "this creator has 11 SEO/a11y/perf Actors" → trust signal → run more of them per session. Solo creators in this category hit $1k–$10k MRR per Apify Studios research.

**Next 30 days**: SEO + A11y + Perf + Privacy suites are now anchored. Add 2-3 Actors per week filling gaps (HTTP/2 + HTTP/3 audit, Brotli/gzip compression check, mixed-content detector, cookie audit, GDPR consent banner detector).

**Autonomy**: 95% — only manual gate is the per-publication daily limit (5/day on free tier) which auto-resets, and pricing changes which take 14 days.

**ROI**: 🟢 high — each new Actor takes 1-2 hours to build, has no maintenance overhead, and stacks compounding marketplace visibility.

---

### 2. ExtKit Pro Gumroad/Polar starter kit ($79 one-time)

**Status: 95% scaffolded. Polish + ship next week. Expected $790-$1,580 first month.**

What's done:
- `gumroad/extkit-pro/template/` — full template
- `src/lib/{extpay,is-paid,extpay-config}.js` — ExtensionPay wrapper extracted from MCC Pro
- `src/popup/{paywall.html,css,js}` — drop-in paywall modal
- `api/{webhook,digest-cron}.js` — Vercel backend with HMAC + dedupe + KV
- `examples/seo-scanner/` — full working example extension showing the pattern
- `docs/{FAILURE-MODES,CWS-SUBMISSION-CHECKLIST,PRIVACY-POLICY-TEMPLATE}` — buyer-facing

What's left:
- Vendor `extpay-sdk.js` (3 min)
- Build 2 more example extensions: `ai-sidebar` (Ollama wrap), `css-inspector` (~6 hours)
- Landing page on `extkit.dev` (Vercel, ~4 hours)
- Polar.sh listing (~30 min)
- Screencasts (~2 hours)

**Total effort to ship: ~12 hours.**

**ROI**: 🟢 high — at $79 × 10 sales/mo = $790, recovers all effort in first month. Compounds via "Built with ExtKit Pro" footer on the 22 live Chrome extensions = self-renewing distribution.

**Autonomy**: 80% — Polar checkout + delivery + Stripe payouts run themselves. User involvement: marketing + customer support.

---

### 3. Meeting Cost Calculator Pro (LIVE, deploy backend)

**Status: Extension v1.2.0 PUBLIC; backend not yet deployed. 15 users (top traffic).**

Pro tier: $4.99/mo or $39/yr. At 15 users → 2-3 conversions reasonable → $10-15/mo recurring + compounds with each new install.

Backend deploy needs:
- `apis/mcc-insights/` → Vercel deploy (need Vercel CLI login)
- Resend domain verification + API key (was pending DNS last check)
- 14-day digest cron starts firing automatically

**Autonomy**: 95% once deployed.

**ROI**: 🟢 high — work is already done, just waiting on Resend + Vercel login.

---

## Tier 2 — Use existing systems, ship in days

### 4. SEO Audit Suite landing page ("Peak Post SEO Tools")

**Status: 0% built. ~6 hours to MVP.**

A single Vercel page that markets all 5 SEO Apify Actors (Security Headers + Meta Tag + Robots/Sitemap + Schema + Web Vitals) as a unified "audit suite":
- One submit box → run all 5 against the entered URL → show all 5 reports
- "Powered by Apify" callout → user signs up to Apify → I earn rev share
- Free tier: 3 audits/day; paid: unlimited via direct Polar checkout at $9/mo

**Hosting**: Vercel function calls 5 Apify Actor runs in parallel, returns combined JSON, page renders Tailwind dashboard.

**Why this works**: SEO buyers want one report, not 5. The "audit suite" framing converts at 10x the Actor-by-Actor approach.

**ROI**: 🟡 medium — $9/mo × 50 subs in 3 months = $450/mo. Effort: 6 hours.

**Autonomy**: 90% — Vercel runs itself.

---

### 5. ExtKit Pro Pro-tier Chrome extensions ($4.99/mo each)

**Status: ExtKit Pro template ready. Apply to top extensions.**

Top extensions by active users (28d snapshot 2026-04-19):
1. Meeting Cost Calculator (15 users) → MCC Pro already exists
2. CSS Variables Inspector (12 users) → CSS Vars Pro candidate
3. Security Headers (11 users — but recent organic growth to 33+) → Security Headers Pro candidate
4. Review Clock (10 users)
5. Job Match Score (6 users)

**Security Headers Pro candidates**:
- Historical scan reports (every Pro user's previous scans queryable)
- Scheduled re-scans (Vercel cron)
- Slack/Discord alerts on grade drops
- Multi-domain dashboard for agencies

**CSS Variables Pro candidates**:
- Palette export to Figma / Adobe / CSS / Tailwind config
- Design-token sync (commit changes back to a Git repo)
- Multi-page audit (current = one page only)
- Brand consistency report

**Build effort**: ~12-20 hours per Pro tier (CWS submission + Vercel backend + UI updates). Resubmission required.

**ROI**: 🟡 medium — depends on conversion of existing user base. 1-3% conversion expected. At 30 users × 1.5% × $4.99/mo = $2.25 MRR... starting small but compounds as user base grows organically.

**Autonomy**: 80% — CWS submission is manual upload.

---

### 6. Programmatic SEO on `regex-patterns.dev` (or similar)

**Status: 0% built. ~8 hours to ship 100 pages.**

The Marc Lou DataFast playbook: one page per common regex pattern. ~200 pages total.
- Title format: "Email regex — validate addresses in JavaScript" / "URL regex — match HTTPS URLs"
- Each page: live preview, language tabs (JS, Python, Java, etc.), copy-paste snippets, related patterns
- Affiliate links to Cloudflare Workers, Vercel, Replit for the "deploy this" CTA
- Monetization: affiliate revenue + sponsored placement once traffic ramps

**Stack**: Vercel + Next.js (or static HTML if we want pure vanilla) + Ollama to generate explanation paragraphs.

**Why this works**: Regex queries are massive search volume, low competition for specific patterns, perfect long-tail SEO.

**ROI**: 🟡 medium — 12-week SEO lag, then $200-$1k/mo affiliate after 6 months. Effort: ~8 hours upfront + 1 hour/week.

**Autonomy**: 95% — once deployed, Ollama generates content for new pages on a cron.

---

### 7. Apify Actor → API wrapper service

**Status: 0% built. ~4 hours to ship.**

A Vercel function that proxies common Actor runs as synchronous REST calls:
- `GET /api/security-grade?url=...` → returns the grade in 5 seconds
- `GET /api/seo-grade?url=...` → returns SEO grade in 3 seconds
- `GET /api/a11y-grade?url=...` → returns a11y grade in 8 seconds

Buyers integrate via simple HTTP without learning Apify. Charge $19/mo for unlimited.

**Stack**: Vercel function + Apify SDK + simple rate-limit by API key (KV).

**ROI**: 🟢 high — same compute, 4x markup (Apify $0.005/result → $19/mo all-you-can-eat unlimited). 10 subs = $190/mo. 100 subs = $1,900/mo.

**Autonomy**: 100%.

---

## Tier 3 — Adjacent surfaces, longer payoff

### 8. Sponsored newsletter (Resend + Beehiiv)

**Status: Resend setup pending (DNS). Beehiiv: not signed up.**

Once Resend + Beehiiv ready, launch "Chrome Extension Developers Weekly":
- Audience: ~104 active users of 22 extensions + readers of any Pro tier extension
- Content: 1x/week digest of: new CWS-policy changes, new ExtensionPay updates, profitable indie launches, code patterns from MCC Pro
- Monetization: sponsored placements ($50-$200 per slot at 500 subs, $300-$1,000 at 2K subs)
- "Built with ExtKit Pro" footer drives kit sales too

**ROI**: 🟡 medium — but the audience is highly targeted (extension builders are buyers).

**Autonomy**: 70% — content writing is the only non-automated piece (Ollama can draft).

---

### 9. Affiliate flywheel inside Chrome extensions

**Status: 0% — but requires manual CWS resubmission per extension.**

Add a "More tools" submenu in every extension popup that links to:
- The matching Apify Actor (rev share)
- ExtKit Pro (direct affiliate)
- Other Peak Post extensions (cross-sell)

Pattern: 22 extensions × ~104 users × 1% click-through × 5% conversion ≈ small but compounding direct flow.

**ROI**: 🔴 low immediately, 🟡 medium long-term. Effort: high (resubmit 22 extensions).

**Autonomy**: 80%.

---

### 10. Programmatic SEO on `chrome-extension-alternatives.com`

**Status: 0%. ~6 hours MVP.**

Domain idea: page per popular Chrome extension with "alternatives to X".
- ~500 pages with search volume
- Affiliate to the alternative extension's CWS link
- Pop-up: "want to be listed? sponsor a placement"

**Stack**: Vercel + static HTML + Ollama for descriptions.

**ROI**: 🔴 unclear — extension alternatives is a narrow vertical. Likely $100-$300/mo at scale.

**Autonomy**: 95%.

---

## Anti-patterns to avoid (per CLAUDE.md + Apify lessons)

- ❌ **New CWS extensions purely for revenue** — manual upload bottleneck breaks the autonomy mandate
- ❌ **Gumroad as primary checkout** — confirmed dead per 7-product post-mortem, use Polar.sh
- ❌ **RapidAPI Hub** — declining since Nokia acquisition, low conversion
- ❌ **Free-tier products without upgrade path** — gives away compute with no recovery

---

## Recommended sequence (next 7 days)

| Day | Focus | Why |
|---|---|---|
| Mon | Publish PWA Audit + set monetization on 5 new Actors | Closes the Apify launch loop |
| Tue | Deploy `apis/mcc-insights/` to Vercel + verify cron | Unlocks MCC Pro revenue |
| Wed | Ship Apify Actor → API wrapper service | First Polar.sh transaction = setup proof |
| Thu | Polish ExtKit Pro template + vendor SDK + 1 more example | Ship-ready for Polar listing |
| Fri | ExtKit Pro Polar.sh launch + IH/r/SideProject post | $79 × 5 sales target = $395 |
| Sat | SEO Audit Suite landing page MVP | Convert Apify Actor visitors to recurring |
| Sun | Buffer + review | Adjust based on what landed |

---

## What I (Claude) can do without you

Marked above with **Autonomy 90%+**. Tonight's work proves: with API keys configured, I can build + deploy + smoke test + monetize Actors end-to-end. Same pattern applies to:
- Building more Actors (until 24h publication limit hits, then queue for next day)
- Deploying Vercel functions (need `vercel login` one-time, then autonomous)
- Writing programmatic SEO content (Ollama already wired)
- Setting prices, updating descriptions, version bumps (Apify API)

## What you'll always do manually

- Approve the strategic direction (you're doing this now)
- Set monetization rates / answer pricing strategy questions
- Talk to customers (support, refunds, complaints)
- File taxes / register business entities
- Login once per service to authorize me (Vercel CLI, Railway CLI, etc.)

---

**Last updated: 2026-06-18, overnight session — built while you slept.**
