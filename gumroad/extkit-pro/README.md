# ExtKit Pro — Chrome Extension SaaS Starter Kit

**Status: v0.1.0 scaffold (committed 2026-06-15). Not yet shipped.**

The Chrome extension boilerplate that wins because the author (you) has shipped 22 extensions and a paid Pro tier (MCC Pro). No competitor has that credential.

## What buyers get

A complete starter kit to ship a paid Chrome extension this weekend:

1. **MV3 + Vite + vanilla JS template** — matches the user's "no React/TypeScript" rule
2. **Vendored ExtensionPay SDK** wired into popup, options page, service worker
3. **`isPaid()` gating helper** with 6-hour `chrome.storage.local` cache (lifted from MCC Pro)
4. **Vercel serverless backend** (`/api/`) — webhook verification + dedupe-keyed cron pattern from `apis/mcc-insights/`
5. **Stripe-via-ExtensionPay** coupon/trial wiring
6. **Pre-built popup UI** — Free/Pro toggle + paywall modal
7. **Onboarding flow** — welcome page after install
8. **3 working example extensions** — AI sidebar (Ollama-compatible), SEO scanner, CSS inspector
9. **Privacy policy template** + CWS submission checklist
10. **"Failure modes" README** — the specific gotchas from 22 shipped extensions

## Why this isn't another failed Gumroad product

The other 7 Gumroad products at $0 sales failed because they were info-products (templates, prompts, ebooks) competing with free alternatives, and Gumroad Discover doesn't surface new sellers.

ExtKit Pro is **working code that saves 40+ hours**, has **self-renewing distribution** (footer link in 22 existing extensions), and has **credibility no competitor can fake** (22 shipped + MCC Pro live billing).

## Pricing

**$79 one-time.** Reasoning:
- SmolStack at $49 (too cheap to signal completeness)
- MV3 Kickstart Kit (no payments layer)
- ShipFast at $199–$299 (wrong stack — Next.js)

$79 undercuts ShipFast by 60% while signaling "more complete than SmolStack."

## Traffic plan (first 100 buyers)

### Tier 1 — Footer link in existing 22 extensions (self-renewing)
"Built with ExtKit — ship your own paid extension"
~104 active users × 1-2% click × 5% conversion ≈ 1-4 sales/mo. Compounds with every new install.

### Tier 2 — Programmatic SEO on extkit.dev (subdomain of peakpost.ca)
50-80 landing pages on:
- "How to add Stripe to a Chrome extension"
- "Manifest V3 + ExtensionPay tutorial"
- "Chrome extension boilerplate vs WXT"
- "ChatGPT sidebar extension starter"

12-week SEO lag, then compounds. Same playbook as Marc Lou's DataFast ($15.8K MRR).

### Tier 3 — IndieHackers + r/SideProject "I built X" launch post
Hook: "I ship paid Chrome extensions for a living — here's the boilerplate I wish existed when I started."
Social proof: Security Headers organic growth (33 → 56 users in 2 weeks).

### Tier 4 — X build-in-public
"Day N of porting my paid Chrome extension stack into a boilerplate."

## Build plan (28 hours)

| Hours | Task |
|---|---|
| 8 | Extract MCC Pro's ExtensionPay layer into reusable `template/src/lib/extpay-sdk.js` |
| 6 | Write 3 example extensions (AI sidebar, SEO scanner, CSS inspector) |
| 6 | Vercel backend template + webhook verification tests |
| 4 | Docs + README + failure-modes guide |
| 4 | Landing page on extkit.dev (Vercel) + Gumroad listing + screencasts |

## Folder structure

```
gumroad/extkit-pro/
├── README.md                        # this file
├── landing-page/                    # extkit.dev source (Next.js or static)
├── template/                        # what the buyer downloads
│   ├── src/
│   │   ├── manifest.json
│   │   ├── popup/                   # Free/Pro toggle + paywall modal
│   │   ├── background/              # ExtensionPay polling, badge updates
│   │   ├── lib/
│   │   │   ├── extpay-sdk.js        # Vendored SDK (cloned from MCC Pro)
│   │   │   ├── extpay.js            # Pro feature gating helper
│   │   │   └── is-paid.js           # 6-hour cached `isPaid()` check
│   │   └── examples/                # 3 working example extensions
│   │       ├── ai-sidebar/
│   │       ├── seo-scanner/
│   │       └── css-inspector/
│   ├── api/                         # Vercel serverless backend template
│   │   ├── webhook.js               # ExtensionPay webhook verification
│   │   ├── digest-cron.js           # Dedupe-keyed cron pattern from mcc-insights
│   │   └── README.md
│   ├── docs/
│   │   ├── PRIVACY-POLICY-TEMPLATE.html
│   │   ├── CWS-SUBMISSION-CHECKLIST.md
│   │   └── FAILURE-MODES.md         # The 22-extension gotchas
│   ├── package.json
│   ├── vite.config.js
│   └── README.md                    # Buyer's quick-start (10 min to first paid extension)
└── store-listing/
    ├── gumroad-listing.md           # Gumroad product description
    ├── polar-listing.md             # Polar.sh version (switch after 20 sales)
    └── screenshots/
```

## Platform choice

Start on **Gumroad** (Merchant-of-Record handles Canadian tax automatically). Switch to **Polar.sh** after the first 20 sales:
- Polar fees: 4% + $0.40 vs Gumroad's 10% flat = saves ~6% per sale
- More dev-credible buyer signal
- Keep Gumroad listing live for backwards compatibility

## First-month revenue projection

- Footer link: 1-4 sales × $79 = $79–$316
- IH/r/SideProject post: 3-8 sales × $79 = $237–$632
- X build-in-public: 2-5 sales × $79 = $158–$395
- pSEO: ~0 in month 1 (12-week lag), compounds after

**Total: $790–$1,580 month 1**, compounding via footer link + SEO.

## When to actually build this

The May 15 strategic pivot to Apify Actors stays canonical. ExtKit Pro is **week 2 work**, after the 3 Apify Actors at `apify-actors/` are published.

This is ~28 hours of mostly extraction (not greenfield design). Can ship between Apify Actor publishes without significant opportunity cost.

## What competitors get wrong

1. **SmolStack ($49)** — author hasn't publicly shipped a paid extension. No social proof for the buyer.
2. **MV3 Kickstart Kit** — no payments layer. Buyer still has to wire ExtensionPay themselves.
3. **ShipFast ($199–$299)** — wrong stack (Next.js for SaaS apps, not Chrome extensions). Leaves the extension niche wide open.
4. **WXT framework (free)** — it's a framework, not a SaaS-extension starter with payments + auth + Stripe wired. Complementary, not competitive.

## Sources

- [Marc Lou $133K/mo with ShipFast](https://thebuilderos.beehiiv.com/p/marc-lou-crosses-133kmo-simple-nextjs-boilerplate)
- [ExtensionPay $500K+ paid out, $45K/mo extensions](https://extensionpay.com/)
- [Polar vs Lemon Squeezy vs Creem 2026](https://devtoolpicks.com/blog/polar-vs-lemon-squeezy-vs-creem-2026)
- [SmolStack Gumroad listing](https://smoldesk.gumroad.com/l/smolstack)
- [Notion creator Easlo $1M+ (proof category works, but wrong skill match)](https://www.purshology.com/2026/04/how-to-make-money-selling-notion-templates-in-2026/)
