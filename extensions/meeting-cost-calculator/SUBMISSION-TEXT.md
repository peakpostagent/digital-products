# MCC v1.2.0 / 1.2.1 — CWS Submission Text (drafted)

All text below is ready to paste into the Chrome Web Store Developer Dashboard when submitting the Pro tier. Review, tweak, then copy.

---

## Permission Justifications (dashboard → Store listing → Justification)

**storage**
> Stores the user's hourly rate, meeting history (aggregate minutes + cost totals), and Pro tier preferences (e.g. weekly email opt-in) locally in chrome.storage. No data leaves the device except the optional weekly email digest, which the user opts into explicitly.

**alarms**
> Runs two daily background jobs: (1) cleans meeting history older than 12 weeks so storage doesn't grow unbounded, (2) refreshes the Pro subscription status from ExtensionPay every 6 hours so a cancelled subscription re-locks Pro features within 6 hours of cancellation.

**host_permissions: https://extensionpay.com/\***
> Required by the ExtensionPay SDK to manage the Pro subscription (payment, trial status, cancellation). ExtensionPay handles all PCI-sensitive data — this extension never sees credit card numbers or billing details.

**activeTab / scripting** — NOT REQUESTED (intentional)
> MCC reads Google Calendar events via the content-script matches pattern declared in the manifest, which does not require activeTab or scripting. Keeping the permission surface minimal.

---

## Single Purpose description (dashboard → Store listing → Single purpose)

Calculate the real-time dollar cost of meetings on Google Calendar, help users reduce meeting waste, and provide optional paid insights (AI-generated weekly digest, CSV export, 12-week trend chart, ROI calculator) for Pro subscribers.

---

## What's new in this version (CWS "version notes")

> v1.2.0 adds an optional Pro tier ($4.99/mo or $39/yr, 14-day free trial). Pro unlocks a weekly AI insights email, CSV export, 12-week trend chart, multiple rate profiles, and a meeting ROI calculator. The free tier is unchanged — all existing features still work offline, free, forever. Subscriptions are managed via ExtensionPay.

---

## Listing description — section to append (after existing description)

```
— Free forever
• Live dollar cost tracking on every Google Calendar event
• Per-meeting history with totals and aggregate-cost stats
• Your data stays on your device — nothing sent anywhere

— Pro ($4.99/mo or $39/yr — 14 day free trial)
• Weekly "Where your meeting dollars went" email, AI-generated
• CSV export of meeting history for expense reports
• 12-week cost trend chart (vs 4-week on free)
• Multiple hourly-rate profiles (client work, internal, mixed)
• Meeting ROI calculator — recommends skip / attend / shorten

Subscriptions billed via ExtensionPay. Cancel anytime from the extension popup.
```

---

## Privacy policy update (diff to apply to store-listing/privacy-policy.html)

Insert the following paragraph in the "What data is collected" section:

```
Pro subscribers who opt into the weekly insights email transmit the
following to our backend: (a) their email address, (b) aggregate
weekly meeting totals — total minutes, total cost, number of
meetings, number of >1h meetings. We do NOT transmit meeting
titles, attendee names, calendar contents, or any personally
identifying information from calendar events. These aggregate
numbers are sent to OpenAI to generate the weekly digest text,
then discarded after the email is sent. Unsubscribing removes
the email address and all aggregates from our KV store within
24 hours.
```

Add the following to the "Third parties" list:
- ExtensionPay (payment processing for Pro subscriptions)
- Resend (delivery of weekly digest emails, Pro subscribers only)
- OpenAI (generates weekly digest text from aggregate weekly numbers, Pro subscribers only)

---

## Version drift to resolve before upload

- `src/manifest.json:4` says `"1.2.1"`
- `LAUNCH-CHECKLIST.md` throughout says `1.2.0`
- CWS currently has `1.1.0` live

If uploading now, either:
- (a) Bump manifest to `1.2.1` everywhere (checklist, zip name, release notes) — treat as a post-1.2.0 hotfix over the never-shipped 1.2.0
- (b) Roll manifest back to `1.2.0` — keeps all docs aligned

Recommend **(b)** unless there's a reason the jump to 1.2.1 happened. Less confusion in release notes and analytics.
