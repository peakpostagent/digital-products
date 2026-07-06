# AI Sidebar — ExtKit Pro Example

The third example extension: a **local-AI chat sidebar** using Chrome's Side Panel API + Ollama. Demonstrates two patterns the other examples don't:

1. **Metered free tier** — 10 messages/day, enforced in the *service worker* (not the UI) so it can't be bypassed by tinkering with panel state. See `ai-sidebar/consume-message-credit` in `background/service-worker.js`.
2. **Pro-gated capability picker** — free tier is locked to the default model; Pro unlocks every local Ollama model.

Also shows: Side Panel manifest wiring, streaming token-by-token rendering, and graceful "Ollama not running" degradation.

## Requirements

- [Ollama](https://ollama.com) running locally (`ollama serve`) with at least one model pulled (`ollama pull llama3.2`)
- The `host_permissions` entry for `http://localhost:11434/*` (already in the manifest)

## Why local AI in a paid extension?

Zero inference cost to you. The buyer's machine does the work; your extension sells the *experience* (UI, page integration, metering, sync). This is the only architecture where an AI extension's margins don't erode with usage — which is exactly what you want in a $4.99/mo product.

## Files

| File | Pattern it teaches |
|---|---|
| `src/background/service-worker.js` | Worker-enforced daily metering + ExtKit wiring |
| `src/sidepanel/panel.js` | Credit check before action → paywall on exhaustion; streaming render |
| `src/manifest.json` | Side Panel API + localhost host_permissions |

## Adapting it

Replace the Ollama fetch with any backend (OpenAI-compatible endpoints work with ~5 line changes), keep the metering + paywall wiring untouched. The `FREE_MESSAGES_PER_DAY` constant in the service worker is the only knob for the free-tier size.
