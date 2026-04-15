# Meeting Cost Calculator — Pro Tier Setup (v1.2.0)

This guide walks through wiring up the Pro tier after installing v1.2.0. Until these steps are complete, the extension runs in pure free-tier mode and Pro features stay locked.

## Overview

The Pro tier has two halves:

1. **In-extension billing** — handled entirely by [ExtensionPay](https://extensionpay.com). You never see a credit card.
2. **Weekly insights backend** — a separate Vercel project at `/apis/mcc-insights/` that sends Monday emails.

You can ship the extension with ONLY the ExtensionPay half live (no backend). Users get every Pro feature except the weekly email. The backend can be deployed later.

---

## Part 1 — ExtensionPay setup (required)

### 1. Create an ExtensionPay account
- Go to https://extensionpay.com and sign up.
- You'll need the extension's Chrome Web Store ID and the user-facing name.

### 2. Create a product on ExtensionPay
- Dashboard -> New Extension
- Name: `meeting-cost-calculator` (must match `EXTPAY_EXTENSION_ID` in `src/lib/extpay.js`)
- Add two subscription plans:
  - **Monthly**: $4.99 / month
  - **Annual**: $39 / year
- Add a **14-day free trial** on both plans.

### 3. Vendor the ExtensionPay SDK
ExtensionPay requires their official `ExtPay.js` file inside the extension. Download it from their docs and save as:

```
extensions/meeting-cost-calculator/src/lib/extpay-sdk.js
```

Do **not** rename it — the service worker imports it as `../lib/extpay-sdk.js`.

### 4. Confirm the wrapper matches your product
Open `src/lib/extpay.js` and verify:
- `EXTPAY_EXTENSION_ID` matches the name you registered (step 2).
- `PRO_ENABLED` is `true` (default).
- `TRIAL_DAYS` matches the trial you set on ExtensionPay.

### 5. Load-unpacked test
- Load the unpacked extension in Chrome.
- Open the popup: the upgrade banner should appear.
- Click **Start 14-day free trial** — this should open ExtensionPay's hosted trial page.
- Complete the trial signup; the popup should now show **PRO** in the header.

### 6. Web Store submission
- Zip the `src/` folder using `npm run zip` (or `extensions/meeting-cost-calculator/meeting-cost-calculator.zip`).
- Upload to the Chrome Web Store dashboard under **Package -> Upload new package**.
- In the privacy disclosures, declare: "This extension uses ExtensionPay (https://extensionpay.com) for subscription management. Payment data is handled entirely by ExtensionPay and never touches our servers."

---

## Part 2 — Insights backend (optional, enables weekly email)

### 1. Deploy the Vercel project
```bash
cd apis/mcc-insights
npm install
vercel link       # create new project
vercel env add OPENAI_API_KEY
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM
vercel env add CRON_SECRET          # openssl rand -hex 32
vercel env add UNSUBSCRIBE_SECRET   # openssl rand -hex 32
vercel env add PUBLIC_BASE_URL      # e.g. https://mcc-insights.vercel.app
```

### 2. Add the Vercel KV integration
From the Vercel dashboard for this project, go to **Storage -> Create Database -> KV**. Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.

### 3. Set up Resend
- Sign up at https://resend.com.
- Verify your sending domain (you need an MX record + DKIM).
- Copy the API key into `RESEND_API_KEY`.
- Update `RESEND_FROM` to match your verified domain.

### 4. Deploy
```bash
vercel --prod
```
Note the production URL, e.g. `https://mcc-insights.vercel.app`.

### 5. Wire the extension to the backend
Edit `src/background/service-worker.js` and set:

```js
const BACKEND_URL = 'https://mcc-insights.vercel.app/api/register';
```

(It's intentionally empty on first install — the extension stays functional without the backend.)

Rebuild the zip and re-upload to the Chrome Web Store.

### 6. Verify the cron
- Vercel cron fires the first Monday 09:00 UTC after deployment.
- Manually trigger: `curl -H "Authorization: Bearer $CRON_SECRET" https://mcc-insights.vercel.app/api/cron/weekly-digest`
- You should see a JSON response with `sent`, `skipped`, `errors` counts.

---

## File map

| Path | Purpose |
| --- | --- |
| `src/lib/extpay.js` | Thin wrapper around ExtensionPay SDK |
| `src/lib/extpay-sdk.js` | **You add this** — vendored official SDK |
| `src/lib/pro-features.js` | CSV export, ROI calc, rate profiles, benchmarks |
| `src/background/service-worker.js` | Pro status cache, cleanup, message routing |
| `src/popup/popup.html` | Pro CTAs + locked/unlocked sections |
| `src/popup/popup.js` | `isPaid()` gate + all Pro feature handlers |
| `apis/mcc-insights/api/register.js` | Sub opt-in endpoint |
| `apis/mcc-insights/api/unsubscribe.js` | One-click unsubscribe |
| `apis/mcc-insights/api/cron/weekly-digest.js` | Weekly email batch job |

---

## Troubleshooting

- **Pro features stay locked after payment.** The SDK caches for ~10 minutes. Close and reopen the popup, or wait for the 6-hour `mcc-pro-refresh` alarm.
- **ExtensionPay SDK not loaded.** Check `src/lib/extpay-sdk.js` exists. The service worker logs `[MCC Pro] ExtensionPay SDK not loaded` when missing.
- **Email not arriving.** Check Resend dashboard for delivery status. Verify the sending domain's DNS records.
- **Cron skipped all subscribers.** The cron respects a 6-day minimum interval to prevent double-sends. Check each subscriber's `lastSentAt` in Vercel KV.
