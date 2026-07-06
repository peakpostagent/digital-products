# ExtKit Pro — Example Extensions

Three complete, working extensions, each teaching the paid-extension pattern in a different feature domain:

| Example | Domain | Extra pattern it teaches |
|---|---|---|
| `seo-scanner/` | Page scanning + grading | The canonical scan → gate → paywall flow |
| `css-inspector/` | DevTools-style inspection | Pro-gated data slice + JSON export gating |
| `ai-sidebar/` | Local AI (Ollama) chat | Side Panel API + **worker-enforced metered free tier** (10 msgs/day) + Pro-gated model picker |

## ⚠️ Shared files — read before loading an example

To avoid shipping three copies of the payment layer, examples import the template's shared files via relative paths:

```
../lib/extpay-config.js     ← your settings
../lib/extpay.js            ← SDK wrapper
../lib/is-paid.js           ← cached isPaid()
../lib/extpay-sdk.js        ← vendored ExtensionPay SDK
../popup/paywall.js|.css    ← paywall modal
```

**To load an example as an unpacked extension**, copy those shared files into the example first:

```bash
cd examples/seo-scanner            # or css-inspector / ai-sidebar
mkdir -p src/lib src/popup
cp ../../src/lib/*.js src/lib/
cp ../../src/popup/paywall.* src/popup/
# then: chrome://extensions → Load unpacked → select src/
```

(When you build YOUR extension from an example, just keep everything in one `src/` — the split here exists only to keep the kit DRY.)

## Icons

Examples ship without icon PNGs (they're placeholders in the manifests). Drop any 16/48/128 px PNGs into `src/icons/` before loading, or Chrome will show a default puzzle-piece — fine for local testing.
