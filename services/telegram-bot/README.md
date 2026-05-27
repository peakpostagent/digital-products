# Peak Post Telegram Bot

Persistent webhook listener for owner commands + alert forwarding. Runs on Railway (already on Hobby plan, $5/mo flat).

## Why Railway not Vercel

Telegram bots that use long-polling need a persistent process. Vercel's serverless model is awkward for this — you'd need to use webhook mode (requires HTTPS, signature verification, and adds latency).

Railway's container model is purpose-built for this kind of always-on service.

## What it does

- **/start** — captures your chat ID for the first time; once set in env, locks the bot to you
- **/status** — fetches health-check results from `apis/health/`
- **/help** — list commands
- **POST /alert** — receives alerts from `apis/alerts/` and forwards to the owner

## Required env vars (set in Railway dashboard)

```
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_OWNER_CHAT_ID=<your chat ID — get it after first /start>
ALERT_SECRET=<long random string, also set in apis/alerts/ to allow this bot to receive>
HEALTH_URL=https://peakpost-health.vercel.app/   # optional, defaults to this
```

## Deploy to Railway

```bash
cd services/telegram-bot
railway login                       # one-time
railway init                        # link to a Railway project
railway variables set TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
railway variables set ALERT_SECRET=$(openssl rand -hex 20)
railway up
```

Then send `/start` to your bot in Telegram → it replies with your chat ID → paste into Railway env as `TELEGRAM_OWNER_CHAT_ID` → bot redeploys and locks to you.

## Future: Telegram Mini App + Stars billing

Stage 2 of channel #3 in the autonomous business plan. One of the Apify Actors gets a Telegram-native UI (input box + result display inside Telegram chat) with Stars billing for premium tier. Targets the "untapped indie window" the research called out — Western devs aren't shipping Mini Apps, so there's organic-discovery oxygen here that Vercel/Stripe-only competitors can't reach.

Not implemented in v0.1.0 — placeholder for the dedicated build week.
