# Fully Autonomous Business Plan — May 2026

Synthesis of three parallel research agents (current 2026 market scan + Claude config audit + portfolio pivot). User's hard constraint: ONLY does initial setup. No manual uploads, no daily check-ins, no approval queues.

---

## TL;DR — the three plays

In ranked order by EV-per-effort:

1. **Apify Actor portfolio** — port Security Headers + CSS Variables Inspector + Meta Tag Viewer into Playwright-based Apify Actors. Tech is EXACT match (Playwright is what `browser-fork` already uses). Apify handles billing, hosting, support, marketplace discovery. Solo creators hitting $1K–$10K MRR per portfolio. ([ParseForge Actor Factory case study, Feb 2026](https://blog.apify.com/parseforge-actor-factory/))
2. **Programmatic SEO site on Vercel + Ollama** — Marc Lou's DataFast at $15.8K MRR proves the model. Pick a vertical the user already knows (Chrome-extension comparisons, regex patterns, security headers config). Ollama generates pages at zero marginal cost. ([Marc Lou Jan 2026 income report](https://newsletter.marclou.com/p/i-made-1-032-000-in-2025))
3. **Telegram Mini App + Stars billing** — Bot API is free, no app-store review, Stars revenue is API-native. Western discovery is weak but a niche-tight launch can clear $500/mo with <1 hr/week maintenance. ([Telegram Bot API 2026 guide](https://zeroclaws.io/blog/telegram-bot-api-2026-ai-agent-developers-guide))

Hold MCC Pro + maintain the 5 best Chrome extensions in rare-update mode. **Don't ship new Chrome extensions or Gumroad products.**

---

## Why not the old plan?

Two findings overrode prior assumptions:

- **RapidAPI marketplace is materially decaying** post-Nokia acquisition. Listings and dev activity collapsing. Not a fit for new entrants in 2026. (Agent 1 finding; Agent 3 was unaware of the acquisition impact.)
- **Gumroad has no product-creation API.** Confirmed by open [GitHub issue #4019](https://github.com/antiwork/gumroad/issues/4019) — request still in RFC stage. Manual dashboard is the only path. **Gumroad is structurally incompatible with the autonomy constraint.** Use Polar.sh instead for any future digital-product checkout.

---

## Portfolio triage (do this once, then forget)

### Chrome extensions — keep 5, freeze rest, delete zero-user after 60 days

| Action | Extension | Reason |
|---|---|---|
| Keep + maintain | Security Headers (33u), CSS Variables Inspector (18u), API Rate Limiter (7), Service Worker Inspector (7), LocalStorage Manager (6) | Organic traffic infrastructure. Update only on real bug reports. Max 1 upload/quarter each. |
| Keep but freeze | MCC, Shadow DOM Debugger, Snippet Vault, Review Clock, DotEnv Preview, Pay Decoder, Color Contrast Checker | Working at <5 users; not worth maintenance. Don't touch unless broken. |
| Delete to free slots | Read Cost, API Echo, Tab Brake, Regex Tester, Web Vitals Lite, Job Match Score (all at — / 0–1 users after 60+ days) | Per `feedback_cws_item_limit.md` — free slots, reduce reviewer-attention surface. |
| Resubmit & let ride | Console Catcher v1.0.3 (rejected), Meta Tag Viewer v1.0.1 (rejected — already fixed), Z-Index Inspector (draft) | One CWS upload session — then walk away. |

**No new extensions.** Every new Chrome extension is a manual upload per update — incompatible with the autonomy constraint. Existing ones get rare maintenance; new effort goes elsewhere.

### Gumroad — archive all 7

Unpublish from Discover. Keep URLs alive for any inbound link equity. Don't upload the 4 staged-but-not-shipped products (`git-command-pack`, `AI-Swimsuit-Pose-Library`, `AI-Model-Generator-Kit`, `fantasy-rpg-npc-portraits`). The channel is dead for new sellers; no API path to fix it.

If we ever need a digital-product checkout, use **Polar.sh** — full REST API, designed for indie devs.

### MCC Pro — deploy then walk away

`apis/mcc-insights/` is built and tested but undeployed. Deploy this week. Day-2 burden is functionally zero (ExtensionPay handles billing, refunds, dunning; Vercel cron handles the weekly email; OpenAI cost ~$0.50/mo). Realistic revenue with 15 active free users: 0–1 subs × $4.99–$39 ≈ $0–60 in year one. Not a primary focus, but a free signal.

---

## What the user needs to do — total ~3.5 hours one-time

Ordered by criticality. **P0 = nothing works without it.**

### P0 — Tonight (90 min)

1. **Stripe direct API key** (15 min)
   - Stripe → Developers → API keys → restricted key with `customers:write`, `products:write`, `prices:write`, `payment_links:write`, `charges:read`, `subscriptions:read`, `disputes:read`
   - Paste into `C:\Users\colet\.env` as `STRIPE_SECRET_KEY=rk_live_…`

2. **Anthropic API key with $50/mo cap** (10 min)
   - console.anthropic.com → API keys → create, set spend cap
   - Paste as `ANTHROPIC_API_KEY` into `.env` AND every Vercel project
   - Why separate from Claude Code subscription: post-2026-06-15 billing change excludes scheduled/headless agent work from Max-plan quotas. Need separate API allowance.

3. **OpenAI API key + $10/mo cap** (5 min)
   - For MCC Pro digest generation (already in DEPLOY.md)
   - Paste as `OPENAI_API_KEY`

4. **Resend account + verified sending domain** (45 min — DNS propagation dominates)
   - Buy `peakpost.com` at Cloudflare Registrar (~$10/yr, at cost)
   - Add to Resend → paste 3 DNS records (MX + DKIM + SPF) back at Cloudflare → wait ~10 min
   - Generate API key scoped `emails:send`; paste as `RESEND_API_KEY`
   - Set `RESEND_FROM="Peak Post <noreply@peakpost.com>"`

5. **Pushover or ntfy.sh for alerts** (5 min)
   - Existing ntfy `colet-comfyui-pipeline` works — verify it's still active
   - Add `NTFY_TOPIC` to `.env`

6. **Apify account + Stripe payout** (10 min)
   - apify.com signup, free tier covers initial usage
   - Set up Stripe Connect for payouts (50% of marketplace earnings, Apify takes 20% platform fee)
   - Generate API token, paste as `APIFY_API_TOKEN`

### P1 — Tomorrow (60 min)

7. **GitHub Personal Access Token** (5 min)
   - Fine-grained PAT with `repo`, `pages`, `workflow` scopes, 1-year expiry
   - Paste as `GITHUB_PAT`

8. **Vercel account confirmed + CLI logged in** (5 min, mostly already done)
   - `vercel whoami` should return your account
   - `vercel link` in `apis/mcc-insights/` if not already linked

9. **Polar.sh account** (10 min)
   - polar.sh signup → developer settings → API key
   - Reserve for future digital-product checkout (replaces Gumroad)
   - Paste as `POLAR_API_KEY`

10. **Beehiiv account + publication** (15 min)
    - beehiiv.com signup, free up to 2,500 subs, custom domain on free tier
    - Create publication "Peak Post" (or whatever brand)
    - Generate API key + grab publication ID
    - Paste as `BEEHIIV_API_KEY` + `BEEHIIV_PUB_ID`

11. **Sentry free tier** (10 min)
    - sentry.io signup, project per service
    - Paste DSN strings as Vercel env vars per project

12. **PostHog free tier** (15 min)
    - posthog.com signup (US cloud)
    - Paste `POSTHOG_KEY` to `.env`

### P2 — This weekend (60 min)

13. **Telegram Bot account** — message @BotFather, create bot, paste `TELEGRAM_BOT_TOKEN`
14. **Discord webhook for alerts** — create a server, copy webhook URL, paste as `DISCORD_ALERTS_WEBHOOK`
15. **Google Search Console verified for the new pSEO domain** — once Vercel deploy is up
16. **One CWS upload session** — resubmit MCC v1.2.0 / Security Headers v1.3.0 / Meta Tag Viewer v1.0.1 / Console Catcher v1.0.3 / Z-Index Inspector. Bundle them all. Should take 30–40 min.

**Total user time across all 16: ~3h 30min** one-time.

---

## What Claude does — week 1 build plan

After the P0 setup is done, Claude executes autonomously:

### Day 1 — Foundation
- Deploy `apis/mcc-insights/` to Vercel via CLI
- Wire `BACKEND_URL` into MCC service worker, rebuild zip
- Set up multi-channel alert fan-out: `apis/alerts/index.js` (ntfy + Resend + Discord)
- Set up health-check cron `apis/health/cron.js` (every 15 min)
- Install official MCPs: Stripe, Resend, Vercel, Sentry, PostHog, GitHub
- Centralize secrets in `C:\Users\colet\.env` + session-start hook to load them

### Day 2 — First Apify Actor
- Port Security Headers' scanner logic to an Apify Actor (input: URL, output: structured grade report)
- Publish to Apify Store via API
- Add README + pricing ($0.01/run public tier)

### Day 3 — Second + third Apify Actor
- CSS Variables extractor Actor (input: URL, output: all CSS custom properties)
- Meta Tag Inspector Actor (input: URL, output: structured SEO data)
- Publish both

### Day 4 — Programmatic SEO scaffold
- Pick niche: `chrome-extension-alternatives.com` (or `regex-patterns.dev` if user prefers more dev-focused)
- Scaffold Next.js static site on Vercel
- Generate 100 seed pages via Ollama+template
- Submit sitemap to GSC, ping IndexNow + Bing

### Day 5 — Beehiiv newsletter setup
- Auto-publish issue 0 (welcome + curated dev tools) via Beehiiv API
- Set up Vercel cron to publish weekly from RSS+HN+GitHub-trending
- Add newsletter signup link to Security Headers extension popup

### Day 6 — Self-healing + runbooks
- Write `docs/runbooks/` covering: Vercel deploy fail, Ollama down, Stripe webhook signature mismatch, Resend domain unverified, CWS rejection email
- Set up Stripe webhook handler for dispute/dunning alerts
- Set up Telegram bot skeleton (just `/start` for now)

### Day 7 — Stats + iteration
- Pull all-channel revenue + traffic dashboard via cron
- Email user a Friday digest with: MCC Pro subs, Apify Actor runs, pSEO indexation status, Beehiiv subs
- File a backlog of v2 ideas for Actors 4–5 + pSEO clusters 2–3

---

## Revenue targets

| Channel | Day 90 | Day 365 | Confidence |
|---|---|---|---|
| MCC Pro | $0–60/mo | $50–200/mo | Low (free tier <50 subs unlikely to convert past 1–3 paid) |
| Apify Actors (3–5 ports) | $100–500/mo | $1k–8k/mo | Medium (proven pattern, ParseForge $1k MRR in 30 days) |
| pSEO site | $0–100/mo | $500–5000/mo | Medium-low (indexation lag 60–90 days; quality penalty risk) |
| Beehiiv newsletter | $0–30/mo | $100–500/mo | Low (subs slow to acquire) |
| Telegram bot | $0–30/mo | $100–800/mo | Low-medium (discovery is the hard part) |
| **Combined floor** | **$100/mo MRR** | **$1.5k/mo MRR** | |
| **Combined ceiling** | **$700/mo MRR** | **$15k/mo MRR** | |

Floor is what I'd bet survives reality. Ceiling is the "everything compounds" scenario.

---

## Brutal honesty section

**Customer support is the biggest autonomy gap.** When an MCC Pro subscriber emails complaining, nobody responds for days. Mitigation:
- `support@peakpost.com` auto-responder + forward to Gmail
- Vercel cron that drafts replies via Claude API, queues for user's 30-second approve (still requires a click, but bundled into one daily 5-min session)
- Self-service refund link via Stripe in every digest email

**Programmatic SEO content quality.** Pure-LLM sites get deindexed at scale. Mitigation:
- Every code/regex example must execute correctly before publishing (programmatic validation step)
- No template-stamp filler; each page has real structured data
- Plan for 30–50% deindex rate; the surviving pages compound

**Apify Actor selector breakage.** When target sites change DOM, scrapers break silently. Mitigation:
- Daily health-check cron pings each Actor with a known-good URL, alerts on schema drift
- Apify itself reports run failures to your dashboard

**Anthropic API spend overrun.** If a runaway loop calls Claude in a recursion, $50 cap protects you. The architectural protection: every scheduled cron has a max-iteration counter persisted to KV, refuses to re-trigger if it exceeded last run's count.

**Platform TOS.** Apify is explicitly designed for scraping with rate limits — legitimate use. Reddit/Twitter direct posting is a TOS minefield — Claude will use Buffer (paid, ToS-compliant aggregator) instead. Pinterest/Etsy automation skipped.

---

## What I'm NOT recommending and why

- **Generic ChatGPT wrappers** — 90% dead by end of 2026, 65% churn at 90 days. [Market Clarity 2026](https://mktclarity.com/blogs/news/is-ai-wrapper-market-saturated)
- **AI image generator vertical** — saturated. Pieter Levels owns PhotoAI; HeadshotPro owns the headshot niche; new entrants $50–300 LTV.
- **CrewAI / n8n** — already stubbed in repo, abandoned. Anthropic Agent SDK is the simpler replacement.
- **Twilio SMS alerts** — overkill at this scale. ntfy phone push + Resend email covers it. Revisit at $500 MRR.
- **YouTube faceless channel** — 4k watch-hours hurdle is the real wall; high upfront effort with no revenue runway.

---

## Decision matrix

| Question | Answer |
|---|---|
| Should the user delete 0-user Chrome extensions to free CWS slots? | Yes, per existing 60-day rule. |
| Should the user upload v1.2.0/v1.3.0 fixes for MCC + Security Headers + Meta Tag Viewer? | Yes, bundle in one CWS upload session. After that, no new CWS work. |
| Should the user keep MCC Pro live? | Yes — ship and forget. Deploy this week. |
| Should the user build a new Chrome extension this quarter? | **No.** Manual upload bottleneck. |
| Should the user build a new Gumroad product? | **No.** No product-creation API. |
| Should the user invest in RapidAPI? | **No.** Marketplace decaying post-Nokia acquisition. |
| Should the user build on Apify? | **YES.** Tech match + pure API + proven solo revenue. |
| Should the user build a programmatic SEO site? | **Yes** — second priority after Apify. |
| Should the user start a newsletter? | **Yes** — slow-build third channel. |
| Should the user build for Telegram Mini Apps? | **Yes if discovery wedge exists** — defer until first 2 channels are stable. |
| Should the user pay for Buffer / Beehiiv premium? | Free tier sufficient until $500 MRR. |
| Should the user contract out customer support? | No until >50 paid subs. Auto-responder + daily approval session covers it. |

---

## Files Claude will produce in the build

1. `C:\Users\colet\.env` (central secrets, gitignored at user level)
2. `C:\Users\colet\.claude\hooks\session-start.ps1` (env loader for every Claude session)
3. `Wokring Ideas\.mcp.json` (project MCP registry — Stripe, Resend, Vercel, Sentry, PostHog, GitHub, Apify)
4. `apis/agent-runner/` (headless Anthropic Agent SDK worker)
5. `apis/alerts/index.js` (ntfy + Resend + Discord fan-out)
6. `apis/health/cron.js` (15-min self-check)
7. `apis/stripe-webhooks/index.js` (disputes, dunning, refund webhook)
8. `apis/apify-actors/` (3 ported actors: security-headers, css-variables, meta-tags)
9. `apis/pseo-site/` (Next.js scaffold for whichever niche we pick)
10. `apis/beehiiv-poster/` (weekly cron)
11. `apis/telegram-bot/` (Bot API webhook skeleton)
12. `docs/runbooks/` (per-failure runbooks for self-healing)
13. `.claude/commands/` (slash commands: /launch, /health, /refund, /pro-stats, /cws-resubmit)

---

## Sources

### Business research
- [Indie Hackers — 5 AI agent workflows actually making money in 2026 (Apr 15, 2026)](https://www.indiehackers.com/post/5-ai-agent-workflows-actually-making-money-in-2026-with-real-numbers-ea266790ba)
- [Indie Hackers — How I run 14 SaaS products with AI agents (May 3, 2026)](https://www.indiehackers.com/post/how-i-run-14-saas-products-with-ai-agents-one-month-report-49075e9757)
- [Marc Lou — I made $1,032,000 in 2025 (Feb 2026)](https://newsletter.marclou.com/p/i-made-1-032-000-in-2025)
- [Apify — ParseForge Actor Factory case study (Feb 2026)](https://blog.apify.com/parseforge-actor-factory/)
- [Stripe — Agentic Commerce Suite announcement](https://stripe.com/blog/agentic-commerce-suite)
- [Gumroad GitHub Issue #4019 — Product creation API (RFC)](https://github.com/antiwork/gumroad/issues/4019)

### Config / MCP stack
- [Anthropic Agent SDK Python](https://github.com/anthropics/claude-agent-sdk-python)
- [Anthropic June 15 2026 billing change](https://codersera.com/blog/anthropic-june-2026-billing-change-claude-code/)
- [Stripe MCP @stripe/mcp on npm](https://www.npmjs.com/package/@stripe/mcp)
- [Resend MCP official](https://github.com/resend/resend-mcp)
- [Sentry MCP (hosted)](https://docs.sentry.io/product/sentry-mcp/)
- [PostHog MCP for Claude Code](https://posthog.com/docs/model-context-protocol/claude-code)
- [Vercel MCP](https://vercel.com/docs/agent-resources/vercel-mcp)
- [GitHub MCP server install for Claude](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md)

### Avoid lists
- [Market Clarity — Is the AI wrapper market saturated in 2026?](https://mktclarity.com/blogs/news/is-ai-wrapper-market-saturated)
- [AIMultiple — 12 reasons AI agents still aren't ready in 2026](https://research.aimultiple.com/ai-agents-expectations-vs-reality/)
