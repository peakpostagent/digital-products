# Security Headers — version plan

## v1.2.0 (committed, awaiting CWS upload)

- ✅ Referrer-Policy false-positive bug fix
- ✅ Permissions-Policy length-heuristic replaced with parser
- ✅ 57 unit tests added (headers.js + utils.js)
- ✅ truncate() off-by-one fix in popup.js share canvas
- ✅ Manifest 1.1.1 → 1.2.0

## v1.3.0 (committed, awaiting CWS upload)

- ✅ **CSP evaluator tightened** — `'unsafe-inline'` OR `'unsafe-eval'` alone now flags as `weak`. Previously required BOTH keywords. Matches Mozilla Observatory and securityheaders.com baselines.
- ✅ 58 unit tests (added 1 new + updated 1 existing CSP test)
- ✅ Manifest 1.2.0 → 1.3.0

### v1.3.0 user-facing impact

This is a meaningful grade-shifter for many users. Estimated 60-80% of sites have `'unsafe-inline'` in their CSP (common with React/Vue/Tailwind default builds, inline `<script>` and `<style>` tags in legacy code).

**Before v1.3.0:** these sites got a `good` rating for CSP — wrongly.
**After v1.3.0:** these sites get `weak` for CSP — correctly.

**What's new release notes (paste into CWS):**

> v1.3.0: CSP grading is now stricter. The 'unsafe-inline' and 'unsafe-eval' keywords each individually defeat most of CSP's XSS protection, so we now flag either keyword as a weak rating (previously required both to appear). This aligns with Mozilla Observatory and securityheaders.com baselines. Some sites that previously scored well on CSP may now correctly show as needing improvement — the security posture hasn't changed, only our measurement of it.

## v1.4.0 (NOT YET STARTED — design notes)

### Cache-Control (deferred — context-dependent)

Adding Cache-Control as a graded header risks false positives:
- `Cache-Control: public, max-age=31536000` is CORRECT for `/static/css/main.css`
- `Cache-Control: public, max-age=31536000` is DANGEROUS for `/api/account/info`

We can't tell context from headers alone. To add this safely we'd need:
- A "Diagnostic" panel in the popup (separate from the graded headers grid)
- Display the value with no pass/fail
- Help text explaining the trade-off
- ~30-50 LOC for the new render path

Skip for v1.4.0 unless a user explicitly requests it.

### Set-Cookie security flags (deferred — needs new permission)

**Blocker:** the Fetch API treats `Set-Cookie` as a "forbidden response header" — JavaScript fetch CANNOT read Set-Cookie values, period. So the current popup→content-script→fetch pipeline can't see them.

To check cookie security flags we'd need to:
1. Add the `cookies` permission to manifest.json (CWS review trigger — almost certainly triggers in-depth review)
2. Use `chrome.cookies.getAll({ url: tab.url })` to read cookies that ARE on the page
3. Inspect each cookie's `httpOnly`, `secure`, `sameSite` properties
4. New UI section listing cookies with their flag status
5. ~80-100 LOC + new permission justification + privacy policy update

This is a meaningful feature but a dedicated PR. Worth doing AFTER v1.3.0 ships and the grade-shift dust settles.

### HSTS preload-tier check (skip — diminishing returns)

Adding an `excellent` tier to the existing good/weak/missing model would require evaluator architecture changes for marginal benefit.

### Server / X-Powered-By information disclosure (deferred — architecture change)

These are "presence of pattern == bad" checks, opposite of the current model. Defer until we have a clearer model for negative-pattern headers.

---

## Decision matrix snapshot

| Change | Ships in | User-grade impact |
|---|---|---|
| Referrer-Policy fix | v1.2.0 ✅ | small (permissive policies now correctly flagged) |
| Permissions-Policy fix | v1.2.0 ✅ | small (wildcard policies now correctly flagged) |
| CSP tightening | v1.3.0 ✅ | LARGE (60-80% of sites drop CSP grade) |
| Cache-Control informational | v1.4.0 | none (informational only) |
| Set-Cookie flags | v1.4.0+ | medium — needs new permission |
| HSTS preload tier | skip | n/a |
| Server/X-Powered-By | v1.5.0+ | low |
