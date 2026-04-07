# Competitive Chrome Extension Research

**Date:** 2026-04-06
**Methodology:** Ollama (Qwen3 14B) ideation + web research + CWS verification + cross-referencing against existing portfolio of 19 extensions.

---

## Market Context

- The Chrome Web Store has ~113,000 extensions total. 85% have fewer than 1,000 installs.
- MV2 was fully removed in Chrome 139 (July 2025). Many popular extensions died or lost users (e.g., EditThisCookie lost 3M+ users). This created replacement opportunities.
- AI-integrated extensions are in high demand but only ~6% of developer tools cover AI, despite 85% of developers using AI tools.
- Subscription model is the most reliable monetization path. Tiered pricing captures casual + power users.
- Developer tools category has ~10,000 extensions, but most are low quality.

---

## Existing Portfolio (19 extensions) - Avoid Overlap

- api-echo, api-rate-limiter, color-contrast-checker, console-catcher
- css-variables-inspector, devtools-decoder, dotenv-preview, job-match-score
- localstorage-manager, meeting-cost-calculator, meta-tag-viewer, pay-decoder
- read-cost, review-clock, service-worker-inspector, shadow-dom-debugger
- snippet-vault, tab-brake, web-vitals-lite

---

## Top 5 Competitive Opportunities (Ranked)

### 1. Z-Index / Stacking Context Debugger

**What it does:** Visualizes z-index stacking contexts on any page, highlights overlapping elements, shows the stacking context tree, and helps developers fix "z-index wars."

**Incumbent Analysis:**
| Extension | Users | Rating | Status |
|-----------|-------|--------|--------|
| z-context | ~3,000 | 4.4 | Last updated 2021, aging codebase |
| CSS Stacking Context Inspector | ~2,000 | 3.3 | Users report infinite loading spinner, broken in recent Chrome |
| DevTools z-index | ~500 | 5.0 | Tiny user base, minimal features |
| Z-index Visualizer | ~1,000 | 4.5 | Basic feature set |

**Why this is a strong opportunity:**
- Every CSS developer hits z-index problems. It is one of the top CSS debugging pain points.
- The leading extension (CSS Stacking Context Inspector, 3.3 stars) is actively broken for many users.
- z-context has not been updated in years.
- Only 4 competitors, most with fewer than 3,000 users.
- No backend needed -- pure DOM inspection.

**Feature list:**
- Visual 2.5D stacking context tree overlay
- Click any element to see its full stacking context chain
- Highlight all elements at a given z-index level
- Color-coded z-index ranges (low/medium/high/extreme)
- Copy stacking context info to clipboard
- Dark mode support
- DevTools panel integration

**Build feasibility:** Vanilla JS + MV3. No backend. DOM traversal + getComputedStyle API.
**Estimated build time:** 2-3 days.
**Keyword potential:** "z-index debugger", "stacking context", "z-index chrome extension" -- low competition search terms.

---

### 2. Security Headers Inspector

**What it does:** One-click audit of a page's HTTP security headers (CSP, CORS, HSTS, X-Frame-Options, Permissions-Policy, etc.) with pass/fail grading and fix suggestions.

**Incumbent Analysis:**
| Extension | Users | Rating | Status |
|-----------|-------|--------|--------|
| CSP Evaluator (Google) | ~8,000 | 4.2 | CSP only, no other headers |
| Allow CSP | ~5,000 | 3.2 | Disables CSP, doesn't inspect it |
| Disable Content-Security-Policy | ~30,000 | 3.4 | Security risk, not an inspection tool |
| CORS and CSP Debugger | ~2,000 | 4.3 | Narrow focus |

**Why this is a strong opportunity:**
- No single extension provides a comprehensive security headers audit with grading.
- Existing tools either disable security (bad practice) or only cover CSP.
- Security is increasingly important -- developers need to verify headers.
- Complements the existing portfolio (pairs well with api-echo, api-rate-limiter).

**Feature list:**
- Scan all security headers in one click
- Letter grade (A-F) for overall security posture
- Individual header scores with explanations
- Missing header detection with suggested values
- CORS configuration viewer
- CSP policy breakdown (inline, eval, unsafe sources)
- Export report as JSON
- Badge showing grade on extension icon

**Build feasibility:** Vanilla JS + MV3. Uses chrome.webRequest or fetch to read response headers. No backend.
**Estimated build time:** 2-3 days.
**Keyword potential:** "security headers checker", "CSP checker", "CORS debugger" -- moderate search volume, low extension competition.

---

### 3. Font Previewer / Typography Tester

**What it does:** Test and preview Google Fonts on any live website without changing code. Compare fonts side-by-side, adjust weight/size/spacing in real time.

**Incumbent Analysis:**
| Extension | Users | Rating | Status |
|-----------|-------|--------|--------|
| Google Font Previewer for Chrome | ~4,000 | 3.5 | Low rating, limited features |
| Font Tester - Improve Your Typography | ~2,000 | ~4.0 | Decent but basic |
| WhatFont | ~800,000 | 4.3 | Identifies fonts only, cannot test/swap |
| Typography Analyzer | ~500 | ~4.0 | Analysis only, no preview |

**Why this is a strong opportunity:**
- Google Font Previewer has only 3.5 stars with 4,000 users -- clear dissatisfaction.
- WhatFont has massive reach (800K users) but only identifies fonts; it cannot preview alternatives. Users who install WhatFont are exactly the audience who would also want a font tester.
- The testing/previewing niche is separate from font identification and is underserved.
- Designers and front-end developers both need this daily.

**Feature list:**
- Browse and preview 1,500+ Google Fonts on any live page
- Click any text element to apply a different font
- Side-by-side font comparison mode
- Adjust font-weight, font-size, line-height, letter-spacing sliders
- Save favorite font pairings
- Generate CSS snippet for chosen fonts
- Dark mode support

**Build feasibility:** Vanilla JS + MV3. Loads Google Fonts API. No backend required.
**Estimated build time:** 3-4 days.
**Keyword potential:** "font tester chrome", "preview google fonts", "typography chrome extension" -- good search volume given WhatFont's 800K user base proving demand.

---

### 4. Regex Tester & Highlighter

**What it does:** Test regex patterns against page content in real time with live highlighting, match groups, and a library of common patterns.

**Incumbent Analysis:**
| Extension | Users | Rating | Status |
|-----------|-------|--------|--------|
| Regex Matcher | ~1,000 | ~3.5 | Basic, no highlighting |
| Regex Manager | ~200 | ~2.0 | Unstable, very low adoption |
| Various regex tools | <500 each | 0-3.0 | Many abandoned or broken |

**Why this is a strong opportunity:**
- Developers use regex constantly but most test on external sites (regex101.com). An in-browser tool that highlights matches on the actual page is different and more useful.
- Existing extensions in this space are nearly all abandoned or have near-zero ratings.
- Fewer than 5 competitors, most with under 1,000 users.
- regex101.com gets massive traffic, proving the demand exists.

**Feature list:**
- Live regex input with real-time page highlighting
- Match count and group extraction
- Built-in pattern library (email, URL, phone, IP, date formats, etc.)
- Find & replace preview (non-destructive)
- Regex flags toggle (g, i, m, s)
- Copy all matches to clipboard
- Save custom patterns for reuse
- Explain mode (human-readable regex breakdown)

**Build feasibility:** Vanilla JS + MV3. Content script for highlighting. No backend.
**Estimated build time:** 2-3 days.
**Keyword potential:** "regex tester chrome", "regex highlighter" -- moderate volume, very low extension competition.

---

### 5. Accessibility Quick Audit

**What it does:** Lightweight WCAG checker that runs instant audits on the current page and shows issues as an overlay with one-click fix suggestions. Simpler and faster than axe/WAVE.

**Incumbent Analysis:**
| Extension | Users | Rating | Status |
|-----------|-------|--------|--------|
| axe DevTools | ~400,000 | 4.5 | Excellent but heavy, freemium, requires signup |
| WAVE | ~200,000 | 4.2 | Good but cluttered UI, overwhelming for beginners |
| Siteimprove | ~50,000 | 3.2 | Enterprise-focused, poor rating |
| EqualWeb | ~5,000 | 4.2 | Limited free tier |

**Why this is a strong opportunity:**
- The big players (axe, WAVE) are powerful but complex. Many developers want a quick, lightweight check -- not a full audit suite.
- Siteimprove has 50K users but only 3.2 stars -- significant dissatisfaction.
- There is a gap for a "quick check" tool that is free, fast, and beginner-friendly.
- Complements existing color-contrast-checker in the portfolio.
- Accessibility is legally mandated in many jurisdictions, driving sustained demand.

**Feature list:**
- One-click page scan (< 3 seconds)
- Visual overlay showing issues directly on elements
- WCAG 2.1 AA checks (contrast, alt text, ARIA, heading structure, form labels)
- Issue count badge on extension icon
- Severity levels (critical, serious, moderate, minor)
- Fix suggestions with code snippets
- Export issues as CSV/JSON
- Keyboard navigation audit

**Build feasibility:** Vanilla JS + MV3. DOM inspection + computed styles. No backend. More complex than others but still feasible.
**Estimated build time:** 4-5 days.
**Keyword potential:** "accessibility checker chrome", "WCAG checker" -- high search volume. Competing against big names but in a different weight class (lightweight vs enterprise).

---

## Honorable Mentions (Worth Considering Later)

### 6. HTML Validator
- Existing options rated 3.4-4.4 stars with ~2,000-5,000 users
- Could validate against W3C standards with clear error highlighting
- Build time: 2-3 days

### 7. Cookie & Storage Editor (EditThisCookie Replacement)
- EditThisCookie (3M+ users) was removed from CWS
- Several replacements exist now but the market is still settling
- Risk: the replacement space is getting crowded quickly
- Build time: 3-4 days

### 8. Image Size / Performance Checker
- Scans page images for oversized files, missing dimensions, missing alt text, wrong formats
- Existing options are scattered (4.2-4.6 stars, 1,000-5,000 users each)
- Would pair well with web-vitals-lite in the portfolio
- Build time: 2-3 days

### 9. Request/Response Header Editor
- ModHeader dominates but is freemium with aggressive upsells
- Header Editor Lite has good concept but limited adoption
- Hard to compete with ModHeader's brand recognition
- Build time: 3-4 days

### 10. Responsive Design Tester
- Responsive Viewer has 3.6 stars -- dissatisfaction exists
- But competition is higher in this space (Window Resizer, Viewport Resizer, etc.)
- Build time: 3-4 days

---

## Ranking Methodology

| Factor | Weight | #1 Z-Index | #2 Security Headers | #3 Font Previewer | #4 Regex Tester | #5 Accessibility |
|--------|--------|-----------|---------------------|-------------------|-----------------|-----------------|
| Market size (incumbent users) | 25% | Medium (6K total) | High (45K total) | High (800K+ adjacent) | Low (2K total) | Very High (700K+) |
| Competition weakness | 30% | Very Weak (broken, abandoned) | Weak (fragmented, narrow) | Weak (3.5-star leader) | Very Weak (abandoned) | Moderate (strong leaders) |
| Build feasibility | 25% | Easy | Easy | Easy | Easy | Moderate |
| Keyword potential | 20% | Good | Good | Very Good | Good | Very Good |
| **Overall Score** | | **8.5/10** | **8.0/10** | **7.5/10** | **7.5/10** | **7.0/10** |

---

## Recommended Build Order

1. **Z-Index Debugger** -- Fastest to build, weakest competition, clear pain point
2. **Security Headers Inspector** -- Unique positioning, no comprehensive competitor
3. **Regex Tester** -- Very weak competition, proven demand from regex101 traffic
4. **Font Previewer** -- Large adjacent market (WhatFont users), clear upgrade path
5. **Accessibility Quick Audit** -- Biggest market but strongest competition; build after establishing portfolio credibility

---

## Sources

- [Chrome Extension Statistics (DebugBear)](https://www.debugbear.com/blog/chrome-extension-statistics)
- [Manifest V2 Deprecation Timeline](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline)
- [Profitable Chrome Extension as a Solo Dev (ExtensionFast)](https://www.extensionfast.com/blog/how-to-build-a-profitable-chrome-extension-as-a-solo-developer-this-year)
- [Top Chrome Extension Ideas 2026 (5ly)](https://5ly.co/blog/chrome-extension-ideas/)
- [The Chrome Extension Opportunity (Medium)](https://medium.com/@e2larsen/the-chrome-extension-opportunity-662b4417dc54)
- [Best Chrome Extensions for Developers 2026 (Builder.io)](https://www.builder.io/blog/best-chrome-extensions-for-developers-2026)
- [EditThisCookie Removal (gHacks)](https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/)
- [Chrome Web Store listings](https://chromewebstore.google.com/) -- individual extension pages for user counts and ratings
