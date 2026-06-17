# ExtKit Pro — Chrome Extension SaaS Starter Kit

**Ship a paid Chrome extension this weekend.** This kit gives you the layers other boilerplates skip: ExtensionPay wiring, paywall modal, 6-hour cached `isPaid()` check, Vercel webhook backend, weekly digest cron, and three working example extensions.

Adapted from [Meeting Cost Calculator Pro](https://chromewebstore.google.com/) — the kit author's flagship paid Chrome extension, currently live and handling 100% of paid users with this exact backend pattern.

---

## What's inside

```
template/
├── src/                              # Your extension
│   ├── manifest.json
│   ├── popup/
│   │   ├── paywall.html              # Drop-in <dialog> markup
│   │   ├── paywall.css               # Theme via CSS variables
│   │   └── paywall.js                # showPaywall() / hidePaywall()
│   ├── background/
│   │   └── service-worker.js         # Wires ExtensionPay listener
│   └── lib/
│       ├── extpay-config.js          # YOUR config (edit this)
│       ├── extpay.js                 # Generic SDK wrapper
│       ├── extpay-sdk.js             # VENDORED (see lib/README)
│       └── is-paid.js                # 6-hour cached isPaid()
├── api/                              # Vercel backend
│   ├── webhook.js                    # ExtensionPay → KV subscriber index
│   ├── digest-cron.js                # Weekly Pro-only digest
│   └── README.md                     # 5-minute deploy guide
├── docs/
│   ├── PRIVACY-POLICY-TEMPLATE.html
│   ├── CWS-SUBMISSION-CHECKLIST.md
│   └── FAILURE-MODES.md              # 22-extension gotchas
├── examples/
│   ├── ai-sidebar/                   # Ollama-compatible side panel
│   ├── seo-scanner/                  # Pattern: scan-with-grade extension
│   └── css-inspector/                # Pattern: DevTools panel
├── vercel.json                       # Cron + maxDuration config
└── README.md                         # ← you are here
```

## Quick start (10 minutes to first paid extension)

### 1. Replace `extpay-config.js` with your product details

```js
// src/lib/extpay-config.js
export const EXTPAY_EXTENSION_ID = 'your-extension-id-here';
export const PRO_ENABLED = false; // flip to true after CWS approval
export const PRICE_MONTHLY = '$4.99/mo';
export const PRICE_YEARLY = '$39/yr';
```

### 2. Drop the paywall into your popup

```html
<!-- popup.html -->
<!-- ...your existing popup UI... -->
<script type="module" src="popup.js"></script>

<!-- Inline the dialog markup here, OR fetch it from popup/paywall.html -->
```

```js
// popup.js
import { setupPaywall, showPaywall } from './paywall.js';
import { isPaid } from '../lib/is-paid.js';

setupPaywall();

document.getElementById('export-csv').addEventListener('click', async () => {
  if (!(await isPaid())) {
    showPaywall();
    return;
  }
  exportCsv();
});
```

### 3. Wire the service worker

```js
// background/service-worker.js
import { loadExtPaySdk, startExtPay, fetchUserStatus, openPaymentPage, openTrialPage } from '../lib/extpay.js';
import { writePaidCache } from '../lib/is-paid.js';

importScripts('../lib/extpay-sdk.js'); // the vendored SDK

const extpay = loadExtPaySdk();
startExtPay(extpay);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'extkit/open-payment') openPaymentPage(extpay);
  if (msg?.type === 'extkit/open-trial') openTrialPage(extpay);
  if (msg?.type === 'extkit/refresh-paid-status') {
    fetchUserStatus(extpay).then(writePaidCache);
  }
});

// On ExtensionPay event, refresh the cache
extpay?.onPaid?.addListener(() => fetchUserStatus(extpay).then(writePaidCache));
```

### 4. Deploy the backend

```bash
cd template && vercel deploy --prod
```

See [api/README.md](api/README.md) for the full env-var checklist.

### 5. Ship

- Submit to Chrome Web Store with `PRO_ENABLED=false`
- After approval (~3-5 days), flip `PRO_ENABLED=true` and re-submit

## What makes this different

| Feature | ExtKit Pro ($79) | SmolStack ($49) | MV3 Kickstart Kit | ShipFast ($199-299) |
|---|---|---|---|---|
| MV3 + vanilla JS | ✅ | ✅ | ✅ | ❌ (Next.js) |
| ExtensionPay wired | ✅ | ❌ | ❌ | ❌ |
| `isPaid()` with cache | ✅ | ❌ | ❌ | ❌ |
| Paywall modal | ✅ | ❌ | ❌ | ❌ |
| Vercel webhook backend | ✅ | ❌ | ❌ | ❌ |
| Weekly digest cron | ✅ | ❌ | ❌ | ❌ |
| Author has shipped paid extensions | ✅ (22 ext + 1 paid) | ❌ | ❌ | ❌ (not extensions) |

## Failure modes documented

See [docs/FAILURE-MODES.md](docs/FAILURE-MODES.md) — the specific gotchas the author hit shipping 22 extensions, so you don't have to:

- MV3 service worker termination + state recovery
- ExtensionPay polling vs event listener race
- `chrome.storage.local` quota with cache bloat
- Chrome Web Store review tripwires (the 4 reasons your first submission gets rejected)
- Webhook retry storms — and the dedupe pattern that fixes them

## Pricing

**$79 one-time.** Includes:
- Full template source code
- Lifetime updates
- All 3 example extensions
- Email support (best-effort, solo author)

## Author

[Peak Post](https://peakpost.ca) — solo developer with 22 published Chrome extensions (~104 monthly active users) and 1 live paid extension (Meeting Cost Calculator Pro) using this exact stack.
