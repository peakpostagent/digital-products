# Meeting Cost Calculator Pro — Launch Checklist

Stepped checklist for pushing v1.2.0 Pro tier from "works on my machine" to "generating MRR". Work top-to-bottom; nothing below a checkbox will work until the box is ticked.

## Pre-launch (extension side)

- [ ] `src/lib/extpay-sdk.js` is vendored (not a stub). See INSTALL.md step 1.3.
- [ ] `EXTPAY_EXTENSION_ID` in `src/lib/extpay.js` matches the ExtensionPay dashboard product name.
- [ ] Load the unpacked extension. Free tier works exactly like v1.1.0 for a non-paid user.
- [ ] Banner "Start 14-day free trial" opens ExtensionPay's hosted trial page.
- [ ] Banner "Upgrade now" opens ExtensionPay's payment page.
- [ ] After a test purchase (ExtensionPay test mode), the PRO badge appears in the header within 60 seconds.
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

- [ ] `vercel` CLI authenticated, project linked (`vercel link`).
- [ ] Environment variables set in Vercel dashboard:
  - [ ] `OPENAI_API_KEY`
  - [ ] `RESEND_API_KEY`, `RESEND_FROM`
  - [ ] `CRON_SECRET`, `UNSUBSCRIBE_SECRET`
  - [ ] `PUBLIC_BASE_URL`
  - [ ] `KV_REST_API_URL`, `KV_REST_API_TOKEN` (auto-injected by KV integration)
- [ ] Vercel KV database created and linked.
- [ ] Resend sending domain verified (MX + DKIM records live).
- [ ] `vercel --prod` deploy succeeded.
- [ ] `curl POST /api/register` with a test email returns `{ ok: true }` and appears in KV.
- [ ] Manual cron trigger with `Authorization: Bearer $CRON_SECRET` delivers a test email.
- [ ] Unsubscribe link removes the subscriber from KV and shows the confirmation page.
- [ ] Backend URL added to `src/background/service-worker.js` `BACKEND_URL` and extension rebuilt.
- [ ] OpenAI spending limit set to $10/month on the account billing page.

## CWS submission

- [ ] `store-listing/screenshots/` updated with 1-2 Pro screenshots (upgrade banner + unlocked dashboard).
- [ ] Description updated to mention Pro tier + pricing. Keep free tier prominent.
- [ ] Permissions justification updated:
  - `storage`: remember rate, meeting history, Pro preferences
  - `alarms`: daily data cleanup + 6-hour Pro status refresh
  - `host_permissions: extensionpay.com`: subscription management
- [ ] Privacy policy updated: explicitly mention that opting into the weekly email sends only aggregate weekly numbers (no meeting titles, no attendee info) to the backend + OpenAI.
- [ ] `meeting-cost-calculator.zip` regenerated from `src/` only.
- [ ] New version (1.2.0) uploaded and submitted for review.

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
