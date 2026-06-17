# PWA Audit

Check if any URL meets Progressive Web App installability criteria — manifest validity, service worker registration, HTTPS, icon sizes, and required manifest fields. Returns a 13-point checklist + A-F grade + binary `isInstallable` flag.

## What it does

Loads the URL in real Chromium, fetches and parses the linked Web App Manifest, validates required fields against [Chrome's installability requirements](https://web.dev/articles/install-criteria), checks for a registered service worker, and grades the result.

## Checklist

| Check | Severity | Weight |
|---|---|---|
| HTTPS or localhost | critical | 15 |
| Web App Manifest linked | critical | 15 |
| Manifest parses as valid JSON | critical | 10 |
| Has `name` | critical | 5 |
| Has `short_name` | important | 3 |
| Has `start_url` | critical | 5 |
| `display` is standalone / fullscreen / minimal-ui | critical | 8 |
| Has 192×192+ icon | critical | 8 |
| Has 512×512+ icon | critical | 8 |
| Has maskable icon | important | 5 |
| Has `theme_color` | important | 4 |
| Has `background_color` | important | 4 |
| Service worker registered | critical | 10 |

## Input

```json
{ "url": "https://web.dev" }
```

## Output

```json
{
  "url": "https://web.dev",
  "grade": "A",
  "percentage": 92,
  "isInstallable": true,
  "manifest": { "name": "web.dev", "short_name": "web.dev", "..." : "..." },
  "serviceWorker": { "supported": true, "registrationCount": 1, "scopes": ["..."], "active": true },
  "checklist": [
    { "check": "HTTPS or localhost", "passed": true, "severity": "critical", "weight": 15 },
    ...
  ]
}
```

## Use cases

- **PWA migration sprints** — audit your full site to find pages missing the manifest
- **Lighthouse alternative for CI** — faster than Lighthouse for the PWA-only checks
- **Competitive analysis** — see which competitors have a real PWA vs a fake banner

## Pricing model (when published)

Pay-per-result: **$0.05 per URL audited.** Audits take ~5-10 seconds.

## Author note

Built by [Peak Post](https://peakpost.ca), the developer behind 22 published Chrome extensions.

## Roadmap

- v1.1: shortcut + screenshots manifest field validation
- v1.2: offline page check (load URL, force offline, verify SW responds)
- v1.3: WebShare + WebPush API detection
