# MCC Insights — Deploy Guide

The Vercel backend for Meeting Cost Calculator Pro's weekly digest email. Stand-alone service; nothing else in the portfolio depends on it. Deploy ahead of the CWS v1.2.0 extension resubmit so the extension's "opt into weekly email" flow has a live endpoint to hit.

**Reading order:** do the prerequisites section first, then deploy, then smoke-test. Cron schedule is `0 9 * * 1` (Mondays 09:00 UTC = Mondays 05:00 EDT / 04:00 EST).

---

## Prerequisites (do once)

### 1. OpenAI account
- Create API key at https://platform.openai.com/api-keys
- **Set $10/month spend cap** at https://platform.openai.com/account/limits — non-negotiable safety rail. Cost target is $0.00017/user/week per `LAUNCH-CHECKLIST.md:68`; 500 users × 52 weeks = ~$4.50/year. The $10 cap is 20× buffer.

### 2. Resend account
See `RESEND-SETUP.md` in this folder for the complete DKIM + MX verification flow. Summary:
- Sign up at https://resend.com — free tier includes 3,000 emails/month + 100/day
- Verify the sending domain (`peakpost.com` or whichever domain you own) — add MX + DKIM + SPF records at the DNS host
- Create an API key scoped to `emails:send`
- `RESEND_FROM` must be an address on the verified domain

### 3. Vercel account
- Sign up at https://vercel.com and connect your GitHub
- Install Vercel CLI: `npm i -g vercel`
- Authenticate: `vercel login`

### 4. Vercel KV add-on
- Inside the `mcc-insights` project on the Vercel dashboard: Storage tab → Create Database → KV (Redis)
- Auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars for you

### 5. Generate the two shared secrets yourself
Run these locally and save the output — you'll paste them into Vercel in the next section.

```powershell
# Windows PowerShell
$cron = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | % { [char]$_ })
$unsub = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | % { [char]$_ })
Write-Host "CRON_SECRET=$cron"
Write-Host "UNSUBSCRIBE_SECRET=$unsub"
```

```bash
# Git Bash / WSL
openssl rand -hex 20  # CRON_SECRET
openssl rand -hex 20  # UNSUBSCRIBE_SECRET
```

---

## First-time deploy

### Step 1 — Link the Vercel project
```bash
cd apis/mcc-insights
npm install          # installs @vercel/kv + vitest
vercel link          # interactive: link to a new project named "mcc-insights"
```

### Step 2 — Add all 9 environment variables
Via dashboard (easier) at Settings → Environment Variables for each, or via CLI:

```bash
vercel env add OPENAI_API_KEY production       # paste sk-... from Step 1 of prereqs
vercel env add RESEND_API_KEY production       # paste re_... from Resend
vercel env add RESEND_FROM production          # e.g. "MCC Pro <noreply@peakpost.com>"
vercel env add CRON_SECRET production          # paste the random string from prereq 5
vercel env add UNSUBSCRIBE_SECRET production   # paste the other random string
vercel env add PUBLIC_BASE_URL production      # https://mcc-insights.vercel.app (or your custom domain)
# KV_REST_API_URL and KV_REST_API_TOKEN are auto-injected when the KV add-on is linked.
```

Optionally add a `preview` set with test keys (OpenAI test key, Resend test mode) so `vercel dev` works locally without burning prod quota.

### Step 3 — Ship it
```bash
vercel --prod
```

Deploy takes ~30 seconds. Note the production URL (`https://mcc-insights-xyz.vercel.app`) — you'll need it for the extension's `BACKEND_URL` constant next.

### Step 4 — Wire the extension
Edit `C:\Users\colet\Documents\Digital Product\Wokring Ideas\extensions\meeting-cost-calculator\src\background\service-worker.js` line 398:
```js
const BACKEND_URL = 'https://mcc-insights-xyz.vercel.app/api/register';
```

Then rebuild the zip:
```powershell
cd C:\Users\colet\Documents\Digital Product\Wokring Ideas\extensions\meeting-cost-calculator
powershell -ExecutionPolicy Bypass -File build-zip.ps1
```

The new zip is the one that goes to CWS.

---

## Smoke tests (run after every deploy)

Replace `$URL` with your actual deploy URL and `$CRON_SECRET` with the secret you set.

### 1. `register` — happy path
```bash
curl -X POST "$URL/api/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","optIn":true,"currency":"USD","weekStats":{"totalMeetings":5,"totalCost":350,"avgCost":70,"valuablePercent":60,"prevTotalCost":420,"prevTotalMeetings":7,"weekKey":"week-of-2026-04-13"}}'
```
Expected: `{"ok":true,"action":"registered","subscriber":{...}}`. Any 400/500 means the backend has a problem.

### 2. `register` — invalid email
```bash
curl -X POST "$URL/api/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","optIn":true}'
```
Expected: `400 {"error":"Valid email required"}`.

### 3. `benchmark` — read-only sanity
```bash
curl "$URL/api/benchmark"
```
Expected: `{"ok":true,"totalMeetings":..., "lastUpdated":"..."}`.

### 4. `weekly-digest` — manual trigger (the important one)
```bash
curl -X POST "$URL/api/cron/weekly-digest" \
  -H "Authorization: Bearer $CRON_SECRET"
```
Expected: `{"ok":true,"total":1,"sent":1,"skipped":0,"errors":0}` — and a real email arrives at the registered address within 10 seconds. This validates the OpenAI + Resend + KV chain end-to-end.

### 5. `weekly-digest` — auth rejection
```bash
curl -X POST "$URL/api/cron/weekly-digest" -H "Authorization: Bearer wrong"
```
Expected: `401 {"error":"Unauthorized"}`. If this returns 200, CRON_SECRET is misconfigured and the endpoint is publicly exposed — rollback immediately.

### 6. `unsubscribe` — happy path
```bash
# Token is computed by the cron when sending — check the "Unsubscribe" link in the email you got in step 4
curl "$URL/api/unsubscribe?email=your-email@example.com&token=..."
```
Expected: HTML confirmation page. Then re-run step 1 to verify re-subscribe works.

---

## Rollback

Vercel keeps previous deploys indefinitely. If a new deploy breaks production:
```bash
vercel rollback  # interactive — pick the previous good deploy
```

Takes ~5 seconds. No data loss (KV is separate).

---

## Local development

### `vercel dev` — runs the actual Vercel runtime locally
```bash
cd apis/mcc-insights
vercel dev
# serves on http://localhost:3000 with hot-reload
```

### `node render-email-test.js` — previews the weekly-digest email without sending
```bash
cd apis/mcc-insights
node render-email-test.js
# writes preview.html — open it in a browser
# pass --meetings N --cost X --week "label" --currency USD to customize
```

If `OPENAI_API_KEY` is set in your shell, it uses the real LLM; otherwise uses a canned stub (useful for copy review).

---

## Cost monitoring

Three dashboards to check weekly for the first month:
- **OpenAI** usage at https://platform.openai.com/usage — watch for outliers
- **Resend** deliveries at https://resend.com/emails — watch for bounces and spam complaints
- **Vercel** function invocations at https://vercel.com/[you]/mcc-insights/analytics — sanity-check the cron runs and nothing else

Per-subscriber target: **$0.02 / user / week all-in**. If you see >$0.10 you either have a loop bug or a prompt that's generating way too many tokens — roll back the last LLM change.

---

## Known gotchas

1. **Hobby plan cron has a 60-second function timeout.** `vercel.json` sets `maxDuration: 300` which is valid but capped at 60s on Hobby. At 500 subscribers × 2s each that's the cap. If Pro subscriber count crosses 30, upgrade to Vercel Pro plan before the first full-run hits it.
2. **Resend free tier = 100/day limit.** Not an issue until > 100 Pro subs. Upgrade before that.
3. **OpenAI API keys with no spend cap have no safety net.** The $10/month cap in prereq step 1 is load-bearing.
4. **KV migration from `subscriberIndex` array → `subscribers` Set** — there's no existing data to migrate (this is the first production deploy). If somehow there's dev data in KV already, scrap it: `kv.del('subscriberIndex')` before running the cron.
