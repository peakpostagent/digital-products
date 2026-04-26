# CWS Analytics Tools — usage guide

Two new tools added to `claude-browser-mcp` (and inherited by `browser-fork`) for repeatable, accurate Chrome Web Store dashboard scraping. Replaces ad-hoc "screenshot and read" workflows that risk the 2000px image-size error AND were error-prone (memory drift, OCR ambiguity).

Both tools live in the MCP at:
- `C:\Users\colet\Documents\claude-browser-mcp\src\tools\cws_pull_items.ts`
- `C:\Users\colet\Documents\claude-browser-mcp\src\tools\cws_pull_item_analytics.ts`

Built to `dist/tools/*.js`. Registered in the MCP server.

---

## Tool 1 — `mcp__browser-fork__cws_pull_items`

Pulls the master items list from CWS Developer Dashboard. Returns structured JSON per extension.

### Input
```json
{
  "timeoutMs": 45000,         // optional, default 45s
  "includeArchived": false    // optional, default false (matches dashboard default)
}
```

### Output (success)
```json
{
  "ok": true,
  "accountUrl": "https://chrome.google.com/webstore/devconsole/{accountId}",
  "itemCount": 22,
  "items": [
    {
      "name": "Meeting Cost Calculator",
      "version": "1.2.0",
      "type": "Extension",
      "createdAt": "Mar 10, 2026",
      "lastUpdatedAt": "Apr 23, 2026",
      "rating": "—",
      "users": 1,
      "status": "Pending review",
      "itemUrl": "https://chrome.google.com/webstore/devconsole/abc/xyz/edit/..."
    },
    /* ... one entry per extension ... */
  ]
}
```

### Output (auth required)
```json
{
  "ok": false,
  "authRequired": true,
  "redirectedTo": "https://accounts.google.com/v3/signin/..."
}
```

### Output (other failure)
```json
{
  "ok": false,
  "reason": "Items grid did not load within timeout — CWS may have changed its DOM, or the account has zero items."
}
```

### When to use
- "What's the current state of all my extensions?" — single tool call, gets everything
- Comparing user counts week-over-week
- Detecting status changes (which got rejected, which got approved)
- Pre-CWS-submit sanity check

### When NOT to use
- Drilling into a single extension's analytics — use Tool 2 instead
- Pulling country/uninstall/install-trend breakdowns — use Tool 2
- GA4 data — these tools read CWS NATIVE metrics only

---

## Tool 2 — `mcp__browser-fork__cws_pull_item_analytics`

Drills into a specific extension's Analytics tab. Returns structured per-extension analytics.

### Input
```json
{
  "itemUrl": "https://chrome.google.com/...",   // PREFERRED — from Tool 1's output
  "itemName": "Meeting Cost Calculator",        // OR substring match against items list (slower)
  "timeoutMs": 45000
}
```

Provide either `itemUrl` (faster, exact) or `itemName`. URL preferred.

### Output (success)
```json
{
  "ok": true,
  "analytics": {
    "itemName": "Meeting Cost Calculator",
    "itemUrl": "https://chrome.google.com/...",
    "weeklyActiveUsers": 1,
    "totalInstalls": 47,
    "rating": { "average": null, "count": null },
    "countries": [],         // populated in v2
    "uninstalls": { "last7Days": null, "last28Days": null },  // v2
    "rawSnapshot": "Meeting Cost Calculator Analytics ..."  // up to 4000 chars of raw page text for diagnostic
  }
}
```

### When to use
- "How many weekly active users does MCC have right now?"
- Comparing pre/post-update metrics on a single extension
- Verifying the user count in CWS native metrics

### Caveats
- v0.1 implementation: weekly-active and total-installs are best-effort regex parses of the page text. If parsing fails, the field is `null` and the raw text snapshot is included so you can adjust regexes.
- Country breakdown + uninstall reasons are deferred to v2 (require chart-data scraping)
- This is CWS's NATIVE metrics — not GA4

---

## Activation steps (REQUIRED before first use)

Both tools require the Google account session to be present in the `browser-fork` profile (currently empty / headless). Two paths:

### Path A — One-time auth bootstrap (recommended)

1. **Close all your regular Chrome windows** (Task Manager → end any straggler `chrome.exe` if needed)
2. **Run the channel switcher:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File "C:\Users\colet\Documents\claude-browser-mcp-fork\switch-to-chrome.ps1"
   ```
3. **Restart Claude Code** (so the new env var loads)
4. **Tell me "auth bootstrap ready"** — I'll navigate to `https://chrome.google.com/webstore/devconsole/`, the page redirects to Google login, you sign in (your Google credentials, not chat). Cookies save to fork profile.
5. **Switch back to headless once authenticated:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File "C:\Users\colet\Documents\claude-browser-mcp-fork\switch-to-headless.ps1"
   ```
6. **Restart Claude Code one more time** — this is the LAST setup restart, going forward both tools work autonomously.

### Path B — Stay on chrome channel permanently

Skip step 5/6 above. Pros: only one restart. Cons: every browser action opens a visible Chrome window (focus-stealing during autonomous work).

### Path C — Manual cookie import (advanced, not documented here)

Export Google cookies from your regular Chrome → import to fork profile. Complex; only worth it if A/B don't work for you.

---

## Reload required after MCP rebuild

The MCP source was rebuilt today (2026-04-26) to add these tools. The currently-running MCP process is using the OLD dist that doesn't have these tools registered.

**To activate the new tools:** restart Claude Code once. The MCP server respawns with the new dist on Claude Code startup.

You can verify activation after restart by asking me to run `cws_pull_items` — if the tool name resolves, you're good. If not, the dist didn't reload.

---

## How I'll use these tools going forward

When you ask "what's the state of my extensions" or "pull the latest CWS numbers", I'll:
1. Call `cws_pull_items` (one call, all 22 extensions)
2. Parse the JSON, present a sortable table
3. Compare against the previous run if you want week-over-week deltas
4. For any extension where you ask "tell me more", call `cws_pull_item_analytics` with the `itemUrl` from step 1's output

No more screenshots of the CWS dashboard. No more memory-drift between runs. No more 2000px image errors.

---

## Future extensions to this toolkit

If/when needed, similar tools could be added:
- `gumroad_pull_products` — pull Gumroad sales / views per product
- `ga4_pull_property` — pull a Google Analytics 4 property's weekly/monthly numbers
- `vercel_pull_deployments` — pull Vercel deployment status
- `extensionpay_pull_subscribers` — pull active subscriber counts from ExtensionPay
- `stripe_pull_payouts` — pull recent Stripe payout history

Each would follow the same pattern: dedicated TypeScript file in `claude-browser-mcp/src/tools/`, structured JSON output, auth-required failure mode, no raw screenshots.
