# Tracking Pixel Detector

Detect every analytics, advertising, session-replay, and chat tracker on a URL. 25+ trackers covered. Returns per-tracker evidence + GDPR/CCPA compliance hints.

## What it detects

### Analytics
- Google Analytics 4 + Universal
- Google Tag Manager
- Plausible, Fathom, Simple Analytics, Matomo
- PostHog, Amplitude, Mixpanel, Heap, Segment

### Session replay
- Hotjar, Microsoft Clarity, FullStory, LogRocket

### Advertising
- Facebook (Meta) Pixel
- TikTok Pixel
- LinkedIn Insight
- Twitter/X Pixel
- Pinterest Tag
- Reddit Pixel
- Google Ads / DoubleClick

### Chat / marketing automation
- Intercom, Drift, Tawk.to
- HubSpot

## Input

```json
{ "url": "https://example.com" }
```

## Output

```json
{
  "url": "...",
  "trackerCount": 6,
  "detected": [
    {
      "name": "Google Tag Manager",
      "category": "tag-manager",
      "vendor": "Google",
      "evidence": [
        { "type": "script-src", "match": "googletagmanager.com/gtm.js" },
        { "type": "inline-pattern", "match": "/GTM-[A-Z0-9]+/" }
      ]
    },
    {
      "name": "Facebook Pixel",
      "category": "advertising",
      "vendor": "Meta",
      "evidence": [{ "type": "inline-pattern", "match": "/fbq\\s*\\(/" }]
    }
  ],
  "byCategory": { "tag-manager": 1, "advertising": 1, "analytics": 2, "session-replay": 2 },
  "complianceFlags": [
    "Advertising trackers detected — GDPR consent required in EU",
    "Session-replay tools detected — CCPA + GDPR-sensitive data exposure risk"
  ]
}
```

## Use cases

- **Privacy audits** — find every tracker before EU/CA launch
- **GDPR compliance triage** — list what needs to land in your cookie banner
- **Competitive analysis** — see which trackers your competitors run
- **Lead enrichment for privacy consultants** — find prospects running too many trackers

## Pricing

Pay-per-result: **$0.005/URL.** Fetch-only.

## Limitations

This Actor scans raw HTML — trackers loaded via lazy JavaScript injection (after user interaction, after cookie consent, etc.) may not appear. For full network-level coverage, pair with a Playwright-based variant in the same portfolio.

## Author

Built by [Peak Post](https://peakpost.ca). Part of the Privacy Audit Suite.
