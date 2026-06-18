# HTTP Protocol & Compression Audit

Find out how a URL is actually served. HTTP/1.1 vs HTTP/2 vs HTTP/3, Brotli vs gzip vs nothing, cache headers, HSTS — A-F grade and a punch-list of perf wins.

## What it checks

| Check | Why it matters |
|---|---|
| HTTPS | Modern baseline; required for HTTP/2 + HTTP/3 |
| HTTP/2 / HTTP/3 (Alt-Svc) | Repeat-visit speedup, esp. on flaky networks |
| Brotli vs gzip vs none | Brotli saves 15-25% over gzip; "none" leaves 70% on the table |
| Cache-Control | Default browser caching is suboptimal |
| ETag + Last-Modified | Skip costly re-downloads on 304 responses |
| HSTS | Prevent first-visit downgrade attacks |
| Server fingerprint | Helps lead-gen for managed-hosting consultancies |

## Input

```json
{ "url": "https://example.com" }
```

## Output

```json
{
  "url": "...",
  "grade": "B",
  "score": 75,
  "protocol": {
    "isHttps": true,
    "altSvc": "h3=\":443\"; ma=86400",
    "supportsH3": true,
    "server": "Cloudflare"
  },
  "compression": {
    "type": "br",
    "contentEncoding": "br",
    "sizeBytesReceived": 12340
  },
  "caching": {
    "cacheControl": "public, max-age=3600",
    "etag": "present",
    "lastModified": "missing"
  },
  "security": {
    "hsts": "max-age=31536000; includeSubDomains"
  },
  "issues": []
}
```

## Use cases

- **Perf consultants** — qualify prospects by which servers can be sped up with config-only fixes
- **Hosting migration prep** — verify the new CDN actually does what was promised
- **Infrastructure audits** — find every server still on HTTP/1.1
- **Lead enrichment** — find sites running gzip → propose a Brotli config

## Pricing

Pay-per-result: **$0.005/URL.** Fetch-only.

## Author

Built by [Peak Post](https://peakpost.ca). Part of the Web Performance Suite alongside Web Vitals Reporter and PWA Audit.
