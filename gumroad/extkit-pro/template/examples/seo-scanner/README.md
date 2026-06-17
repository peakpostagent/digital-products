# SEO Scanner — ExtKit Pro Example

This is one of the three example extensions shipped with ExtKit Pro. It demonstrates the **full free-vs-Pro pattern** end-to-end in ~250 lines of code.

## What it does

- **Free tier** — checks Title, Meta Description, H1, Canonical URL, Viewport
- **Pro tier** — adds OpenGraph, Twitter Card, JSON-LD, Image Alt Coverage + export
- A-F grade based on which checks pass

## What it teaches

| Pattern | File |
|---|---|
| Content script with dynamic ES module import | `src/content/scan.js` |
| Service worker with ExtensionPay init | `src/background/service-worker.js` |
| `isPaid()` gating in popup | `src/popup/popup.js` |
| Paywall modal drop-in | `src/popup/popup.html` |
| Grade calculator with severity weighting | `src/lib/scanner.js` |

## How to use as a buyer

1. Copy the entire `examples/seo-scanner/` folder to a new directory
2. Update `manifest.json` with YOUR extension name
3. Replace the SEO scanner logic in `src/lib/scanner.js` with YOUR feature
4. Update the paywall feature list in `popup.html` and `popup.js`
5. Configure `src/lib/extpay-config.js` (already linked from the template root)
6. `npm install -g vite` and zip src/ for CWS submission

## Local testing

```bash
# Load src/ as an unpacked extension in Chrome
chrome://extensions → Developer mode → Load unpacked → select src/
```

Open a real web page (not chrome://) → click the extension icon → see SEO grade.

## Why this is the pattern to copy

The buyer hasn't shipped a paid Chrome extension before. They have access to:
- An ExtensionPay account (not wired to anything)
- A vague idea for their extension
- ~10 hours

The fastest path to a paid extension is to take this example, rename it, and replace `scanner.js` with their feature. Everything else — paywall, isPaid cache, service worker init, manifest hygiene — stays the same.

That's why this example ships fully working, not as a placeholder.
