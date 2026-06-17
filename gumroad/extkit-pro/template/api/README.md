# ExtKit Pro — Vercel Backend

The `/api/` folder is a complete Vercel-deployable backend for your paid Chrome extension. Two endpoints are pre-built:

| Endpoint | Purpose | Trigger |
|---|---|---|
| `POST /api/webhook` | Receive ExtensionPay events (payment, refund, trial) and update a subscriber index in Vercel KV | ExtensionPay webhook |
| `GET /api/digest-cron` | Send a weekly Pro-only digest email via Resend | Vercel Cron (Mon 09:00 UTC) |

## 5-minute setup

```bash
npm install -g vercel
vercel link
vercel env add EXTPAY_WEBHOOK_SECRET
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM
vercel deploy --prod
```

Then in the **ExtensionPay dashboard**, point the webhook URL at:

```
https://<your-app>.vercel.app/api/webhook
```

## Why this matters

Most Chrome extension boilerplates stop at the popup. ExtKit Pro ships you the entire **backend** that makes paid subscriptions actually work:

- ✅ Webhook signature verification (HMAC-SHA256 with timing-safe compare)
- ✅ Event deduplication (idempotent retries — ExtensionPay retries failed webhooks)
- ✅ Subscriber index in KV (query who's paid by email)
- ✅ Cron-driven weekly digest pattern (lift this for any paid-only feature)
- ✅ Per-user dedupe key on digest cron (multiple firings = one email)
- ✅ Graceful degradation when env vars missing (won't crash in CI)

## Adapted from

This backend pattern is identical to the one running [Meeting Cost Calculator Pro](https://chromewebstore.google.com/) — the kit author's flagship paid extension. It has handled 100% of paid traffic since deploy, no production incidents.

## Customizing the digest

The `digest-cron.js` template ships with a generic placeholder. For your extension:

1. Implement `loadRecipients()` — query your KV subscriber set for paid emails
2. Implement `renderDigestHtml({ name })` — your branded weekly summary
3. Adjust the `vercel.json` cron schedule to match your cadence

## vercel.json reference

```json
{
  "crons": [
    { "path": "/api/digest-cron", "schedule": "0 9 * * 1" }
  ]
}
```

## Why not Stripe directly?

You can wire Stripe directly, but you'll need:
- A separate API server (Chrome extensions can't keep secret keys)
- A login flow (Chrome extensions have no user identity)
- A refund/chargeback handler
- Tax handling (Stripe Tax is extra)

ExtensionPay bundles all four for a 7% flat fee. Most extension authors find that's a great trade-off until they hit $10K+ MRR. At that point, swap the webhook handler for Stripe directly — the subscriber KV layer stays the same.
