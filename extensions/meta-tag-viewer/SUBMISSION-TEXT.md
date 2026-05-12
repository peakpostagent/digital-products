# Meta Tag Viewer v1.0.1 — CWS Resubmission Text

**Context:** v1.0.0 was rejected by CWS. The most likely cause (identified via code+policy audit): the privacy policy promised a `storage` permission usage that didn't exist in the manifest or code — CWS reviewers verify policy/manifest/code alignment.

**Fix applied in v1.0.1:**
- Privacy policy rewritten to accurately describe what the extension actually does (no storage, no persistence, only activeTab + scripting)
- "Last updated" date refreshed to 2026-05-12
- No code changes — the original code was correct, only the policy was wrong

---

## Permission Justifications (paste into CWS Privacy practices tab)

### `activeTab`
> Required so the popup can identify the user's active tab and read its meta tags on demand. The extension does not run anywhere except on the tab the user explicitly opened the popup on. No cross-tab access, no background tabs, no automatic activation. Scoped to a single user-initiated click.

### `scripting`
> Required to execute a single static read-only function (`extractMetaTags`, defined in `popup/popup.js` lines 315-409) in the active tab's page context via `chrome.scripting.executeScript`. The function reads `<title>`, `<meta>`, and `<link rel="canonical"|"icon">` elements only — no DOM modification, no network calls, no storage access. No remote code, no dynamic code, no eval. The function is hard-coded in the extension source and cannot be modified at runtime.

### Host permissions
> Not requested. The extension uses `activeTab` exclusively, which grants temporary access only to the tab where the user clicks the extension icon.

---

## Single Purpose Description

Display SEO meta tag information (title, description, Open Graph, Twitter Cards, canonical URL, robots directives, viewport, charset, favicon) from the current web page for one-click inspection, with an SEO completeness score and an optional copy-to-clipboard summary.

---

## What's New (v1.0.1 release notes — paste into CWS)

> v1.0.1: Privacy policy rewritten for accuracy and clarity. Removed mention of a `storage` permission that was never actually requested or used. The extension's functionality is unchanged from v1.0.0 — same on-demand SEO meta tag inspection on the active tab. No new features, no new permissions, no new code.

---

## Remote code use

**No.** All scripts are packaged in the extension zip. No eval, no remote CDN, no dynamic imports, no fetch() calls.

---

## Data usage disclosure (CWS Privacy tab checkbox matrix)

- Personally identifiable info: ❌ No
- Health info: ❌ No
- Financial info: ❌ No
- Authentication info: ❌ No
- Personal communications: ❌ No
- Location: ❌ No
- Web history: ❌ No
- User activity: ❌ No
- Website content: ⚠️ **YES** — Collected: "Analyzed but not persisted" (reads `<title>`, `<meta>`, `<link>` elements; never transmitted; discarded when popup closes)
  - Transferred to third parties: ❌ No
  - Sold: ❌ No

### Three certifications — check all three
- ✅ Do not sell or transfer user data to third parties, apart from approved use cases
- ✅ Do not use or transfer user data for purposes unrelated to my item's single purpose
- ✅ Do not use or transfer user data to determine creditworthiness

---

## Privacy policy URL pattern

```
https://peakpostagent.github.io/digital-products/extensions/meta-tag-viewer/store-listing/privacy-policy.html
```

⚠️ **Before resubmitting, push the updated privacy-policy.html to GitHub Pages.** CWS reviewers visit the URL and will see a stale policy if not pushed.

---

## Pre-resubmit checklist

- [ ] `git add` privacy-policy.html + manifest.json + SUBMISSION-TEXT.md and commit
- [ ] `git push` to trigger GitHub Pages rebuild
- [ ] Verify the URL serves "Last updated: May 12, 2026"
- [ ] Run `node generate-icons.js` if you want fresh icons (the existing ones are fine)
- [ ] Build the v1.0.1 zip (if a build script exists; otherwise zip `src/` contents)
- [ ] Upload v1.0.1 zip to CWS
- [ ] Paste the permission justifications above into Privacy practices tab
- [ ] Paste the "What's New" release notes
- [ ] Paste the single-purpose description
- [ ] Submit for review

---

## Why this was rejected (theory based on code audit)

The original v1.0.0 privacy policy stated (line 41):
> "Only user preferences (such as section collapse state) are stored in `chrome.storage.local` on your device."

And (line 46):
> "**storage** — Used for storing user preferences locally on your device."

But:
- The manifest did NOT request `storage` permission
- The code did NOT call `chrome.storage` anywhere
- Nothing was actually being persisted

CWS reviewers run automated policy/manifest/code consistency checks. A policy claim of a permission that's not requested or used → flag → reject. The fix is simply to remove the false claim. No code changes needed.

If this resubmit gets rejected a second time, the next-most-likely cause would be the `innerHTML` usage pattern in `popup/popup.js` (multiple sites use innerHTML with escapeHtml; reviewers sometimes flag the pattern without inspecting the escape). Mitigation if needed: refactor to `textContent` + `createElement`, ~30 lines of mechanical changes.
