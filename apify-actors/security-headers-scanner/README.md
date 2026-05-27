# Security Headers Scanner

Grade any website's HTTP security headers — **letter grade A+ to F**, severity breakdown, per-header pass/weak/missing status, and copy-paste config snippets for Nginx / Apache / Express / Cloudflare.

Direct port of the [Security Headers Chrome extension](https://chromewebstore.google.com/) (33 active users, organic CWS traction with zero marketing). Same evaluator logic, same scoring, same letter grade.

## Use cases

- **Pre-launch security audit** — grade a staging site before going live
- **Compliance dashboards** — feed grades into your SOC2 / ISO27001 evidence pipeline
- **Vendor security review** — score third-party services your stack depends on
- **Hosting provider QA** — check that your edge config actually shipped the headers you configured

## Input

```json
{
  "url": "https://example.com"
}
```

Or batch mode:

```json
{
  "urls": [
    "https://example.com",
    "https://stripe.com",
    "https://github.com"
  ]
}
```

Max 1000 URLs per run.

## Output (per URL)

```json
{
  "url": "https://example.com",
  "finalUrl": "https://example.com",
  "httpStatus": 200,
  "grade": "B",
  "percentage": 74,
  "score": 67,
  "maxScore": 90,
  "criticalIssues": 1,
  "importantIssues": 1,
  "optionalIssues": 0,
  "headers": [
    {
      "name": "Content-Security-Policy",
      "status": "weak",
      "value": "script-src 'self' 'unsafe-inline'",
      "severity": "critical",
      "deprecated": false,
      "recommendation": "Set a restrictive policy..."
    }
    /* ... 9 more ... */
  ],
  "rawHeaders": { "...": "..." },
  "plainTextReport": "Security Headers Report\nURL: ...",
  "scannedAt": "2026-05-15T22:00:00.000Z",
  "scannerVersion": "1.3.0"
}
```

## Headers checked

Ten security-relevant HTTP response headers:

| Header | Severity | Weight |
|---|---|---|
| Content-Security-Policy | critical | 15 |
| Strict-Transport-Security | critical | 15 |
| X-Content-Type-Options | important | 10 |
| X-Frame-Options | critical | 10 |
| Referrer-Policy | important | 8 |
| Permissions-Policy | important | 8 |
| Cross-Origin-Opener-Policy | optional | 7 |
| Cross-Origin-Resource-Policy | optional | 7 |
| Cross-Origin-Embedder-Policy | optional | 7 |
| X-XSS-Protection (deprecated) | optional | 3 |

## Grading

- **A+** (95-100%) — top-tier, exceeds best practices
- **A** (85-94%) — strong, minor gaps
- **B** (70-84%) — adequate, weak in 2-3 areas
- **C** (55-69%) — incomplete, multiple missing headers
- **D** (40-54%) — significant gaps
- **F** (< 40%) — no meaningful security headers

## Evaluator strictness (v1.3.0)

This version uses the **strict evaluators** that match Mozilla Observatory and securityheaders.com baselines:
- **Content-Security-Policy** with `'unsafe-inline'` OR `'unsafe-eval'` → weak
- **Referrer-Policy** values outside the strict allowlist (e.g. `origin`, `no-referrer-when-downgrade`) → weak
- **Permissions-Policy** with any wildcard `*` directive → weak

Earlier scanner versions were more lenient. If you're comparing against scans from before May 2026, expect some grades to drop — these are corrections, not regressions in your security posture.

## Pricing

- **Free tier:** 100 scans/month
- **Standard:** $0.005 per URL scanned
- **Subscription:** $19/month for 10,000 scans

## Author

Built and maintained by Peak Post. Open source code at [peakpost.ca](https://peakpost.ca).
