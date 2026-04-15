// api/unsubscribe.js — One-click unsubscribe link target.
// GET /api/unsubscribe?email={email}&token={hmac}
// Returns a simple HTML confirmation page.

const { removeSubscriber } = require('../lib/store');
const crypto = require('crypto');

function verifyToken(email, token) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(email).digest('hex');
  // Constant-time compare
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

module.exports = async function handler(req, res) {
  const email = (req.query.email || '').toString().trim().toLowerCase();
  const token = (req.query.token || '').toString().trim();

  if (!email || !token || !verifyToken(email, token)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(
      '<!doctype html><title>Unsubscribe</title><body style="font-family:sans-serif;padding:40px;">' +
      '<h1>Invalid unsubscribe link</h1><p>Try clicking the link from the latest email again.</p>'
    );
  }

  try {
    await removeSubscriber(email);
  } catch (err) {
    console.error('unsubscribe error', err);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(
    '<!doctype html><title>Unsubscribed</title><body style="font-family:sans-serif;padding:40px;">' +
    '<h1>You&rsquo;re unsubscribed</h1><p>You will no longer receive the Meeting Cost Calculator Pro weekly digest.</p>'
  );
};
