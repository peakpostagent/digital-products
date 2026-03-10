# Project: Digital Product Portfolio

## Overview
A portfolio of Chrome extensions and RapidAPI products, built primarily by AI agents, monetized via marketplace discovery (no marketing).

## Structure
- `/extensions/job-match-score/` — Chrome Extension (Manifest V3, vanilla JS)
- `/apis/email-subject-generator/` — Vercel serverless API (Node.js)
- `/automation/n8n/` — Workflow automation (Docker)
- `/automation/crewai/` — Multi-agent orchestration (Python)
- `/automation/scripts/` — Local LLM code review tools
- `/docs/` — Roadmap, ideas backlog, revenue tracking

## Conventions
- Use vanilla JavaScript (no TypeScript, no React, no frameworks)
- Use ES modules (import/export) where supported
- Keep functions small and well-commented for beginner readability
- All user-facing strings should be easy to find and change
- Test files go in `/tests/` subdirectories
- Use Vitest for testing

## Chrome Extension Rules
- Manifest V3 only (no MV2 patterns)
- No inline scripts in HTML files (MV3 CSP requirement)
- Use chrome.storage.local for data persistence
- Content scripts must not break host page styling (use shadow DOM or prefixed classes)
- Support LinkedIn (linkedin.com/jobs/*) initially, add Indeed later
- Content scripts cannot use ES module import/export — use script loading order in manifest

## API Rules
- Each Vercel serverless function is a single file in /api/
- Always validate input before processing
- Always return proper HTTP status codes and JSON error messages
- Include CORS headers for RapidAPI compatibility
- Rate limiting is handled by RapidAPI (do not implement custom rate limiting)
- Keep OpenAI API costs under $10/month with spending limits

## Git
- Commit messages: "type: description" (feat:, fix:, docs:, chore:, test:)
- Do not commit .env files, node_modules, or API keys
- Commit frequently — small, focused commits

## Local LLM
- Ollama is installed with Qwen3 14B available
- Use for code review, idea generation, and testing prompts
- API endpoint: http://localhost:11434
