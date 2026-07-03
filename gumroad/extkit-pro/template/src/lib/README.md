# lib/ — Payment layer

| File | What it is | Do you edit it? |
|---|---|---|
| `extpay-config.js` | **YOUR settings** — extension ID, prices, trial | ✅ Yes — this is the only file you must edit |
| `extpay.js` | Generic wrapper around the ExtensionPay SDK | Only if you know why |
| `is-paid.js` | Cached `isPaid()` helper (6-hour TTL) | Only if you know why |
| `extpay-sdk.js` | **Vendored** ExtensionPay SDK (ExtPay.js) | ❌ Never by hand |

## About the vendored SDK

`extpay-sdk.js` is a vendored copy of [ExtPay.js](https://github.com/Glench/ExtPay) — the official ExtensionPay client library. It's committed to the repo (rather than pulled from npm) deliberately:

1. **Auditable updates** — when you bump the SDK, the diff shows exactly what changed in code that touches payments
2. **No build step** — MV3 service workers load it directly via `importScripts()` / dynamic `import()`
3. **CWS review friendliness** — reviewers can read the actual payment code in your submission

## Updating the SDK

```bash
curl -o src/lib/extpay-sdk.js https://raw.githubusercontent.com/Glench/ExtPay/main/dist/ExtPay.js
git diff src/lib/extpay-sdk.js   # review what changed before committing
```

Check the [ExtPay releases page](https://github.com/Glench/ExtPay/releases) for breaking changes — especially around plan handling (multi-plan support requires ExtPay 3.1+).

This copy was vendored from a production extension (Meeting Cost Calculator Pro) — the same file processing live payments today.
