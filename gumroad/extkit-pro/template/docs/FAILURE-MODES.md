# Failure Modes — The 22-Extension Gotchas

These are the specific traps the kit author hit while shipping 22 Chrome extensions and one paid one (Meeting Cost Calculator Pro). Every entry has a real-world incident behind it. Read this once before your first CWS submission.

---

## 1. MV3 service worker terminates mid-payment-flow

**Symptom:** User clicks "Upgrade to Pro" in popup. ExtensionPay tab opens. User pays. Tab redirects. Extension shows free tier for 1-6 hours until next service worker activation.

**Cause:** MV3 service workers shut down after 30s idle. The `paid-status-changed` event from ExtensionPay arrives, but no worker is alive to receive it.

**Fix in this kit:** The cached `isPaid()` check has a 6-hour stale-allowed window. When the popup opens after a cache miss, it triggers `extkit/refresh-paid-status` → the worker spins up → re-queries ExtensionPay → updates cache. Worst case: user sees free tier for one popup open after paying, then it flips.

**To do better:** Add a `chrome.alarms.create('extkit-refresh', { periodInMinutes: 60 })` listener that re-fetches user status every hour even when no popup opens.

---

## 2. ExtensionPay polling vs event listener race

**Symptom:** First popup after install shows blank state for ~2 seconds.

**Cause:** `extpay.getUser()` starts a network round-trip on first invocation. `isPaid()` returns `false` synchronously while the round-trip is pending; UI renders free, then re-renders Pro 2s later.

**Fix in this kit:** `is-paid.js` reads cache first, returns cached result if any, AND fires a background refresh in parallel. So second-and-later popups always render correctly; the very first install is the only one with the 2s blank.

**To do better:** Show a skeleton loader on first install only, gated by `chrome.storage.local.get('extkit:first-install-shown')`.

---

## 3. `chrome.storage.local` quota with cache bloat

**Symptom:** After ~3 months, `chrome.storage.local.set()` starts throwing `QUOTA_BYTES exceeded` errors.

**Cause:** MV3 storage.local quota is 5MB per extension. If your extension caches large objects (full review reports, transcripts, snapshots), the quota fills.

**Fix in this kit:** The `arc:` (Amazon Review Checker example) cache uses a 7-day TTL + 30-day cleanup alarm. Apply the same pattern to YOUR cache keys.

**Pattern to copy:**
```js
chrome.alarms.create('extkit-cleanup', { periodInMinutes: 60 * 24 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'extkit-cleanup') return;
  chrome.storage.local.get(null, (all) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const stale = Object.keys(all).filter((k) => all[k]?.ts < cutoff);
    if (stale.length) chrome.storage.local.remove(stale);
  });
});
```

---

## 4. CWS review tripwires (the 4 reasons your first submission gets rejected)

In order of how often they hit:

### 4a. "Overly broad permissions" (~40% of first-rejections)
- `<all_urls>` is the #1 trigger. Scope to specific hostnames whenever possible.
- `tabs` permission triggers review if your extension doesn't visibly need tab access.
- **Fix:** Use `activeTab` + content script `matches` patterns. Most extensions need this.

### 4b. "Privacy policy doesn't match permissions" (~25%)
- If your manifest requests `storage`, your privacy policy must state what you store.
- If you request `host_permissions`, the policy must explain why.
- **Fix:** This kit's `PRIVACY-POLICY-TEMPLATE.html` has the standard language for each permission.

### 4c. "Insufficient or misleading screenshots" (~20%)
- Screenshots showing your extension in DevTools or a generic "marketing" screenshot are rejected.
- Screenshots must show the extension actually doing what it does.
- **Fix:** Use real product pages or a clean demo URL with no logos/copyrighted content.

### 4d. "Single-purpose policy violation" (~15%)
- Your extension can only do ONE thing per the CWS rule. "Color contrast checker + screenshot tool + SEO scanner" → rejected.
- **Fix:** Pick one. Ship variants as separate extensions.

---

## 5. Webhook retry storms

**Symptom:** Vercel KV usage spikes 100x in one night. Investigation reveals 30,000 duplicate `payment.succeeded` events processed.

**Cause:** ExtensionPay's webhook retry policy: if your endpoint doesn't return 200 within ~10s, they retry every minute for an hour, then hourly for 24h. If your endpoint times out under load, every retry runs.

**Fix in this kit:** `api/webhook.js` writes a `extpay:event:<id>` dedupe key with 7-day TTL on the FIRST event arrival. Re-arrivals short-circuit before any side effects. Always 200, never let ExtensionPay retry.

**Pattern to copy:** Always dedupe by the upstream event ID, NEVER by a hash of body. Stripe/ExtensionPay retry with the same event ID; you want them to.

---

## 6. The first user is always YOU testing — and that breaks analytics

**Symptom:** After publishing, analytics show "1 paid user" — actually you, testing payment flow.

**Fix:** Add a dev-mode toggle:
```js
const IS_DEV_INSTALL = chrome.runtime.getManifest().version_name?.includes('dev');
if (IS_DEV_INSTALL) {
  // Don't fire analytics events
  // Don't count in subscriber index
}
```
And ship a separate "dev" build of your extension that you load as an unpacked extension for testing.

---

## 7. Trial flow + refund flow are silent killers

**Symptom:** User starts trial, never converts, you assume trial-end will lock the extension. It doesn't, because ExtensionPay's trial-end webhook isn't reliable.

**Fix:** Don't trust ANY single signal. The `isPaid()` helper checks `paid: true` from ExtensionPay's authoritative source on every cache refresh. Trial-end revocation flows naturally because the SDK returns `paid: false` once trial expires server-side.

**Refund pattern:** When you receive a `refund.issued` webhook, the user's locally-cached `isPaid: true` will lag for up to 6 hours. To force-revoke immediately:
1. Webhook handler writes a `refunded:<email>` flag to KV
2. Service worker checks this flag on every popup open via a `/api/check-refund` round-trip
3. If found, clear the local paid cache immediately

This is overkill for most extensions — the 6-hour lag is acceptable. Document it in your terms.

---

## 8. Stripe Connect, taxes, and the EU VAT issue

**For Canadian / US sellers using ExtensionPay:** ExtensionPay is a Merchant of Record. They handle EU VAT, US sales tax, and Stripe Connect. You don't.

**For Canadian sellers going direct (e.g., switching to Polar or Stripe later):**
- Need GST registration if you cross $30k CAD in 12 months
- Need VAT-MOSS registration if EU customers > 0 (or use a MoR like Polar)
- Need to file T2125 self-employment income each year

**Recommendation:** Stay on ExtensionPay until ~$5k MRR. Then evaluate Polar.sh (lower fees + MoR) vs going direct (best margin, more accounting).

---

## 9. Submitting to CWS as "Developer" without "Publisher" registration

**Symptom:** Account got a 2-month review queue.

**Cause:** CWS treats individual developer accounts differently from registered Publisher accounts. Individual accounts get manual review every time.

**Fix:** Register as a Publisher: https://chrome.google.com/webstore/devconsole → Account Settings → Add Verified Publisher Profile. One-time $5 fee + identity verification. Future submissions skip the manual queue.

---

## 10. The "free tier deathspiral"

**Symptom:** 5,000 active users, ~10 paid. You can't tell if your paywall is wrong, your free tier too generous, or the feature isn't valuable enough.

**Cause:** You shipped without a kill metric.

**Fix:** Define ONE conversion event at install time:
- "Did the user use the gated feature within 7 days?" → measure this from day 1.
- If yes, did they hit the paywall? → if yes, did they pay?

If <5% of "used the feature" users hit the paywall, the trigger is too friendly.
If <5% of "hit the paywall" users pay, the paywall copy or pricing is wrong.

Track this in PostHog (or any analytics) BEFORE you ship. Without it, you're flying blind.

---

This is documentation that compounds. Every CWS submission, ExtensionPay incident, and rejection adds to it. Read it before your first ship — and re-read it after your first incident.
