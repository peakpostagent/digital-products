# MCC Pro Paywall Review — issues to fix BEFORE CWS upload

Review of `src/popup/popup.html` + `src/popup/popup.js` paywall surface.

## 🔴 Must-fix

### 1. Price banner hides the yearly plan (popup.html:22)
```html
<span class="pro-banner-price">$4.99/mo</span>
```
You have two plans on ExtensionPay ($4.99/mo and $39/yr = ~35% off yearly). The banner only advertises monthly. Users who would have picked yearly-for-savings never see the option.

**Fix:** Either split into two CTAs or add a yearly pill, e.g.:
```html
<span class="pro-banner-price">$4.99/mo <small>or $39/yr (save 35%)</small></span>
```

### 2. "Start 14-day free trial" CTA without verified trial config (popup.html:31)
```html
<button id="btn-start-trial" class="pro-btn-primary">Start 14-day free trial</button>
```
Your ExtensionPay "Plans" page doesn't show trial settings — those live on a different page ("Free trial user dashboard" link visible in your screenshot). If trial isn't actually enabled, this button opens a payment page asking for card details up-front, which reads as a bait-and-switch.

**Before ship, verify:**
- Is trial turned on in ExtensionPay?
- If yes, what's the duration? (LAUNCH-CHECKLIST says 14 days; ExtPay default is different)
- If no, change primary CTA to `"Upgrade now"` and demote the trial button (or remove entirely)

### 3. "team benchmarking" in banner feature list (popup.html:27)
```html
<li>CSV export, team benchmarking</li>
```
`LAUNCH-CHECKLIST.md:80` says: *"Swap static benchmarks for live aggregates once >50 Pro subscribers exist."* At launch, "team benchmarking" = a hardcoded static comparison number. Advertising it as a Pro feature is technically true but misleading — no real team data exists yet.

**Fix:** Change to `"CSV export, industry benchmark"` (singular, accurate) or drop this line until live aggregates are built.

## 🟡 Nice-to-fix

### 4. Annual-plan ROI framing missing
The banner sells monthly at $4.99 without anchoring against the cost of a single wasted meeting. MCC's whole value prop is "see meeting costs" — lean into it on the upsell:
> "One wasted hour-long 6-person meeting = ~$400. MCC Pro costs $4.99/mo."

Low-effort copy improvement; could A/B later.

### 5. Trial status text grammar (popup.js:423-424)
```js
proTrialStatus.textContent = proStatus.trialDaysRemaining +
  ' days left in your free trial window.';
```
`1 days left` is grammatically wrong. Small but reads as rough.

**Fix:**
```js
const d = proStatus.trialDaysRemaining;
proTrialStatus.textContent = d === 1
  ? '1 day left in your free trial.'
  : d + ' days left in your free trial.';
```

### 6. Pro badge visual weight (popup.html:15)
`<div id="pro-badge" class="pro-badge hidden">PRO</div>` — class is fine, but once a user has paid, a brighter visual treatment (gold/purple) is the free-est dopamine in the product. Current CSS unknown — verify it's visually distinct.

## 🟢 Correct (leave as-is)

- Defense-in-depth check `if (!isPaid()) return;` on line 486 of popup.js. Prevents accidental Pro feature exposure if the UI state desyncs.
- SDK-missing graceful fallback in `lib/extpay.js:38-46` (loadExtPaySdk returns null, popup treats everyone as free). Good failure mode.
- Upgrade CTA opens ExtensionPay's hosted payment page (not embedded iframe) — standard pattern, low risk of CSP / third-party-cookie breakage.

## Summary

Block on 1, 2, 3. The other 3 items can ship with v1.2.0 and improve in a v1.2.1 polish pass.
