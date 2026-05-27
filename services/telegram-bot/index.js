// services/telegram-bot/index.js — Railway-hosted persistent Telegram bot
//
// Why Railway not Vercel: this is a persistent webhook listener that may
// also poll for offline messages. Vercel's serverless model is awkward for
// long-running listeners; Railway's persistent-container model is purpose-built.
//
// Responsibilities:
//   1. Listen for /commands from the bot's owner (just Coleman, for now)
//   2. Receive forwarded alerts from apis/alerts/ (P0/P1 severity)
//   3. Eventually: handle subscription via Telegram Stars billing for any
//      Mini App functionality
//
// Stage 1 (this file): minimal skeleton. /start, /status, /help commands.
//                     Alert forwarding endpoint.
// Stage 2 (week 2):    Telegram Mini App with Stars billing for one of the
//                     Apify Actors as a "Telegram-native" version.

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID; // Set after first /start
const PORT = parseInt(process.env.PORT || '3000', 10);

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not set. Exiting.');
  process.exit(1);
}

// Polling mode (simplest; webhook mode is nicer at scale but adds complexity)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Peak Post Telegram bot online.');

// ---------------------------------------------------------------------------
// Owner-only command guard
// ---------------------------------------------------------------------------

function isOwner(msg) {
  if (!OWNER_CHAT_ID) return true; // first /start sets the owner
  return String(msg.chat.id) === String(OWNER_CHAT_ID);
}

// ---------------------------------------------------------------------------
// /start — first time setup
// ---------------------------------------------------------------------------

bot.onText(/^\/start/, async (msg) => {
  if (!OWNER_CHAT_ID) {
    bot.sendMessage(msg.chat.id,
      `Hello — Peak Post bot online.\n\n` +
      `Your chat ID is: ${msg.chat.id}\n\n` +
      `Set this as TELEGRAM_OWNER_CHAT_ID in Railway's env vars to lock the ` +
      `bot to you. Until then, anyone who finds the bot can use it.`
    );
    return;
  }
  if (!isOwner(msg)) {
    bot.sendMessage(msg.chat.id, 'Sorry, this bot is private.');
    return;
  }
  bot.sendMessage(msg.chat.id,
    `Peak Post bot ready.\n\n` +
    `Commands:\n` +
    `/status — current revenue + extension stats\n` +
    `/health — last health-check result\n` +
    `/help — this message`
  );
});

// ---------------------------------------------------------------------------
// /status — fetch from health check endpoint
// ---------------------------------------------------------------------------

bot.onText(/^\/status/, async (msg) => {
  if (!isOwner(msg)) return;

  const healthUrl = process.env.HEALTH_URL || 'https://peakpost-health.vercel.app/';
  try {
    const r = await fetch(healthUrl);
    if (!r.ok) {
      bot.sendMessage(msg.chat.id, `Health endpoint returned HTTP ${r.status}`);
      return;
    }
    const data = await r.json();
    const lines = [`*Health check*`, `Last: ${data.timestamp}`, ''];
    for (const result of data.results || []) {
      const icon = result.status === 'ok' ? '✓' : result.status === 'skipped' ? '○' : '✗';
      lines.push(`${icon} ${result.check}${result.detail ? ' (' + result.detail + ')' : ''}`);
    }
    bot.sendMessage(msg.chat.id, lines.join('\n'), { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Could not fetch health: ${err.message}`);
  }
});

// ---------------------------------------------------------------------------
// /help
// ---------------------------------------------------------------------------

bot.onText(/^\/help/, (msg) => {
  if (!isOwner(msg)) return;
  bot.sendMessage(msg.chat.id,
    `*Peak Post bot*\n\n` +
    `/status — current revenue + extension stats\n` +
    `/health — last health-check result\n` +
    `/help — this message\n\n` +
    `Alerts from apis/alerts/ also flow here at P0/P1 severity.`,
    { parse_mode: 'Markdown' }
  );
});

// ---------------------------------------------------------------------------
// Inbound alert HTTP endpoint
//
// apis/alerts/ POSTs here when an alert needs to reach Telegram. We trust
// the source by an ALERT_SECRET header — simple shared-secret auth.
// ---------------------------------------------------------------------------

const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/alert') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const providedSecret = req.headers['x-alert-secret'];
        const expectedSecret = process.env.ALERT_SECRET;
        if (expectedSecret && providedSecret !== expectedSecret) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        if (!OWNER_CHAT_ID) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Owner chat ID not set — /start the bot first' }));
          return;
        }

        const severity = data.severity || 'P1';
        const subject = data.subject || 'Alert';
        const body_ = data.body || '';
        const source = data.source || '';
        const url = data.url || '';

        const msg = `*[${severity}]* ${escapeMarkdown(subject)}` +
          (source ? `\n_Source: ${escapeMarkdown(source)}_` : '') +
          (body_ ? `\n\n${escapeMarkdown(body_)}` : '') +
          (url ? `\n\n${url}` : '');

        await bot.sendMessage(OWNER_CHAT_ID, msg, { parse_mode: 'Markdown' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/') {
    // Health check for Railway
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, bot: 'peakpost-telegram', uptime: process.uptime() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT} (for /alert webhook)`);
});

// Telegram markdown escape — chars that have meaning in Markdown mode
function escapeMarkdown(s) {
  return String(s || '').replace(/[_*`[\]()~>#+\-=|{}.!]/g, (c) => '\\' + c);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  bot.stopPolling();
  server.close(() => process.exit(0));
});
