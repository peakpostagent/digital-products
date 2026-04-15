# Chrome Web Store Listing - Security Headers v1.1.0

## Extension Name
Security Headers

## Short Description (132 chars max)
Check HTTP security headers on any site. Letter grade, severity levels, fix snippets, batch scan, and side-by-side compare.

## Detailed Description

Security Headers is a fast, privacy-first Chrome extension that inspects the HTTP response headers on any website and gives you an instant letter grade. v1.1.0 adds severity levels, per-framework fix snippets, batch scanning, site comparison, and shareable report cards.

HOW IT WORKS:
1. Open any website
2. Click the extension icon
3. Hit "Scan This Page" - get an instant letter grade (A+ to F)
4. Expand any header for a deep dive: what attack it prevents, a real-world breach example, and a ready-to-paste fix snippet for Nginx, Apache, Express, or Cloudflare

WHAT'S NEW IN v1.1.0:

Severity Levels - Missing headers are now classified as Critical, Important, or Optional. CSP, HSTS, and X-Frame-Options are Critical. Referrer-Policy and X-Content-Type-Options are Important. COEP and CORP are Optional. Your grade weights critical misses more heavily, and three severity pills at the top let you triage issues at a glance.

Fix Recommendations with Copy-to-Clipboard - Every missing or weak header now shows a ready-to-paste config snippet for Nginx, Apache, Express/Node, and Cloudflare. One click copies the snippet to your clipboard so you can drop it into your server config.

Detailed Header Explanations - Expand any header to learn what attack it prevents, a real-world breach where that attack was used (British Airways, Firesheep, Twitter clickjacking, Spectre), and the recommended value. Turn any security audit into a learning session.

Batch Scan Multiple URLs - Paste a list of URLs, one per line, and scan them all in sequence. Results show as a sortable table with grade, missing header count, and critical issue count. Export the whole batch as CSV for reporting or tracking.

Side-by-Side Site Compare - Click Compare With Another Site and enter any URL to see grades side-by-side with a per-header diff table. Handy for staging vs production or your site vs a competitor.

Share Report as Image - Generate a polished PNG of the grade card - site, grade, severity counts, and top issues. Copy the image to your clipboard or download it to share on socials, Slack, or a report.

CORE FEATURES:
- Checks 10 critical HTTP security headers
- Instant letter grade with color-coded results
- Expandable per-header detail with attack examples
- Per-framework fix snippets (Nginx, Apache, Express, Cloudflare)
- Critical / Important / Optional severity classification
- Batch-scan any number of URLs with CSV export
- Side-by-side site compare
- Share report as PNG image
- Scan history (last 50 scans)
- Extension badge shows the letter grade at a glance
- 100% local - no data leaves your browser

HEADERS CHECKED:
- Content-Security-Policy (XSS, injection, clickjacking)
- Strict-Transport-Security (protocol downgrade attacks)
- X-Frame-Options (clickjacking)
- X-Content-Type-Options (MIME sniffing)
- Referrer-Policy (referrer leakage)
- Permissions-Policy (unauthorized feature access)
- Cross-Origin-Opener-Policy (cross-origin isolation)
- Cross-Origin-Resource-Policy (resource read protection)
- Cross-Origin-Embedder-Policy (Spectre-class defenses)
- X-XSS-Protection (legacy)

WHO IT'S FOR:
- Web developers auditing their own sites
- Security engineers doing quick header reviews
- DevOps teams comparing staging and production
- Anyone learning what each security header actually does

PRIVACY FIRST:
- All scans happen locally in your browser
- No data is ever sent to external servers
- No accounts, no sign-ups, no tracking
- History is stored locally and can be cleared any time

FREE TO USE:
Security Headers is completely free with no hidden costs and no ads.

## Category
Developer Tools

## Language
English

## Single Purpose Description
Inspects HTTP response security headers on the active tab and user-provided URLs, assigns a weighted letter grade based on header presence and configuration, and presents per-header details, fix snippets, and comparison tools.

## Permission Justifications

**storage** - Stores the user's scan history locally so they can revisit past scans.

**activeTab** - Reads the URL of the current tab when the user clicks Scan so the extension can fetch and analyze the page's response headers.

**scripting** - Injects a small HEAD fetch into the active tab so that same-origin response headers can be retrieved for analysis.

**host_permissions (<all_urls>)** - Required for Batch Scan and Compare features so the extension can fetch headers from any user-entered URL directly from the extension (no page context needed).
