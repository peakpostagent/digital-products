# Apify Support Email — Draft (ready to send)

**To:** support@apify.com
**From:** your Apify account email (pattonholdingsmaster@gmail.com)
**Subject:** Public monetized Actors not appearing in Store search — account pattonholdings

---

Hi Apify team,

I publish 15 public, monetized Actors under the username **pattonholdings** (userId: 4DyRexVA4uWNgoEYR), and none of them appear in Apify Store search — including exact-name searches — even though they've been public for over 3 months.

What I've verified (Console + API, October 21):

- All 15 Actors are `isPublic: true` with monetization **Active** (pay-per-event, since July 1, 2026) and `categories` set
- **Beneficiary/payout details are complete** (PayPal) in Edit billing details
- All pass the daily automated QA (empty prefilled input succeeds with non-empty dataset — months of green runs, zero deprecation notices, zero Console warnings)
- All run with LIMITED_PERMISSIONS, no standby; Display information, Input schema, and Actor permissions all show green checks on the Publication tab
- My public profile is enabled and live (apify.com/pattonholdings), Store terms accepted (first Actor published through the Console wizard on July 2, 2026, the rest via API)
- Example: searching the Store for "security headers" or even "pattonholdings" returns zero of my Actors, while `https://apify.com/pattonholdings/security-headers-scanner` loads fine directly

The only incomplete item I can find is the optional Output schema (currently being added).

Questions:

1. Is there an account-level or per-Actor review/approval step my Actors are stuck in, and if so, what's needed to clear it?
2. Is anything besides the above required for Store search indexing? Is a missing Output schema enough to exclude an Actor from search entirely?
3. My Actors also show no `isWhiteListedForAgenticPayments` flag — what's required to become eligible for x402 agentic payments, given monetization + payout details are complete?

Happy to provide any further detail. Thanks!

Coleton Patton
apify.com/pattonholdings

---

**Send it from:** Gmail (the account above) → paste subject + body. Then tell Claude "support email sent" so follow-up tracking starts.
