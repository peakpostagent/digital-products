# Console Catcher v1.0.3 — CWS Submission Text

**Context: this extension has been rejected 3 times already.** The 4th submission must be airtight. Every permission is justified with a direct reference to the code feature that uses it — CWS reviewers want to see a one-to-one mapping, not vague "for features" hand-waving. Paste the sections below into the Chrome Web Store Developer Dashboard verbatim.

---

## Single purpose description

Console Catcher captures `console.log` / `warn` / `error` / `info` / `debug` calls and unhandled errors from the active tab's webpage so developers can review them later in the extension popup, even if DevTools was not open when the message fired.

---

## Permission justifications

### `storage`
Required to persist captured console entries across popup open/close cycles and to remember per-tab capture on/off state. All data is stored locally via `chrome.storage.local` (see `background/service-worker.js` lines 97–110) and is cleared automatically when the tab is closed or navigates (lines 176–193). Nothing is ever transmitted off-device.

### `activeTab` (NEW in v1.0.3)
Required for the "Run Test" button in the popup (`popup/popup.js` lines 293–311), which lets a user verify the extension is capturing correctly by injecting four sample `console.log` / `warn` / `error` / `info` calls into the page they are currently viewing. `activeTab` scopes this injection strictly to the tab where the user opened the popup and clicked the button — no background or cross-tab access is possible.

### `scripting` (NEW in v1.0.3)
Required by the same "Run Test" button to call `chrome.scripting.executeScript` (`popup/popup.js` line 297) with a hard-coded inline function that runs four `console.*` statements in the MAIN world. No remote code, no dynamic code, no `eval`, no user-supplied strings are ever executed. The injected function is statically defined in the popup source and performs no DOM reads, no network requests, and no storage access.

### Broad host match (`<all_urls>` in content scripts)
The product's purpose is capturing console output from *any* website a developer is debugging — restricting it to a fixed host list would break the feature for every intended use case. Content scripts only read `console.*` call arguments via a wrapper in the MAIN world (`page/override.js`) and forward them via `window.postMessage` to the isolated content script, which relays them to the service worker. No page content, form data, cookies, or request data is read or transmitted.

---

## Remote code use

**No.** All scripts are packaged in the extension zip. No eval, no remote CDN, no dynamic imports.

---

## Data usage disclosure

**"I do not collect or transmit user data."**

All captured console entries live in `chrome.storage.local` and never leave the user's device. Specifically:
- No network calls from the service worker (verify via `service-worker.js` — search for `fetch`, `XMLHttpRequest`, `sendBeacon` — zero hits)
- No telemetry
- No analytics opt-in (Console Catcher does not use GA4)
- No crash reporting

---

## What's new in this version (release notes)

> v1.0.3 adds a "Run Test" button on the empty state that injects four sample console calls (log/warn/error/info) into the current tab so users can verify capture is working without needing their own console output. Also adds a restricted-page warning (chrome://, file://, etc.) so users on system pages understand why capture isn't available there. Requires two new permissions — activeTab and scripting — both used exclusively by the Run Test button.

---

## Why 3 prior rejections — things to pre-empt

### Rejection likelihood #1 — `innerHTML` assignments in popup.js
Lines 142-143, 150, 159-161 assign to `innerHTML`. Every string is passed through `escapeHtml()` first (see line 130, 136, 137, 139, 144 for the escape calls). A reviewer skimming the code may flag this without noticing the escaping.

**Mitigation for this submission:** Add a comment block at the top of `popup.js` explicitly stating: "All dynamic strings routed through `escapeHtml()` before assignment to `innerHTML` — see escape call sites at lines 130, 136, 137, 139, 144."

**If rejected again for this:** refactor to `textContent` + `createElement` — removes the pattern entirely. Not recommending now because the change is large and escaping is correct.

### Rejection likelihood #2 — log entries store `msg.url`
`service-worker.js:94` captures and persists the page URL for every console entry, but the popup never displays it. Dead data collection looks suspicious to reviewers even when it's harmless.

**Recommendation:** Either surface the URL in the popup (even a small hover tooltip), or stop storing it. Shipping without this fix means a reviewer could ask "why do you retain URLs you don't show?"

### Rejection likelihood #3 — `<all_urls>` + content script at `document_start`
This is correct for the feature but triggers the CWS broad-host-access review. The justification section above addresses it directly. Ensure the privacy policy (`store-listing/privacy-policy.html`) also explicitly states: "Console Catcher reads `console.*` call arguments only. No page content, form data, cookies, or request data is read or transmitted." If that sentence isn't already in the privacy policy, add it.

### Rejection likelihood #4 — Test button is the ONLY reason new permissions exist
If rejected a 4th time, the fast fallback is: delete the Run Test button entirely. The core product works without it (capture has always been autonomous via content scripts). Rolling back to v1.0.2 minus the rejected content change is option B.

---

## Pre-upload sanity checklist

- [ ] `popup.js` top-of-file comment added about `escapeHtml()` + `innerHTML` safety
- [ ] Decide on `msg.url`: surface it or stop storing it (commit + rebuild zip)
- [ ] `privacy-policy.html` has the explicit "reads `console.*` arguments only" sentence
- [ ] Zip regenerated from `src/` after any fixes
- [ ] "What's new" release notes pasted verbatim from above
- [ ] Permission justifications pasted verbatim from above
- [ ] Single-purpose description pasted verbatim from above
