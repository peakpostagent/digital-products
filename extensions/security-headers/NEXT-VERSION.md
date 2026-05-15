# Security Headers — v1.3.0 plan

Things considered for v1.2.0 but DEFERRED to v1.3.0 to keep v1.2.0 a pure trust/correctness release. Shipping these together would have meant 30+ users seeing grade changes from 4 different sources — too noisy to debug if anyone complains.

## v1.2.0 ships first (already committed, awaiting CWS upload)

- ✅ Referrer-Policy false-positive bug fix
- ✅ Permissions-Policy length-heuristic replaced with parser
- ✅ 57 unit tests added (headers.js + utils.js)
- ✅ truncate() off-by-one fix in popup.js share canvas
- ✅ Manifest 1.1.1 → 1.2.0

---

## v1.3.0 candidates (NOT YET STARTED)

### 1. Tighten CSP evaluator (real correctness issue)

**Current behavior (lib/headers.js:32-36):**
```js
evaluate: function (value) {
  if (!value) return 'missing';
  if (value.includes("'unsafe-inline'") && value.includes("'unsafe-eval'")) return 'weak';
  return 'good';
}
```

**Problem:** A policy with `'unsafe-inline'` alone is marked `good`. That's a major XSS hole — `unsafe-inline` defeats most of CSP's purpose. securityheaders.com correctly flags this as weak. Our tool is too lenient.

**Proposed fix:**
```js
evaluate: function (value) {
  if (!value) return 'missing';
  // Either unsafe-inline OR unsafe-eval present == weak. Both is still weak.
  if (value.includes("'unsafe-inline'") || value.includes("'unsafe-eval'")) return 'weak';
  return 'good';
}
```

**User-facing impact:** Sites with React/Vue/Tailwind default builds that emit inline styles will see their CSP grade drop from `good` to `weak`. Estimated: most JavaScript-heavy sites (probably 60-80% of the audience). This is a NOTABLE grade shift across the user base.

**Mitigation strategy:**
1. Bundle with a clear "What's new" message: *"v1.3.0: CSP grading is now stricter. Inline scripts are now flagged because they defeat most of CSP's protection. See [docs] for migration."*
2. Add a "Why is this weak now?" tooltip linking to a one-paragraph explainer in the popup
3. Test on at least 10 well-known sites first (compare our grade to securityheaders.com's grade) and verify we agree

**Decision needed before shipping:** the migration friction may scare existing users. Worth A/B-testing vs keeping the loose evaluator. Honest reading: most security tools (Mozilla Observatory, securityheaders.com) flag `unsafe-inline` as weak. We should align.

### 2. Cache-Control header (informational, not scored)

Cache-Control is **content-type-dependent**:
- `Cache-Control: public, max-age=31536000` is CORRECT for `/static/css/main.css`
- `Cache-Control: public, max-age=31536000` is DANGEROUS for `/api/account/info`

We can't tell context from headers alone. Adding it to the graded list would produce false positives.

**Proposed approach for v1.3.0:**
- Add Cache-Control as **info-only** (weight: 0, severity: 'optional')
- Show the value in the popup with a "Context-dependent" badge
- Don't count toward grade
- Help text explains the trade-off

### 3. Set-Cookie security flags (per-cookie, different model)

Set-Cookie isn't a single header — it can appear multiple times in a response. Each value has its own security profile:
- `HttpOnly` (prevents JS access — critical for session cookies)
- `Secure` (HTTPS-only)
- `SameSite=Strict|Lax|None` (CSRF protection)
- `__Host-` / `__Secure-` prefixes

**Proposed approach for v1.3.0:**
- Different rendering than the current 10-header grid — a separate "Cookies" section
- For each cookie:
  - Show name
  - Show flags (HttpOnly ✓/❌, Secure ✓/❌, SameSite=X)
  - Highlight missing security flags
- Score: yes/no — "any cookie missing HttpOnly" is a concrete grade hit. Probably weight=5, severity='important'.

**Complexity:** ~80-100 LOC. Needs design for the cookie row UI in popup.js + new evaluator logic. Tests would expand to ~10 more cases. ~2 hours of work.

### 4. HSTS preload-tier check

Current evaluator passes any `max-age >= 2592000` (30 days). The preload list requires `max-age=31536000` (1 year) + `includeSubDomains` + `preload`. We could add a third tier:
- `excellent`: meets full preload requirements
- `good`: 30 days+ but not preload-ready
- `weak`: < 30 days
- `missing`: absent

Adding `'excellent'` requires extending the existing 3-tier model — bigger change. Defer.

### 5. Server / X-Powered-By information disclosure (negative-pattern check)

Servers shouldn't leak version info. `Server: nginx/1.18.0` tells attackers exactly what version to target. This is a "presence of a specific pattern == bad" check, which inverts the current "presence == good" model.

**Defer to v1.4.0** — requires evaluator architecture change.

---

## Decision matrix for "what next"

| Change | User-grade impact | Risk | LOC | Decision |
|---|---|---|---|---|
| CSP tightening | HIGH (60-80% of users drop a grade) | low (well-understood) | ~5 | Ship after explainer doc |
| Cache-Control informational | none (info-only) | low | ~30 | Safe to add anytime |
| Set-Cookie | medium (sites with bad cookies drop) | medium (new UI) | ~80-100 | Discrete feature, dedicated PR |
| HSTS preload tier | none (additive `excellent` tier) | medium (3-tier vs 4-tier model) | ~50 | Skip — diminishing returns |
| Server/X-Powered-By | none initially | medium (architecture change) | ~60 | Defer to v1.4.0 |

## Recommended v1.3.0 scope

1. CSP tightening (with the explainer doc + tooltip + 10-site verification)
2. Cache-Control informational header
3. Set-Cookie cookie inspection panel

Skip HSTS tiers and Server/X-Powered-By for now.
