# Etsy SEO Tag Generator — v0.1.0 scaffold

**Status:** scaffold only. Loads in Chrome, scans Etsy listing pages via DOM, displays current tags. Suggested-tags section is a stub — backend LLM integration not yet wired.

## What this scaffold does
- Loads as a Manifest V3 unpacked extension
- Activates content script on `etsy.com/listing/*` pages
- Reads listing title, price, description, tags (from JSON-LD), category breadcrumbs, image count
- On popup open, displays the listing summary + current tags
- Shows placeholder "suggested tags" section pending backend wiring

## What it doesn't do (yet)
- Generate AI tag suggestions (needs Vercel backend + OpenAI/cheap LLM integration)
- Compare against top-ranking same-category listings (Pro feature — needs scraping pipeline)
- Save scan history (needs `chrome.storage.local` wiring)
- Copy tags to clipboard
- Subscription / paid tier (clone from MCC Pro pattern when ready)

## Why this scaffold exists
Validated 2026-04-24 against the 5-step procedure (`docs/extension-validation-results-2026-04-24.md`) — scored 7/10, only candidate of 6 to pass. Built as the diversification hedge against MCC Pro.

## How to test locally
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this directory's `src/` folder (NOT the directory root)
5. Pin the extension to the toolbar
6. Navigate to any Etsy listing (e.g., `https://www.etsy.com/listing/123456/...`)
7. Click the extension icon — should show the listing's title, price, breadcrumbs, current tags

## Path to v1.0.0 (free launch)
- [ ] Wire up backend LLM call for AI tag suggestions
  - Option A: Vercel function calling OpenAI gpt-4o-mini ($0.0001 per call) — clones `apis/mcc-insights/lib/llm.js` pattern
  - Option B: Direct Anthropic API call from extension (requires API key in user storage — not great UX)
  - Option C: Free-tier-only via local heuristic (top-N keywords from successful Etsy SEO patterns) — no LLM cost, weaker product
- [ ] Sanitize and rate-limit the backend call to prevent API abuse
- [ ] Add chrome.storage.local caching of recent scans
- [ ] Generate 4 store-listing screenshots (1280×800)
- [ ] Generate marquee (1400×560) and small-promo (440×280)
- [ ] Write privacy-policy.html
- [ ] Submit free v1.0.0 to CWS, wait for review

## Path to v1.1.0 (paid tier)
After v1.0.0 ships and passes 50+ installs at day 30:
- [ ] Wire ExtensionPay (clone `extensions/meeting-cost-calculator/src/lib/extpay.js` + extpay-sdk.js)
- [ ] Add competitor scraping for "live DOM diff vs top-ranking listings"
- [ ] Build the pricing+tag bundle Pro feature
- [ ] $9.99/mo or $79/yr (sits within validated band: eRank $5.99, Sale Samurai $9.99, Marmalead $19, Alura $29.99)

## Validation summary (from `docs/extension-validation-results-2026-04-24.md`)
- **Search-Demand: STRONG PASS** — r/EtsySellers (300K+ members) vocal community; 2025-26 Etsy traffic decline tailwinds tool demand
- **CWS Saturation: WEAK PASS** — eRank dominant 100K+ free, but stat-based not LLM-rewriting; defensible niche
- **Monetization: STRONG PASS** — eRank $5.99, Marmalead $19, Sale Samurai $9.99, Alura $29.99 all sustaining businesses
- **Search-String Fit: STRONG PASS** — eRank's free CWS extension at 100K+ proves the channel converts
- **Page-Integration Moat: STRONG PASS** — reading live `etsy.com/listing/*` DOM to compare against competitors is structurally something ChatGPT can't do

## Differentiation angles (vs eRank)
1. AI-rewrite, not stat-scoring — eRank tells you what's wrong; this fixes it in one click
2. Live DOM diff against top-3 same-category winners — eRank is search-volume-oriented, not competitive-listing-oriented
3. Price + tag bundle — recommends tag changes that move the listing into a higher-converting price band

## Risks
- Etsy GMV declining 2025-26 — building atop a structurally weakening platform; tailwind from seller anxiety is short-term
- eRank brand dominance — non-technical sellers default to known names — wedge is "AI-native" framing
- Etsy TOS check needed before public launch — Etsy doesn't aggressively block extensions like LinkedIn does, but verify
- Competitor scrape (Pro feature) carries TOS risk — limit to public listing data only, no logged-in account scraping

## Files in this scaffold
```
extensions/etsy-seo-tag-generator/
├── README.md                                 # this file
├── generate-icons.js                         # SVG → PNG icon generator (run: node generate-icons.js)
├── src/
│   ├── manifest.json                         # MV3, storage + activeTab + etsy.com host
│   ├── icons/
│   │   ├── icon16.png                        # 516 bytes
│   │   ├── icon48.png                        # 1408 bytes
│   │   └── icon128.png                       # 4272 bytes
│   ├── popup/
│   │   ├── popup.html                        # extension popup UI
│   │   ├── popup.css                         # teal/cyan styling
│   │   └── popup.js                          # popup orchestration
│   ├── content/
│   │   └── content.js                        # extracts listing data from DOM
│   ├── background/
│   │   └── service-worker.js                 # MV3 background (no-op for v0.1.0)
│   └── lib/                                  # empty — for future shared helpers
├── store-listing/                            # CWS submission assets (TBD)
└── tests/                                    # Vitest tests (TBD)
```

## Developer notes
- All vanilla JS, no TypeScript / React / bundlers — matches CLAUDE.md conventions
- `escapeHtml()` is used for any DOM injection of listing data (Etsy titles can contain `<>&`)
- Etsy DOM selectors are localized to `content/content.js` — Etsy changes their HTML occasionally, fix in one file
- Color palette is teal/cyan, NOT Etsy-orange — deliberately avoids trademark confusion
