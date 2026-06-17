# Chrome Web Store Submission Checklist

Print this. Check every box before clicking "Submit for Review". The kit author has submitted 22+ extensions and the rejection rate dropped from ~40% to ~0% after using this list.

---

## ☐ Manifest hygiene

- [ ] `manifest_version` is `3` (NOT 2 — MV2 is sunset)
- [ ] `name` matches the CWS listing title exactly
- [ ] `version` follows semver (`1.0.0`) and bumped on every resubmission
- [ ] `description` is under 132 characters and matches the listing summary
- [ ] `homepage_url` points to your real landing page (not GitHub)
- [ ] `default_locale` is `en` (or whatever you ship)

## ☐ Permissions

- [ ] Every entry in `permissions` is genuinely required (`activeTab` > `tabs`; `storage` if you persist anything)
- [ ] Every entry in `host_permissions` is scoped to specific hostnames — NO `<all_urls>` unless absolutely necessary
- [ ] `optional_permissions` for anything that's nice-to-have but not always needed
- [ ] No `webRequest` or `webRequestBlocking` unless your extension is a content blocker (these get extra scrutiny)

## ☐ Privacy policy

- [ ] Hosted at a publicly accessible HTTPS URL (not behind login)
- [ ] Updated date visible at the top
- [ ] Lists every permission your extension uses and WHY
- [ ] States whether you collect personally identifiable information (you usually shouldn't)
- [ ] States what `chrome.storage.local` stores (text/identifiers/etc.)
- [ ] Contact email for privacy questions
- [ ] If you send any data off-device, declare the destination(s)

## ☐ Visual assets

- [ ] **Icon 128×128** — your final icon, NOT a placeholder
- [ ] **Promo image small 440×280** — clean visual showing the extension in use
- [ ] **Promo image marquee 1400×560** — required for featured listings
- [ ] **Screenshots** — at least 1, max 5, sized 1280×800 or 640×400
  - [ ] First screenshot shows the extension solving the user's problem
  - [ ] No copyrighted brand logos in screenshots
  - [ ] No DevTools panels unless your extension IS a DevTools panel

## ☐ Listing copy

- [ ] **Listing title** — 45 chars max, includes the main keyword
- [ ] **Summary** — 132 chars max, sells the benefit (not the feature)
- [ ] **Description** — under 16,000 chars but no fluff. Structure:
  1. One-line benefit (re-state the title)
  2. 3-5 bullet points of capabilities
  3. "How it works" in 3 steps
  4. Free vs Pro split (if applicable)
  5. Privacy summary (1 sentence)
- [ ] **Category** — pick the most specific one that fits
- [ ] **Language** — set correctly

## ☐ Paid-tier specifics (only if shipping paid)

- [ ] ExtensionPay product created at https://extensionpay.com
- [ ] `PRO_ENABLED=false` for initial submission (review on free experience first)
- [ ] Plans configured on ExtensionPay match `PRICE_MONTHLY` + `PRICE_YEARLY` in `extpay-config.js`
- [ ] Trial enabled (`TRIAL_ENABLED=true` + `TRIAL_DAYS=14`) or explicitly disabled
- [ ] Webhook URL pointed to your Vercel deployment
- [ ] Test transaction completed in ExtensionPay's sandbox mode
- [ ] Refund flow tested (use ExtensionPay's "issue refund" dashboard action)

## ☐ Pre-submission smoke test

Load the extension as an unpacked extension in Chrome, then:

- [ ] Extension installs without errors
- [ ] Welcome page loads (if you have one)
- [ ] Popup opens in under 1 second
- [ ] Content script runs on a real page in the host_permissions list
- [ ] All buttons in popup work
- [ ] Pro features are correctly gated (test with `PRO_ENABLED=true` locally)
- [ ] Paywall modal renders and closes correctly
- [ ] Trial CTA opens ExtensionPay
- [ ] Upgrade CTA opens ExtensionPay
- [ ] `chrome.storage.local` cleanup alarm fires after install (use Chrome's Alarms DevTools view)
- [ ] Service worker survives a Chrome restart (close + reopen → popup still works)
- [ ] No console errors in the background service worker
- [ ] No console errors in the popup
- [ ] No console errors in the content script

## ☐ Account hygiene

- [ ] Chrome Web Store developer account registered ($5 one-time fee)
- [ ] Verified Publisher status applied for (skips manual review queue)
- [ ] Two-factor auth on your Google account (CWS now requires it)
- [ ] Recovery codes saved to a password manager (NOT to a .env file)

## ☐ After submission

- [ ] Watch your developer dashboard email for ~3-5 days
- [ ] If rejected, the email lists the exact policy clause violated — fix it specifically, re-submit
- [ ] Once approved, flip `PRO_ENABLED=true` in `extpay-config.js`, bump version, re-submit
- [ ] Add your extension URL to your landing page
- [ ] Add a "Built with ExtKit Pro" footer link (optional but appreciated 🙏)

---

If you check every box, you're submitting cleaner than ~95% of CWS submissions. That's the whole game.
