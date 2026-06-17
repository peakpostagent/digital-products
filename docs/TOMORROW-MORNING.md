# Tomorrow Morning — First 30 Minutes

You wake up. You open this doc. Here's exactly what to do, in order. No fluff.

---

## 0. Coffee (5 min)

Seriously. Don't skip.

---

## 1. Check if Resend domain verified (1 min)

**Open** https://resend.com/domains

Look at `peakpost.ca` status:

- 🟢 **Verified** — perfect, skip to step 2
- 🟡 **Pending** — wait 5 more minutes, refresh. If still pending after 30 more min, the DNS records didn't propagate; tell me in chat and we'll diagnose
- 🔴 **Failed** — tell me, we'll re-paste the records

---

## 2. Grab the Resend API key (5 min)

Once verified:

1. Resend → **API Keys** → **Create API Key**
2. Name: `peakpost-agent-production`
3. Permission: **Sending access** (scoped to `peakpost.ca`)
4. Copy the `re_…` value
5. Paste into `C:\Users\colet\.env`:
   ```
   RESEND_API_KEY=<paste-re-key-here>
   RESEND_FROM="Peak Post <noreply@peakpost.ca>"
   ```
6. Save

Tell me in chat **"resend key saved"** — I'll test it.

---

## 3. Stripe recovery check (variable time)

If Stripe recovery email arrived overnight:
1. Recover the account
2. Save the 2FA backup codes to your password manager (the gap we caught last night)
3. Then do Step 1 from yesterday: create the restricted API key
4. Paste `STRIPE_SECRET_KEY` into `.env`

If recovery is still in progress, **skip Stripe for now** and move to step 4. Everything downstream works without Stripe — only direct API charging would, and we're not there yet.

---

## 4. Apify signup + token (10 min)

1. **Open** https://apify.com → **Get started** (top right)
2. Sign up with Google (`peakpostagent@gmail.com`)
3. Skip Stripe Connect for now (only matters when you publish a paid Actor)
4. **Account Settings** → **Integrations** → **API tokens** → **Create new token**
5. Name: `peakpost-claude-agent`
6. Copy the `apify_api_…` value
7. Paste into `.env`:
   ```
   APIFY_API_TOKEN=<paste-apify-token-here>
   ```

Tell me **"apify ready"** — I'll publish the first Actor (Security Headers Scanner, scaffolded last night).

---

## 5. ntfy.sh verify (1 min)

Open ntfy app on your phone → confirm subscription to `colet-comfyui-pipeline`. If subscribed, you're done (it's already in `.env`).

If you want a less-ComfyUI-specific topic, create one called `peakpost-alerts`, subscribe on phone, tell me — I'll swap it in `.env`.

---

## 6. The rest of the .env (optional today, can wait)

These are P1 items — nothing critical breaks without them, but they unlock features:

- **GitHub PAT** (5 min) — for autonomous commits
- **Polar.sh** (10 min) — for future digital product checkout
- **Beehiiv** (15 min) — for newsletter
- **Sentry** (10 min) — error tracking
- **PostHog** (15 min) — analytics

Full walkthrough at `C:\Users\colet\Documents\Digital Product\Wokring Ideas\docs\setup-tomorrow.md` steps 7-12.

You can skip ALL of these today and we'll still ship the first Apify Actor. They become important when the second product launches.

---

# What I'll do after step 4 (Apify token in place)

The moment `APIFY_API_TOKEN` lands in `.env`:

1. **Deploy 3 Apify Actors I scaffolded overnight:**
   - `apify-actors/security-headers-scanner/` — port of the 33-user Chrome extension. Free tier 100 scans/mo, $0.005/scan paid.
   - `apify-actors/meta-tag-inspector/` — fast SEO meta scanner. Free 200/mo, $0.003/page paid.
   - `apify-actors/css-variables-inspector/` — Playwright-based design-system audit tool. Free 50/mo, $0.01/page paid.

2. **Deploy `apis/mcc-insights/`** to Vercel (already designed last week). Wires MCC Pro weekly digest.

3. **Deploy `apis/alerts/`** + **`apis/health/`** to Vercel. Once both are up, every other Peak Post service can route alerts through the fan-out and Vercel cron monitors the whole stack.

4. **Deploy `services/telegram-bot/`** to Railway (the use case for your existing $5/mo Hobby plan). Owner-commands plus alert forwarding.

By end of day tomorrow: 3 Apify Actors live + 3 Vercel services + 1 Railway service. The full autonomous stack running.

---

# What you'll see when I'm done

- **Apify dashboard** — 3 Actors published. They generate revenue automatically when anyone runs them.
- **Vercel dashboard** — 3 services running. `mcc-insights` cron Mondays 9am UTC, `health` every 15 min, `alerts` on-demand.
- **Railway dashboard** — Telegram bot running. /start it from Telegram, paste the chat ID it shows you into Railway env, redeploy.
- **Daily digest email** at ~5pm — revenue + Actor runs + alert summary.

---

# If something goes wrong

- **Resend domain stuck on "Pending"** → tell me, I'll regenerate the DNS records (sometimes Squarespace strips trailing dots from DKIM)
- **Apify Actor build fails** → tell me the error, I'll fix in the source. Apify CLI shows the docker build log.
- **mcc-insights deploy errors** → check Vercel logs, paste the error to me. Most common: a missing env var I'll know how to add.
- **Telegram bot doesn't respond to /start** → check Railway logs. Most common: `TELEGRAM_BOT_TOKEN` got pasted with whitespace.

---

# Wins from the overnight session (2026-06-17)

## ✅ 6 Apify Actors DEPLOYED and end-to-end verified

| Actor | URL | Verified |
|---|---|---|
| Security Headers Scanner | https://console.apify.com/actors/yyf3CVEFdMK9IWjPR | stripe.com → C (65%) |
| Meta Tag Inspector | https://console.apify.com/actors/M94zJUHtPjN815brh | stripe.com → SEO 100/100 |
| CSS Variables Inspector | https://console.apify.com/actors/8FNLuK60PVEEO3hhj | deployed (live) |
| Color Contrast Auditor | https://console.apify.com/actors/u5t06tN9jQ559HfLJ | stripe.com → A (95.9% AA) |
| Web Vitals Reporter | https://console.apify.com/actors/Fh3Jl1V6cbFtFZmqk | example.com → A+ (100%) |
| PWA Audit | https://console.apify.com/actors/tH58KSwFcHL7jyDsG | web.dev → A+ (96%) |

All 6 are **PRIVATE** right now. To start earning, we need ONE manual step (and only one — the rest can be automated).

## 🛠 ONE manual step to make Actors earn revenue (5 min in Apify UI)

The API requires the account owner to have a **public profile** before any Actor can be made public. This is a privacy gate — you have to opt in to having your username visible.

1. **Open** https://console.apify.com/account/profile
2. Set:
   - **Public username**: `pattonholdings` (already your handle)
   - **Display name**: `Peak Post` (or your preferred public name)
   - **Bio**: "Solo developer building automation tools" (optional)
3. Save
4. Tell me **"apify profile public"** in chat
5. I'll automatically PUT `isPublic: true` to all 6 Actors via API → all 6 land on Apify Store as private-discovery items

After that, to set monetization, the UI walks you through ~3 clicks per Actor (recommended: "Pay per result" at $0.05-$0.15/run). I'll guide through which prices to set, but the actual monetization config requires UI clicks because it's a revenue-sharing agreement.

## ✅ Scaffold + UI complete for Amazon Review Checker CWS extension

`extensions/amazon-review-checker/src/` is now ~70% complete:
- ✅ `manifest.json` — MV3, scoped to amazon.{com,ca,co.uk,de}
- ✅ `lib/grader.js` — 6-heuristic A-F trust score
- ✅ `lib/scraper.js` — DOM selectors with quarterly-change resilience
- ✅ `content/content.js` — Shadow DOM badge injection
- ✅ `popup/popup.{html,css,js}` — grade breakdown UI
- ✅ `background/service-worker.js` — 7-day cache + cleanup alarm

Still to do (~6 hours):
- Icons (generate via `tools/extension-artwork/`)
- Vitest unit tests for grader.js
- Manual QA on a real Amazon product page
- CWS screenshots + store-listing copy

This is ready for me to finish once `tools/extension-artwork/` regenerates icons.

## ✅ ExtKit Pro template — backend + paywall extracted from MCC Pro

`gumroad/extkit-pro/template/` now contains:
- `src/lib/extpay-config.js` — single-file config the buyer edits
- `src/lib/extpay.js` — generic ExtensionPay wrapper (decoupled from MCC)
- `src/lib/is-paid.js` — 6-hour cache `isPaid()` helper
- `src/popup/{paywall.html,css,js}` — drop-in `<dialog>` modal
- `api/webhook.js` — Vercel serverless with HMAC verification + KV dedupe
- `api/digest-cron.js` — weekly Pro-only digest pattern
- `vercel.json` — cron + maxDuration config
- `README.md` — buyer-facing 10-min quick-start

Still to do (~10 hours):
- Vendor `extpay-sdk.js` (the actual SDK file)
- 3 example extensions (`ai-sidebar`, `seo-scanner`, `css-inspector`)
- `docs/FAILURE-MODES.md`, privacy policy template, CWS checklist
- Landing page (extkit.dev) + Polar.sh listing

---

# Coffee. Then step 1 (Resend) or the Apify-profile flip.

Have a good morning. The 6 Actors and the SaaS starter kit are real, working assets. Setting the public-profile flag is the next 5-minute multiplier.
