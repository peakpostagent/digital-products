# Apify Support Email — Draft (ready to send)

**To:** support@apify.com
**From:** your Apify account email (pattonholdingsmaster@gmail.com)
**Subject:** Public monetized Actors not appearing in Store search — account pattonholdings

---

Hi Apify team,

I publish 15 public, monetized Actors under the username **pattonholdings** (userId: 4DyRexVA4uWNgoEYR), and none of them appear in Apify Store search — including exact-name searches — even though they've been public for over 3 months.

What I've verified:

- All 15 Actors are `isPublic: true` with active pay-per-event pricing and `categories` set
- All pass the daily automated QA (empty prefilled input succeeds with non-empty dataset — months of green runs, zero deprecation notices)
- All run with LIMITED_PERMISSIONS, no standby
- My public profile is enabled, Store terms accepted (first Actor published through the Console wizard on July 2, 2026, the rest via API)
- Example: searching the Store for "security headers" or even "pattonholdings" returns zero of my Actors, while `https://apify.com/pattonholdings/security-headers-scanner` loads fine directly

Questions:

1. Is there an account-level or per-Actor review/approval step my Actors are stuck in, and if so, what's needed to clear it?
2. Does Store indexing require completed payout/beneficiary details or KYC? (I understand KYC gates x402 agentic eligibility — is it also gating Store search?)
3. If it's the Actor quality score, is there a hard threshold below which Actors are excluded from search entirely, and what are the biggest levers for my Actors?

Happy to provide any further detail. Thanks!

Coleton Patton
apify.com/pattonholdings

---

**Send it from:** Gmail (the account above) → paste subject + body. Then tell Claude "support email sent" so follow-up tracking starts.
