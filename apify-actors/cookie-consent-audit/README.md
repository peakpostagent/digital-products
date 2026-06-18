# Cookie Consent Banner Audit

Detect cookie consent banners on any URL. Identifies which CMP vendor is in use, flags pre-consent cookie placement (a strict-GDPR violation), and returns an A-F compliance grade.

## What it detects

18 major Consent Management Platform (CMP) vendors:

OneTrust, Cookiebot, TrustArc, Iubenda, Quantcast Choice, Usercentrics, Didomi, CookieYes, Termly, CookieScript, Klaro (PrivacyTools), Osano, Civic Cookie Control, Cookiepro, Sourcepoint, tarteaucitron, GDPR-by-WP, plus custom/unknown banners.

## What it catches

| Flag | Severity |
|---|---|
| Trackers detected but NO consent banner | Critical — likely GDPR non-compliant |
| 3+ cookies set BEFORE consent | Critical — strict GDPR violation |
| CMP found but no TCF v2 consent string | Important — may be non-compliant in EU |
| No cookie banner (and no trackers) | Low — site is probably fine |

## Input

```json
{ "url": "https://example.com" }
```

## Output

```json
{
  "url": "...",
  "grade": "C",
  "score": 60,
  "cmpDetected": true,
  "cmps": [
    {
      "vendor": "OneTrust",
      "evidence": [
        { "type": "script-host", "match": "cdn.cookielaw.org" },
        { "type": "dom-marker", "match": "#onetrust-consent-sdk" }
      ]
    }
  ],
  "trackersFoundInHtml": ["Google Tag Manager", "Facebook Pixel"],
  "cookiesSetBeforeConsent": 6,
  "hasTcfConsent": false,
  "issues": [
    "6 cookies set BEFORE user could consent — strict GDPR violation",
    "CMP detected but no TCF v2 consent string — may be non-compliant in EU"
  ]
}
```

## Use cases

- **GDPR compliance audits** — for EU/UK customer-facing sites
- **Lead enrichment for privacy consultants** — find prospects failing TCF v2
- **Competitive analysis** — what CMP do your peers use?
- **Pre-launch QA** — verify the consent banner actually loads before users see trackers

## Pricing

Pay-per-result: **$0.005/URL.** Fetch-only.

## Limitations

This Actor parses raw HTML — banners loaded only after JavaScript execution may not be detected. For full coverage on SPAs, pair with the Playwright-based Tracking Pixel Detector from the same author.

## Author

Built by [Peak Post](https://peakpost.ca). Part of the Privacy Audit Suite alongside Tracking Pixel Detector.
