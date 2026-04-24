# Meeting Cost Calculator Pro — Launch Checklist

Stepped checklist for pushing v1.2.0 Pro tier from "works on my machine" to "generating MRR". Work top-to-bottom; nothing below a checkbox will work until the box is ticked.

## ExtensionPay prerequisites (external)

- [x] ExtensionPay account created with product `meeting-cost-calculator` (matches `EXTPAY_EXTENSION_ID` in `src/lib/extpay.js:19`)
- [x] Plans configured: USD $4.99 Monthly + USD $39 Yearly (2026-04-21)
- [x] Stripe account connected (2026-04-21)
- [ ] Stripe account ACTIVATED — real business info, bank account for payouts, identity verification. Without this, users can test-pay but real-pay is blocked.
- [ ] All payment methods enabled in Stripe Settings → Payment methods (Apple Pay, Google Pay, Link, etc.)
- [ ] Free trial configured on ExtensionPay's "Free trial user dashboard" page (14 days). If NOT enabled, set `TRIAL_ENABLED = false` in `src/lib/extpay.js` (current default; banner hides the "Start free trial" CTA).

## Pre-launch (extension side)

- [x] `src/lib/extpay-sdk.js` is vendored — ExtPay 3.1.1 (commit 42b6b00). Meets the v3.1+ requirement for multi-plan support.
- [x] `EXTPAY_EXTENSION_ID` in `src/lib/extpay.js` matches the ExtensionPay dashboard product name (`meeting-cost-calculator`).
- [x] `meeting-cost-calculator.zip` rebuilt via `powershell -ExecutionPolicy Bypass -File build-zip.ps1` (86.7 KB, 14 files, manifest v1.2.0).
- [ ] Load the unpacked extension. Free tier works exactly like v1.1.0 for a non-paid user.
- [ ] Banner price line shows BOTH "$4.99/mo" and "or $39/yr (save 35%)" (paywall fix commit 467a954)
- [ ] Banner "Upgrade now" opens ExtensionPay's payment page. (Note: "Start free trial" CTA is hidden while `TRIAL_ENABLED=false` — enable only after confirming trial is configured on ExtensionPay.)
- [ ] After a Stripe-test-card purchase (`4242 4242 4242 4242`, any future expiry, any CVC), the PRO badge appears in the header within 60 seconds.
- [ ] Each locked section swaps to its unlocked UI after the purchase.
- [ ] Click each Pro feature and smoke-test:
  - [ ] ROI calculator: every combination of flags returns a sensible recommendation.
  - [ ] Rate profiles: add/edit/delete persists across popup close.
  - [ ] Insights email: valid email saves; invalid email shows error.
  - [ ] CSV export: downloads a file that opens cleanly in Excel / Numbers / Sheets.
  - [ ] Dashboard shows YoY projection and benchmark when meetings exist.
- [ ] `12-week chart` renders for Pro users; `4-week chart` for free.
- [ ] Downgrade test: cancel the ExtensionPay subscription. Within 6 hours the Pro sections re-lock.
- [ ] Console is clean (no errors) on all pages.

## Pre-launch (backend side)

**Detailed walkthrough:** `../../apis/mcc-insights/DEPLOY.md` and `../../apis/mcc-insights/RESEND-SETUP.md`.

- [x] Backend code security-hardened (commits 77a3f03, c496d9c, d12b66e). Cron fails-closed in production, prompt injection sanitized, race condition fixed, vercel.json modernized.
- [x] `apis/mcc-insights/package.json` declares `@vercel/kv` + Node 20.x engine (commit d12b66e).
- [ ] `vercel` CLI authenticated, project linked (`cd apis/mcc-insights && vercel link`).
- [ ] Vercel KV database created and linked (dashboard Storage tab).
- [ ] Environment variables set in Vercel dashboard (see `DEPLOY.md` prereq 5 for secret generation):
  - [ ] `OPENAI_API_KEY`
  - [ ] `RESEND_API_KEY`, `RESEND_FROM`
  - [ ] `CRON_SECRET`, `UNSUBSCRIBE_SECRET`
  - [ ] `PUBLIC_BASE_URL`
  - [ ] `KV_REST_API_URL`, `KV_REST_API_TOKEN` (auto-injected by KV integration)
- [ ] Resend sending domain verified (MX + DKIM + SPF records live per `RESEND-SETUP.md`).
- [ ] `vercel --prod` deploy succeeded.
- [ ] Smoke tests 1-6 from `DEPLOY.md` all pass.
- [ ] Cron auth rejection test (smoke test 5) returns 401 — NOT 200 (would mean public endpoint).
- [ ] Backend URL added to `src/background/service-worker.js:398` `BACKEND_URL` and extension rebuilt.
- [ ] OpenAI spending limit set to $10/month on the account billing page.

## CWS submission

**Paste-ready submission text:** `./SUBMISSION-TEXT.md` (permissions, description, privacy policy paragraph, release notes — all drafted, copy-paste into CWS dashboard).

- [ ] `store-listing/screenshots/` updated with 1-2 Pro screenshots (upgrade banner + unlocked dashboard).
- [x] Description text drafted (see `SUBMISSION-TEXT.md`)
- [x] Permissions justification drafted (see `SUBMISSION-TEXT.md`)
- [x] Privacy policy paragraph drafted (see `SUBMISSION-TEXT.md`) — still needs to be applied to `store-listing/privacy-policy.html`
- [x] `meeting-cost-calculator.zip` regenerated (86.7 KB, 14 files) — re-run `build-zip.ps1` after any src/ change
- [ ] Privacy policy HTML updated with the drafted paragraph about Pro weekly-email data flow
- [ ] Description + permissions justifications + release notes pasted into CWS dashboard
- [x] New version (1.2.0) uploaded and submitted for review (2026-04-23)

## Day-of-launch

- [ ] Monitor Chrome Web Store reviews hourly for first 24 hours.
- [ ] Monitor Resend dashboard for bounces/spam complaints.
- [ ] Monitor OpenAI usage dashboard daily for the first week.
- [ ] Monitor ExtensionPay dashboard for conversions.
- [ ] Post a changelog / "what's new" modal (optional, stays out of scope for v1.2.0).

## Post-launch tracking (weekly)

- [ ] Number of installs week-over-week.
- [ ] Number of Pro trial starts.
- [ ] Number of paid conversions.
- [ ] Cancellation reasons (from ExtensionPay exit survey).
- [ ] OpenAI cost per Pro user per week (target: < $0.02).

## Quick safety checks

- [ ] Free tier still functions offline (no network required for the Free experience).
- [ ] No Pro call paths (`fetch` to backend, `openPaymentPage`) fire for free users.
- [ ] `renderProUi()` runs exactly once on popup open (no infinite loops).
- [ ] `chrome.storage.local` never writes credit-card data (ExtensionPay handles all PCI).
- [ ] Unsubscribe works without the user being logged in.

## Nice-to-haves (post v1.2.0)

- Swap static benchmarks for live aggregates once >50 Pro subscribers exist.
- Add a "Compare to my team" view (requires Team Pro tier — separate SKU).
- Add PDF export via a client-side library (jsPDF, 60KB gzipped).
- Add a CrewAI-powered analysis mode for Enterprise ($29/mo) — see `/automation/crewai/`.
