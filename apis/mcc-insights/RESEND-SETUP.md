# Resend Setup — Domain Verification Cheat Sheet

Resend is the transactional email provider for MCC Pro's weekly digest. This doc walks through the one-time domain verification you need before `sendEmail()` will actually deliver mail.

**Scope:** domain setup + DKIM + SPF + DMARC. You need to own a domain with DNS access. `peakpost.com` would be the natural choice given the portfolio branding.

**Time:** 15 minutes of clicking, then DNS propagation (5 minutes to 24 hours — usually < 30 minutes).

---

## Step 1 — Create the Resend account

1. Sign up at https://resend.com (email + password; confirm verification email)
2. Free plan: 3,000 emails/month, 100/day. Upgrade when usage crosses that — first 100 Pro subs fit comfortably in free tier.

---

## Step 2 — Add your sending domain

1. Resend dashboard → **Domains** → **Add Domain**
2. Enter the domain you'll send from (e.g., `peakpost.com`)
3. Region: pick the one closest to your users (US for North America)
4. Resend shows a set of DNS records to add to your domain

---

## Step 3 — Add DNS records at your DNS host

Resend will display 3-4 records. The exact values differ per account — **copy them from your Resend dashboard**, not from here. The record *types* you'll see:

### MX record (required)
| Type | Host / Name | Value | Priority | TTL |
|---|---|---|---|---|
| MX | `send` or `send.peakpost.com` | `feedback-smtp.{region}.amazonses.com` | 10 | 3600 |

### TXT for SPF (required)
| Type | Host / Name | Value | TTL |
|---|---|---|---|
| TXT | `send` or `send.peakpost.com` | `v=spf1 include:amazonses.com ~all` | 3600 |

### TXT for DKIM (required — one or three records depending on Resend version)
| Type | Host / Name | Value | TTL |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIIBIjANBgkqh...` (long public key) | 3600 |

### TXT for DMARC (optional but recommended)
| Type | Host / Name | Value | TTL |
|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@peakpost.com` | 3600 |

Start with `p=none` (monitoring only). Flip to `p=quarantine` or `p=reject` after 2-4 weeks of no issues in the DMARC reports.

---

## Step 4 — Verify

Back in Resend → Domains page, click **Verify**. Resend polls DNS and marks each record green/red. Full green = ready to send.

If any record is still red after 30 minutes:
- Double-check you copied the exact value — trailing dots, capitalization, and spaces matter
- Some DNS hosts auto-append the domain suffix to the "Host" field — if your record shows `send.peakpost.com.peakpost.com`, strip the suffix
- Lookup propagation at https://mxtoolbox.com/txtlookup.aspx

---

## Step 5 — Create an API key

1. Resend → **API Keys** → **Create API Key**
2. Name: `mcc-insights-production`
3. Permission: **Sending access** (scoped to your verified domain only; don't pick "Full access")
4. Copy the key starting with `re_...` — you only see it once
5. Paste into Vercel as `RESEND_API_KEY` env var (see `DEPLOY.md`)

---

## Step 6 — Set the `RESEND_FROM` env var

Format: `"Display Name <address@verified-domain.com>"`

For MCC Pro: `"MCC Pro <noreply@peakpost.com>"` (or whatever you set up).

Must be an address on the verified domain. Sending from a different domain will silently go to spam or be rejected outright.

---

## Step 7 — Smoke test

After deploy, the `weekly-digest` smoke test in `DEPLOY.md` (step 4) will send a real email. Watch for:
- **Deliverability**: arrives within 10 seconds in the Inbox (not spam folder)
- **Content**: subject line "Your meeting cost digest", HTML renders correctly
- **Unsubscribe link**: clickable, takes you to the confirmation page
- **Bounce handling**: if you use a fake address, Resend's dashboard should log the bounce

If the email goes to spam, add `DMARC` if you haven't, and make sure `SPF` and `DKIM` are both present on the record.

---

## Ongoing hygiene

Check Resend dashboard weekly for the first month:
- **Bounce rate** — keep < 2%. Anything higher signals your list has bad addresses and the sending reputation will degrade.
- **Spam complaint rate** — keep < 0.1%. If crossing, review the email subject line + unsubscribe prominence.
- **Delivery rate** — should be > 98%. Lower means DKIM/SPF issue.

---

## Gotchas

1. **Subdomain vs root domain.** Sending from `peakpost.com` directly (root) collides with your regular email. Use a subdomain like `send.peakpost.com` or `mail.peakpost.com` for transactional mail. Keep the main MX record on the root pointing at your inbox provider (Google Workspace, etc.) untouched.
2. **DKIM key rotation.** Resend may rotate keys yearly. They email you when it's time — update the DNS record and don't delete the old one until the new one is fully propagated.
3. **Reply-to vs from.** `noreply@` senders get higher spam scores. If customers reply and get bounced, support load falls on you. A real support address (even a forwarding rule to your inbox) is better long-term.
4. **Email clients render HTML differently.** Test your template in at least Gmail (web) and Apple Mail before going live. The `render-email-test.js` script in this folder generates `preview.html` for exactly this.
