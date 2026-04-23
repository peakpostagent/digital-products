# Project: Digital Product Portfolio

## Overview
A portfolio of Chrome extensions and Gumroad digital products, built primarily by AI agents, monetized via marketplace discovery (no paid marketing). Current state: **23 Chrome extensions** (16 published on CWS, 20-slot limit), **7 Gumroad products live** (all at zero sales as of 2026-04-19), **MCC Pro** paid tier in-flight as first real monetization attempt.

## Structure

### Chrome Extensions (`/extensions/`)
23 subdirectories, one per extension. Canonical layout:
```
extensions/<name>/
  src/                  # loaded unpacked + zipped for CWS
    manifest.json
    background/service-worker.js   (or background.js in older ones)
    content/content.js             (when the extension needs page access)
    popup/popup.{html,css,js}
    lib/*.js                       (shared helpers)
    icons/                         (16, 48, 128 px)
  store-listing/
    screenshots/                   (rendered from *.html templates)
    privacy-policy.html
    description.md
  tests/                           (Vitest — not universally present yet)
  package.json                     (dev deps only; no runtime deps in extensions)
```

Top user-count extensions (28d, per 2026-04-19 portfolio snapshot):
- Meeting Cost Calculator (15) — flagship, first paid tier incoming
- CSS Variables Inspector (12)
- Security Headers (11)
- Review Clock (10)
- Job Match Score (6)

Full roster in `C:\Users\colet\.claude\projects\C--Users-colet-Documents-Digital-Product-Wokring-Ideas\memory\project_portfolio_status.md`.

### APIs (`/apis/`)
- **`email-subject-generator/`** — Vercel serverless function for RapidAPI (Node.js)
- **`mcc-insights/`** — Vercel backend for MCC Pro weekly digest emails. Cron `0 9 * * 1`, uses OpenAI gpt-4o-mini + Resend + Vercel KV. See `apis/mcc-insights/DEPLOY.md`.

### Gumroad products (`/gumroad/`)
One subdirectory per product. Each has `gumroad-listing.md`, cover, marketing-images, and the delivery zip. Current live: developer-prompt-toolkit, freelancer-business-box, habit-tracker, project-estimator, (+ 3 others with no local dir audited on Gumroad directly). Staged-but-not-uploaded: git-command-pack, AI-Swimsuit-Pose-Library, AI-Model-Generator-Kit (SKU collision — same as live AI Character Image Generator Kit), fantasy-rpg-npc-portraits/sample (blocked on ComfyUI pipeline).

### Internal tooling (`/tools/`)
- **`extension-artwork/`** — Node script that POSTs ComfyUI workflows to generate all CWS artwork (icons, screenshots, promo images, marquee) for 16 extensions via JuggernautXL v9. Actively used.
- **`character-asset-system/`** — Node/Express/sql.js web app that drives ComfyUI batch generation for 20 characters × 6 expressions = 120 portraits. Feeds into `gumroad/fantasy-rpg-npc-portraits/`. In-flight, blocked on ComfyUI restart + IPAdapter workflow.

### Automation (`/automation/`)
- `n8n/` — aspirational, workflows dir empty, not wired up
- `crewai/` — skeleton only, prints "not yet implemented"
- `scripts/` — ad-hoc shell/Python, ollama-driven code review etc.

### Docs (`/docs/`)
- `agentic-income-research.md` — scored ideas backlog (MCC Pro is top-ranked)
- `competitive-extension-research.md` — ranks next-extension opportunities
- `traffic-and-marketing-strategy.md`
- `performance-tracker.md` — revenue tracking
- `cws-submission-template.md`

## Conventions

### Language / framework
- **Vanilla JavaScript only** — no TypeScript, no React, no bundlers
- Use ES modules (`import`/`export`) where the runtime supports them (popup, background service workers, Node scripts). Content scripts CANNOT use modules — use script-loading order in manifest.
- Keep functions small and well-commented for beginner readability
- User-facing strings should be easy to find and change (single declaration near top of file, not scattered)

### Testing
- Test files go in `/tests/` subdirectories of each extension/API
- Use Vitest (`vitest run`)
- Test coverage is uneven; gradually adding where a bug has hit production

### Chrome Extension rules
- Manifest V3 only (no MV2 patterns)
- No inline scripts in HTML files (MV3 CSP requirement)
- Use `chrome.storage.local` for data persistence
- Content scripts must not break host page styling (shadow DOM or prefixed classes)
- Minimize permissions — audit all `permissions` and `host_permissions` before every CWS submission
- Screenshots + icons regenerated via `tools/extension-artwork/` — don't edit PNGs by hand

### API rules
- Each Vercel serverless function is a single file in `/api/`
- Always validate input before processing (regex for emails, allowlist for enum strings)
- Always return proper HTTP status codes and JSON error messages
- Include CORS headers for cross-origin calls
- Rate limiting usually handled by the platform (RapidAPI for public APIs, no rate limit in mcc-insights since access is gated by ExtensionPay)
- Keep OpenAI API costs under $10/month with hard spend caps on the account

### MCC Pro / paid tier pattern
- Payments via ExtensionPay (Stripe under the hood)
- Vendored SDK at `extensions/<name>/src/lib/extpay-sdk.js` (not npm — visible diff on update)
- Feature gating via `isPaid()` check in popup, cached in `chrome.storage.local` with 6-hour refresh
- Backend at `apis/mcc-insights/` pattern clones for future paid tiers (Security Headers Pro, CSS Variables Inspector Pro)

## Git
- Commit messages: `type: description` (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `vendor:`)
- Never commit `.env`, `node_modules`, API keys, or Stripe secrets
- Commit frequently — small, focused commits
- Binary regens (icons, screenshots) should be committed separately from code changes so revert is easy

## Local LLM
- Ollama + Qwen3 14B on `localhost:11434`
- Used for code review, idea generation, listing copy generation, prompt testing
- `tools/character-asset-system/routes/listings.js` uses Ollama for Gumroad listing text

## Browser automation
- Custom MCP at `C:\Users\colet\Documents\claude-browser-mcp\` (Playwright-based)
- Fork MCP at `C:\Users\colet\Documents\claude-browser-mcp-fork\` with separate profile dir — used for overnight autonomous work
- Hard 2000px screenshot cap patched into the MCP to prevent Claude API image-size crashes
- Auth bootstrap scripts: `switch-to-chrome.ps1` (visible window, login) and `switch-to-headless.ps1` (invisible, uses saved cookies)

## In-flight launches (read these first on a fresh session)
1. `C:\Users\colet\.claude\projects\C--Users-colet-Documents-Digital-Product-Wokring-Ideas\memory\project_handoff_2026-04-19.md`
2. `C:\Users\colet\.claude\projects\C--Users-colet-Documents-Digital-Product-Wokring-Ideas\memory\project_handoff_2026-04-19_addendum.md`

These capture in-flight tasks, blockers, and state that doesn't fit on disk (e.g., which credentials the user owns but hasn't pasted yet).
