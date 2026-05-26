# apis/alerts/

Multi-channel alert fan-out service. Any Peak Post service can POST to this endpoint and the alert is routed to ntfy push notifications, a Discord webhook, and a Resend email — based on severity.

## Severity routing

| Severity | ntfy push | Discord | Email |
|---|---|---|---|
| P0 | ✓ (priority 5, urgent) | ✓ | ✓ |
| P1 | ✓ (priority 4) | ✓ | ✓ (best effort) |
| P2 | — | ✓ | — |

## Configure

Required env vars in Vercel:
- `NTFY_TOPIC` — your ntfy topic name (default `colet-comfyui-pipeline`)
- `DISCORD_ALERTS_WEBHOOK` — webhook URL from a Discord server channel
- `RESEND_API_KEY` — for email delivery
- `RESEND_FROM` — e.g. `"Peak Post <noreply@peakpost.com>"`
- `ALERT_EMAIL_TO` (optional) — defaults to the From address

If a channel's env var is missing, the alert silently skips that channel — so you can add channels incrementally.

## Call from any service

```js
await fetch('https://peakpost-alerts.vercel.app/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    severity: 'P0',                  // P0 | P1 | P2
    source: 'mcc-insights',          // short string, free-form
    subject: 'Cron job failed',
    body: 'Optional longer description.',
    url: 'https://vercel.com/.../deployments/...',
    dedupeKey: 'mcc-cron-2026-05-16',  // optional
  }),
});
```

## Deploy

```bash
cd apis/alerts
vercel link
vercel env add NTFY_TOPIC production
vercel env add DISCORD_ALERTS_WEBHOOK production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM production
vercel --prod
```

## Smoke test (after deploy)

```bash
curl -X POST https://peakpost-alerts.vercel.app/ \
  -H "Content-Type: application/json" \
  -d '{"severity":"P2","source":"test","subject":"Hello from setup"}'
```

Should return `{ ok: true, routed: { ... } }`. Check your Discord channel — message should appear within seconds.
