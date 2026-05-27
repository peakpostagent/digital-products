# Setup Walkthrough — Live Progress

**Updated 2026-05-15 23:30** with actual progress from yesterday's session.

## Current state (what you walked away from)

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Stripe restricted API key | ⏸️ Blocked on account recovery | Recovery in progress; don't refresh the lockout |
| 2 | Anthropic API key + $50 cap | ✅ **Verified working** | `sk-ant-…` in `.env`; HTTP 200 from `/v1/models` |
| 3 | OpenAI API key + $10 cap | ✅ **Verified working** | `sk-proj-…` in `.env`; chat completion test passed |
| 4a | `peakpost.ca` purchased at Squarespace | ✅ Done | Renews CA$36/yr |
| 4b | Resend account + domain added | 🟡 Pending DNS verification | Check `https://resend.com/domains` first thing in the morning |
| 4c | Resend API key | ⏳ After step 4b verifies | Walkthrough below |
| 5 | Apify account + token | ⏳ Tomorrow | I have 3 Actor scaffolds ready to publish the moment the token lands |
| 6 | ntfy.sh topic verified | ⏳ 1-min check on phone | |

**Total time remaining (if everything goes smoothly): ~25 min of clicking.** See `docs/TOMORROW-MORNING.md` for the exact 30-min morning play.

---

## What I built overnight (no setup needed)

| Path | Purpose |
|---|---|
| `apify-actors/security-headers-scanner/` | Port of Security Headers extension to Apify Actor. Free 100 scans/mo, paid $0.005/scan. Reuses v1.3.0 tightened evaluators. |
| `apify-actors/css-variables-inspector/` | Port of CSS Variables Inspector. Playwright-based. Free 50 pages/mo, paid $0.01/page. |
| `apify-actors/meta-tag-inspector/` | New, port of Meta Tag Viewer extension. Plain fetch, no browser. Free 200/mo, paid $0.003/page. |
| `services/telegram-bot/` | Persistent Telegram bot for Railway. /start, /status, /health commands + alert forwarding endpoint. Uses your existing $5/mo Railway Hobby plan. |
| `docs/TOMORROW-MORNING.md` | The single doc you open when you wake up. 30-min play. |

All 4 services are commit-ready code, just waiting on env vars to deploy.

---

URLs verified live on 2026-05-15. If any look weird when you visit, the platform changed their UI — tell me and I'll re-route.

**Two principles for the entire walkthrough:**
1. Every key/secret goes into ONE file: `C:\Users\colet\.env`. Format below.
2. If you get stuck on any step >5 min, skip it and tell me what failed. Don't waste your morning fighting a UI quirk.

---

## Before you start — open these tabs

Open all of these now so context-switching is one click:
- `C:\Users\colet\.env` (create this empty file in Notepad or VS Code)
- https://dashboard.stripe.com
- https://console.anthropic.com
- https://platform.openai.com
- https://dash.cloudflare.com
- https://resend.com
- https://apify.com
- https://polar.sh
- https://github.com (already logged in probably)
- https://sentry.io/welcome
- https://posthog.com
- https://beehiiv.com

---

## P0 — Tonight (90 min)

### Step 1 — Stripe restricted API key (15 min)

You already have a Stripe account from ExtensionPay setup. We just need a separate restricted key for direct API access.

1. Sign in at https://dashboard.stripe.com
2. Top-right gear icon → **Developers** → **API keys** (or directly at `dashboard.stripe.com/apikeys`)
3. Scroll to **Restricted keys** section → **Create restricted key**
4. Name it: `peakpost-agent`
5. **Permissions to set (everything else stays None):**
   - Core resources → **Customers**: Write
   - Core resources → **Charges**: Read
   - Core resources → **Disputes**: Read
   - Core resources → **Payment Intents**: Read
   - Billing → **Products**: Write
   - Billing → **Prices**: Write
   - Billing → **Payment Links**: Write
   - Billing → **Subscriptions**: Read
6. Create key. Copy the `rk_live_…` value (it's only shown once)
7. **Paste into `.env`:**
   ```
   STRIPE_SECRET_KEY=<paste-rk_live-key-here>
   ```

### Step 2 — Anthropic API key + spend cap (10 min)

This is for headless agent workflows (cron jobs, batch processing). Your Claude Code subscription doesn't cover that post-2026-06-15. Don't skip the spend cap.

1. Go to https://console.anthropic.com
2. Sign in with the Google account you use for Claude Code
3. Left sidebar → **Settings** → **Limits**
4. Set **Monthly cost limit**: $50
5. Set **Monthly token limits**: leave default
6. Go to **API keys** in left sidebar
7. **Create Key**, name it `peakpost-agent`, workspace = Default
8. Copy the `sk-ant-…` value
9. **Paste into `.env`:**
   ```
   ANTHROPIC_API_KEY=<paste-sk-ant-key-here>
   ```

### Step 3 — OpenAI API key + spend cap (5 min)

For MCC Pro weekly digest generation (~$0.50/mo).

1. Go to https://platform.openai.com
2. Sign in with Google
3. Top-right profile → **Settings** → **Billing** → set **Hard limit** = $10/mo
4. Left sidebar → **API keys** → **Create new secret key**
5. Name: `peakpost-mcc-digest`
6. Permissions: **Restricted**, with `model.request: Write` only
7. Copy the `sk-…` value
8. **Paste into `.env`:**
   ```
   OPENAI_API_KEY=<paste-sk-openai-key-here>
   ```

### Step 4 — Buy `peakpost.com` + Resend domain verification (45 min)

This is the longest step — DNS propagation eats most of the time. Start it early; do other steps while waiting.

**4a. Buy the domain at Cloudflare (10 min)**

1. https://dash.cloudflare.com — sign up if you don't have an account (Google sign-in works)
2. Top of dashboard → **Add a site** OR go to **Domain Registration** → **Register**
3. Search `peakpost.com` — if available, ~$10.44/yr at cost (Cloudflare doesn't mark up domains)
4. If `peakpost.com` is taken, try: `peakpost.dev`, `peakpost.io`, `peakpost.tools`, `peakpostagent.com`
5. Purchase. Domain is live immediately under Cloudflare DNS.

**4b. Resend signup + add domain (10 min)**

1. https://resend.com → **Get started free** (top right)
2. Sign up with Google (use `peakpostagent@gmail.com`)
3. After login: left sidebar → **Domains** → **Add Domain**
4. Enter `peakpost.com` (or whatever you bought)
5. Region: **us-east-1** (closest to Canada for low latency)
6. Resend shows you 3-4 DNS records — keep this tab open

**4c. Paste DNS records into Cloudflare (5 min + DNS propagation)**

1. New tab → Cloudflare dashboard → click your domain → **DNS** → **Records**
2. For EACH record Resend shows you, click **Add record**:
   - **MX record:**
     - Type: MX
     - Name: `send` (or whatever Resend shows — DON'T add the full domain, just the subdomain)
     - Priority: 10
     - Mail server: `feedback-smtp.us-east-1.amazonses.com`
     - TTL: Auto
   - **TXT (SPF):**
     - Type: TXT
     - Name: `send`
     - Content: `v=spf1 include:amazonses.com ~all`
   - **TXT (DKIM)** — long public key:
     - Type: TXT
     - Name: `resend._domainkey`
     - Content: paste the long `p=...` value Resend shows
3. **Important:** make sure **Proxy status is grey (DNS only)** for all 3 records — orange-cloud proxying breaks email DNS
4. Wait ~5-15 min, refresh Resend's Domains page → status should flip to **Verified** (green)
5. If still red after 30 min, mxtoolbox.com to check propagation

**4d. Resend API key (5 min)**

1. Back in Resend → **API Keys** → **Create API Key**
2. Name: `peakpost-agent-production`
3. Permission: **Sending access** (scoped to your verified domain)
4. Copy the `re_…` value
5. **Paste into `.env`:**
   ```
   RESEND_API_KEY=<paste-re-key-here>
   RESEND_FROM="Peak Post <noreply@peakpost.com>"
   ```

### Step 5 — Apify account + payout setup (10 min)

1. https://apify.com → **Get started** (top right)
2. Sign up with Google (use `peakpostagent@gmail.com`)
3. Free tier: $5 free credit, $500 dev bonus for 6 months, no credit card required
4. After login → top-right profile → **Account Settings** → **Integrations** → **API tokens** → **Create new token**
5. Name: `peakpost-claude-agent`
6. Copy the `apify_api_…` token
7. **Paste into `.env`:**
   ```
   APIFY_API_TOKEN=<paste-apify-token-here>
   ```
8. **For payouts** (skip if you want — only matters when you publish your first paid Actor):
   - Top-right profile → **Account Settings** → **Billing** → **Payouts**
   - Connect Stripe (one-click OAuth using your existing Stripe account)
   - Apify pays out monthly via Stripe Connect, takes 20% platform fee

### Step 6 — ntfy.sh push notifications (5 min)

You already have `colet-comfyui-pipeline` set up per project memory. Verify it still works:

1. Phone: open the ntfy app, confirm subscription to `colet-comfyui-pipeline` exists
2. Test: `curl -d "test from setup" ntfy.sh/colet-comfyui-pipeline` from any terminal
3. If the topic name needs to change to something less specific to ComfyUI, create a new topic like `peakpost-alerts` and tell me
4. **Paste into `.env`:**
   ```
   NTFY_TOPIC=colet-comfyui-pipeline
   ```

---

## P1 — Tomorrow daytime (60 min)

### Step 7 — GitHub Personal Access Token (5 min)

1. https://github.com → top-right avatar → **Settings**
2. Left sidebar bottom → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
3. **Generate new token**
4. Name: `peakpost-agent`
5. Expiration: **1 year**
6. Repository access: **All repositories** (or specifically your `digital-products` repo)
7. **Permissions** (under Repository permissions):
   - Contents: Read and write
   - Pages: Read and write
   - Workflows: Read and write
   - Pull requests: Read and write
   - Issues: Read and write
8. **Generate token**. Copy the `github_pat_…` value
9. **Paste into `.env`:**
   ```
   GITHUB_PAT=<paste-github-pat-here>
   ```

### Step 8 — Vercel CLI confirmed logged in (5 min)

Most of your existing setup is here, just verify:

1. Open terminal in `C:\Users\colet\Documents\Digital Product\Wokring Ideas\apis\mcc-insights`
2. Run `vercel whoami` — should return your account email
3. If not logged in: `vercel login` → choose Google → confirm in browser
4. Run `vercel link` (if not already linked to a Vercel project)
5. No env var needed — Vercel CLI manages its own auth

### Step 9 — Polar.sh account (10 min)

For future digital-product checkout (replaces Gumroad which has no product-creation API).

1. https://polar.sh → **Get Started** (top right)
2. Sign up with Google → optional GitHub connect
3. After login, you're in an org dashboard. Create products later — for now just generate an API key:
4. Top-right org switcher → **Organization Settings** → **Developers** → **Personal Access Tokens** → **New Token**
5. Name: `peakpost-agent`, scopes: `products:write`, `subscriptions:write`, `checkouts:write`, `customers:write`
6. Copy the `polar_oat_…` value
7. **Paste into `.env`:**
   ```
   POLAR_API_KEY=<paste-polar-oat-here>
   ```

### Step 10 — Beehiiv newsletter (15 min)

1. https://beehiiv.com → **Start for free**
2. Sign up with Google
3. Create your publication:
   - Name: **Peak Post** (or whatever brand you want — `Dev Tools Weekly`, `Browser Insider`, etc. — tell me what you pick)
   - URL: `peakpost.beehiiv.com` (you can add a custom domain later)
   - Niche: **Tech / Software**
4. Skip the initial content prompts — Claude will generate Issue 0
5. After landing on dashboard → top-right gear → **Integrations** → **API** → **Create API Key**
6. Name: `peakpost-agent`, permissions: `publications:read`, `posts:write`, `subscriptions:write`
7. Copy the API key
8. Also grab the publication ID (visible in URL or under Settings → Publication → ID)
9. **Paste into `.env`:**
   ```
   BEEHIIV_API_KEY=bv_xxxxxxxxxxxxxxxxxxxxxxxx
   BEEHIIV_PUB_ID=pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### Step 11 — Sentry error tracking (10 min)

1. https://sentry.io/welcome → **Get started**
2. Sign up with Google
3. Create organization: **peakpost**
4. Create first project: **mcc-insights** → Platform: **Node.js**
5. Sentry shows you the DSN string — copy it
6. **Paste into `.env`:**
   ```
   SENTRY_DSN_MCC_INSIGHTS=<paste-sentry-dsn-here>
   ```
7. Repeat **Create project** for: `agent-runner`, `alerts`, `health` — paste each DSN as a separate env var prefixed `SENTRY_DSN_<NAME>`

### Step 12 — PostHog analytics (15 min)

1. https://posthog.com → **Get started for free**
2. Sign up with Google
3. Region: **US Cloud** (faster from North America)
4. Skip onboarding survey — pick "I'm a solo developer"
5. Skip product analytics tutorial — go to **Project Settings** → **Project API Key**
6. Copy the `phc_…` value
7. **Paste into `.env`:**
   ```
   POSTHOG_API_KEY=<paste-phc-key-here>
   POSTHOG_HOST=https://us.i.posthog.com
   ```

---

## P2 — Weekend or whenever (60 min)

### Step 13 — Telegram Bot via @BotFather (5 min)

1. Telegram app → search `@BotFather` → start chat
2. Send `/newbot`
3. Bot name: **Peak Post Tools**
4. Username: `peakpost_tools_bot` (must end in `_bot`)
5. BotFather replies with a token like `7XXXXXXXXX:AAH...`
6. Also send `/mybots` → select your bot → **Bot Settings** → **Mini App** → **Enable**
7. **Paste into `.env`:**
   ```
   TELEGRAM_BOT_TOKEN=<paste-bot-token-here>
   ```

### Step 14 — Discord webhook for alerts (5 min)

1. Discord app → **+** in server list → **Create My Own** → name **Peak Post Ops**
2. In the server → channel `#general` → right-click → **Edit Channel** → **Integrations** → **Webhooks** → **New Webhook**
3. Name: `alerts-bot`
4. **Copy Webhook URL**
5. **Paste into `.env`:**
   ```
   DISCORD_ALERTS_WEBHOOK=<paste-discord-webhook-url-here>
   ```

### Step 15 — Google Search Console for pSEO domain (10 min)

Only do this AFTER step 4 (domain bought) AND after Claude scaffolds the pSEO site (day 4 of the build plan).

1. https://search.google.com/search-console
2. **Add property** → **Domain** type
3. Enter your domain
4. Verify via DNS TXT record (Google shows you the record; paste into Cloudflare DNS)
5. Verify
6. No env var needed — verification is just for ownership

### Step 16 — ONE CWS upload session (30-40 min)

Bundle all pending CWS uploads in one session. After this, no more CWS uploads.

Open these zips in CWS Developer Dashboard (https://chrome.google.com/webstore/devconsole/), each as a "new version" of the existing item:

1. **Security Headers v1.3.0** — file: `extensions/security-headers/security-headers.zip`
   - "What's new" text: in the `NEXT-VERSION.md` file in that dir
2. **Meeting Cost Calculator v1.2.0** — file: `extensions/meeting-cost-calculator/meeting-cost-calculator.zip`
   - SDK already vendored, paywall already fixed
3. **Meta Tag Viewer v1.0.1** — file: `extensions/meta-tag-viewer/meta-tag-viewer.zip`
   - SUBMISSION-TEXT.md has paste-ready content + the privacy-policy mismatch is fixed
4. **Console Catcher v1.0.3** — file: `extensions/console-catcher/console-catcher.zip`
   - SUBMISSION-TEXT.md has paste-ready content
5. **Z-Index Inspector v1.0.0** — file: TBD if exists, may need a build first

For each: upload zip → wait for validation → paste SUBMISSION-TEXT.md content into the appropriate fields → click Submit for review.

Also do the cleanup pass:
6. **Delete zero-user extensions** (free CWS slots): Read Cost, API Echo, Tab Brake, Regex Tester, Web Vitals Lite, Job Match Score — anything at — or 0 users for 60+ days

---

## What your `.env` should look like when you're done

```bash
# C:\Users\colet\.env
# Paste each key as you collect it. NEVER commit this file.

# ===== P0 — Required for autonomous business =====
STRIPE_SECRET_KEY=<paste-rk_live-key-here>
ANTHROPIC_API_KEY=<paste-sk-ant-key-here>
OPENAI_API_KEY=<paste-sk-openai-key-here>
RESEND_API_KEY=<paste-re-key-here>
RESEND_FROM="Peak Post <noreply@peakpost.com>"
APIFY_API_TOKEN=<paste-apify-token-here>
NTFY_TOPIC=colet-comfyui-pipeline

# ===== P1 — Distribution + observability =====
GITHUB_PAT=<paste-github-pat-here>
POLAR_API_KEY=<paste-polar-oat-here>
BEEHIIV_API_KEY=<paste-bv-key-here>
BEEHIIV_PUB_ID=<paste-pub-id-here>
SENTRY_DSN_MCC_INSIGHTS=https://...
SENTRY_DSN_AGENT_RUNNER=https://...
SENTRY_DSN_ALERTS=https://...
SENTRY_DSN_HEALTH=https://...
POSTHOG_API_KEY=<paste-phc-key-here>
POSTHOG_HOST=https://us.i.posthog.com

# ===== P2 — Nice to have =====
TELEGRAM_BOT_TOKEN=<paste-bot-token-here>
DISCORD_ALERTS_WEBHOOK=<paste-discord-webhook-url-here>
```

When `.env` is populated and you say "ready", I'll:
1. Confirm all values are valid (try a no-op API call per key)
2. Deploy `mcc-insights` to Vercel with the new env vars
3. Install all the MCPs into your Claude Code
4. Start the Day 1 work from the autonomous business plan

---

## What I'll have already done by morning (no action from you needed)

- Pre-staged `.env.example` template (so you can copy structure)
- Pre-staged session-start hook to load `.env` into every Claude session
- Pre-staged `apis/alerts/` skeleton (env-var-driven, fails gracefully when not configured)
- Pre-staged `apis/health/` skeleton (15-min cron)
- Pre-staged `.mcp.json` with all the MCPs to install
- Updated `CLAUDE.md` and memory with the new direction
- Committed and pushed everything to GitHub

---

## If you hit any blockers

1. Take a screenshot or copy the error text
2. Tell me in chat — I'll either fix it in the walkthrough or debug live
3. Don't skip steps — every env var has a downstream dependency

**The single biggest risk:** DNS propagation in step 4. If after 30 min the Resend domain still shows red, paste the records again — Cloudflare's "Proxy: DNS only" toggle is the most common gotcha.

---

## Cost summary

Monthly run cost with the full stack on free tiers + low usage:
- Stripe: per-transaction only ($0/mo until you take real money)
- Anthropic: capped at $50/mo
- OpenAI: capped at $10/mo
- Resend: free up to 3,000 emails/mo
- Apify: free up to $5/mo compute, $500 dev bonus
- Vercel: free Hobby
- Cloudflare domain: ~$10/yr ≈ $0.83/mo
- Polar: per-transaction only
- Beehiiv: free up to 2,500 subs
- Sentry: free up to 5K errors/mo
- PostHog: free up to 1M events/mo
- GitHub: free
- Telegram Bot: free
- ntfy: free

**Expected month 1 cost: ~$5-15 all-in.** Anthropic + OpenAI both have hard caps so a runaway loop can't burn the budget.
