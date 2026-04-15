# Agentic Income Research
**Date:** 2026-04-14
**Goal:** Identify best agentic (fully automated, minimal human involvement) income-generating digital products for a solo developer with an existing portfolio.

## Existing Asset Inventory
- 22 Chrome extensions on CWS (12 published, ~28-35 weekly active users, growing)
- 7 Gumroad products (zero sales to date)
- Audience: developers, freelancers, tech workers
- Infrastructure: local Windows machine with GPU, Ollama (Qwen3 14B), ComfyUI, Python, JS
- Top CWS performers: Meeting Cost Calculator, CSS Variables Inspector, Shadow DOM Debugger, API Rate Limiter, Review Clock

## Research Inputs

### Ollama Qwen3 14B — 10 Ideas Generated
1. AI-Powered Code Assistant SaaS — $500-$2K/mo, 2-3 weeks build
2. Automated UI/UX Design Generator (ComfyUI) — $800-$3K/mo, 3-4 weeks
3. API Documentation Auto-Generator — $1K-$5K/mo, 2 weeks
4. Personalized Learning Path Generator — $1.5K-$6K/mo, 4-6 weeks
5. Automated Bug Detection & Fix Tool — $2K-$10K/mo, 3-5 weeks
6. Technical Blog/Article Auto-Writer — $1K-$4K/mo, 2-3 weeks
7. Code Optimization Advisor — $800-$3K/mo, 2 weeks
8. Automated Project Scaffolding Tool — $1.2K-$5K/mo, 3-4 weeks
9. Technical Diagram Generator (ComfyUI) — $1K-$4K/mo, 3-5 weeks
10. AI-Powered Coding Mentorship Platform — $2.5K-$10K/mo, 4-6 weeks

### Web Research Key Findings

**Market signals (2026):**
- Micro-SaaS market growing from $15.7B to projected $59.6B by 2030 (~30% annual growth)
- Solo founders routinely hit $5K-$50K+ MRR on niche pain points
- Chrome extension monetization: well-monetized extensions with 10K users earn $1K-$10K/mo
- Superpower ChatGPT Chrome extension: $20K-$30K MRR (reference comp)
- Personalized cold email GPT Chrome extension: $4.2K MRR after 4 months
- Faceless YouTube: $3K-$15K/mo typical, top earners $80K+/mo
- Digital products: 80-95% profit margins

**Dominant models:**
- Freemium Chrome extension with Stripe/Paddle/ExtensionPay backend billing
- Subscription SaaS with continuous AI-powered value delivery
- Content repurposing (podcast/video -> LinkedIn/newsletter/shorts)
- Micro-courses (30-min deep dives outperform 20-hour courses 3x)
- Notion templates (fast-moving, high-demand)

**What's NOT working well for solo agentic:**
- Broad general-purpose AI tools (too competitive)
- Long-form course production (doesn't match micro-content trend)
- Anything requiring daily manual content creation
- YouTube automation (oversaturated, TOS risk, slow ramp)

## Evaluation Framework
Each idea scored 1-5 on:
- Build complexity (5 = buildable in 1-3 days)
- True agentic (5 = runs without daily human input)
- Revenue potential (5 = $500+/mo realistic within 90 days)
- Leverages existing assets (5 = uses extensions, Gumroad audience, or local GPU)
- Time to first dollar (5 = under 30 days)

## TOP 5 RANKED

### 1. Premium Chrome Extension Tier + Agentic Backend (PICK THIS ONE)
**Concept:** Add paid "Pro" tier to existing top extensions (Meeting Cost Calculator, CSS Variables Inspector, Shadow DOM Debugger, API Rate Limiter). Pro features are AI-powered: e.g., Meeting Cost AI Insights (analyzes meeting patterns, suggests cuts via Ollama-generated reports emailed weekly), CSS Variables Inspector Pro (AI refactor suggestions for design tokens).

**How it runs agentically:** ExtensionPay or Stripe handles billing end-to-end. Ollama runs scheduled jobs nightly on the local machine to generate personalized reports emailed to users via SMTP/Resend. No manual intervention after setup.

**Build:** 1-3 days per extension. Add paywall SDK, cron job for Ollama report generation, email delivery.

**Revenue math:** 35 weekly active users -> ~150 MAU trend. At 2-3% conversion to $5/mo Pro = 3-4 subs initially, $15-$20/mo. Scales with extension user growth. Realistic 6-month target: 500 MAU x 3% x $5 = **$75-150 MRR**. Realistic 12-month with 2-3 extensions monetized: **$300-$800 MRR**.

**Score:** Build 5 / Agentic 5 / Revenue 3 / Leverage 5 / Time-to-$1 5 = **23/25**

**Why this wins:** Only path that uses the existing 22-extension distribution asset. Every other idea starts from zero traffic. User acquisition is the hardest part; existing extensions solve it.

---

### 2. Daily/Weekly AI Newsletter for Developers (Faceless, Agentic)
**Concept:** Fully automated newsletter targeting developers. Ollama scrapes GitHub trending, Hacker News, dev.to, and generates a curated "5-minute dev brief" daily. Promoted inside all 22 Chrome extensions (new tab link in popup footer).

**How it runs agentically:** Python cron job: fetch trending items -> Ollama summarizes + ranks -> auto-send via Buttondown/Resend/Substack API. Zero daily work.

**Build:** 1-2 days. RSS + scraping + Ollama + Buttondown API.

**Revenue math:** Monetize via sponsored slots ($50-$500 per send at 1K+ subs) or Pro tier ($5/mo for advanced filters / archive search). Extensions could drive 100-300 subscribers/month. 6-month target: 2K subs, **$500-$1,500 MRR** from sponsors.

**Score:** Build 5 / Agentic 5 / Revenue 4 / Leverage 4 / Time-to-$1 3 = **21/25**

---

### 3. Technical Diagram / Architecture Generator (ComfyUI + Ollama)
**Concept:** SaaS where devs type "microservices architecture with Redis cache and Postgres" and get back a polished diagram (PNG/SVG/Mermaid). Uses ComfyUI for stylized visuals + Ollama to generate Mermaid/PlantUML syntax.

**How it runs agentically:** User pays, request hits local API (or hosted via ngrok/Cloudflare tunnel), Python orchestrates Ollama -> diagram code -> ComfyUI render -> delivered via email/download link. No human in loop.

**Build:** 2-3 days with existing ComfyUI setup.

**Revenue math:** $9-$19/mo subscription or $2-$5 credit packs. Promoted via extensions targeting devs (CSS Variables, Shadow DOM). 6-month target: 50 paid users x $12 = **$600 MRR**.

**Score:** Build 4 / Agentic 5 / Revenue 4 / Leverage 4 / Time-to-$1 3 = **20/25**

---

### 4. Automated Code Review Bot (GitHub App)
**Concept:** GitHub App that auto-reviews PRs using Ollama. Installs on repo, comments on PRs with suggestions (readability, bugs, perf). Freemium: 3 free PRs/month, $9/mo unlimited.

**How it runs agentically:** GitHub webhook -> local FastAPI server -> Ollama analysis -> GitHub API comment. Truly zero-touch post-install.

**Build:** 2-3 days. GitHub App registration + webhook handler + Ollama integration.

**Revenue math:** Strong alignment with developer audience. Cross-promote from Chrome extensions. 6-month target: 30 paid installs x $9 = **$270 MRR**. Could hit $1K+ MRR at scale.

**Score:** Build 4 / Agentic 5 / Revenue 4 / Leverage 3 / Time-to-$1 3 = **19/25**

**Risk:** Hosting (webhook must be reachable 24/7). Needs cloud VPS ($5-10/mo) or Cloudflare tunnel from home PC — introduces reliability risk if PC goes offline.

---

### 5. AI-Powered Coloring Book / Printables Engine (Gumroad Auto-Listed)
**Concept:** Python script that weekly generates themed coloring book PDFs with ComfyUI (70+ pages), auto-creates Gumroad listing, generates marketing copy with Ollama, posts listing. Each product sells as $7-$15 digital download.

**How it runs agentically:** Cron: theme selection (predefined list or Ollama-brainstormed) -> ComfyUI batch render -> PDF assembly -> Gumroad API upload -> done.

**Build:** 2-3 days. Already has "Coloring Book AI Profit Machine" Gumroad product (ironic - sells the method but not the books).

**Revenue math:** Gumroad traffic is low without marketing. Realistic: 1-3 sales/week x $10 = **$40-$120/mo** without external traffic. Better if paired with Etsy/Pinterest automation. Low ceiling without marketing.

**Score:** Build 4 / Agentic 5 / Revenue 2 / Leverage 3 / Time-to-$1 2 = **16/25**

**Note:** Gumroad portfolio has 0 sales across 7 products — this confirms that Gumroad without inbound traffic is weak. Put this on hold until traffic problem is solved separately.

---

## OPINIONATED RECOMMENDATION: Build #1 First

**Single best idea: Monetize the existing Chrome extensions with a Pro tier + AI-powered agentic backend.**

**Why this beats everything else:**
1. **Existing distribution** — 22 extensions with 28+ weekly active users and growing. Every other idea starts at zero. CWS does the marketing for free.
2. **Validates the funnel** — Teaches you conversion rate, pricing elasticity, churn on a small population before scaling.
3. **Compounds with your existing workflow** — You're already shipping extensions weekly. Adding paywall + AI report is a feature commit, not a new product.
4. **Fastest to first dollar** — ExtensionPay checkout link + 1 Pro feature = shippable in 2 days. First paying user in under 30 days is realistic.
5. **The AI report loop is genuinely agentic** — Ollama runs locally (free), cron generates reports, email sends automatically. Zero daily input.

**Specific first move (next 7 days):**
- Pick **Meeting Cost Calculator** (top performer, already v1.1.0 with new features).
- Add "Pro Weekly Insights" feature: Ollama analyzes the user's saved meeting cost history, generates a personalized weekly cost-saving report, emails it Monday 8am.
- Integrate ExtensionPay at $4.99/mo.
- Update store listing to advertise Pro tier.
- Ship within 1 week.
- Measure conversion over 30 days.
- If it works on Meeting Cost Calculator, replicate the pattern on CSS Variables Inspector, Shadow DOM Debugger, and Review Clock next.

**Expected outcome (90 days):** $50-$300 MRR from the first extension; blueprint for rolling out Pro tiers across top 4-5 extensions = $500-$1,500 MRR path.

**Why not #2 (newsletter)?** Good idea, and should be idea #2 to build because it cross-promotes Pro tiers and monetizes via sponsors. But it relies on subscriber acquisition (slow ramp). Do it after #1 is launched.

## Sources
- [15 AI Agent Startup Ideas That Made $1M+ in 2026 - Presta](https://wearepresta.com/ai-agent-startup-ideas-2026-15-profitable-opportunities-to-launch-now/)
- [Best Passive Income Ideas in 2026 - Amasty](https://amasty.com/blog/best-passive-income-ideas-2026/)
- [Best Micro SaaS Ideas for Solopreneurs 2026 - Superframeworks](https://superframeworks.com/articles/best-micro-saas-ideas-solopreneurs)
- [Learning to code and building a $28k/mo portfolio - Indie Hackers](https://www.indiehackers.com/post/tech/learning-to-code-and-building-a-28k-mo-portfolio-of-saas-products-OA5p18fXtvHGxP9xTAwG)
- [How to Monetize a Chrome Extension in 2026 - Dodo Payments](https://dodopayments.com/blogs/monetize-chrome-extension)
- [How Saeed Ezzati Built a $20,000/Month AI Chrome Extension](https://medium.com/@maxslashwang/how-saeed-ezzati-built-a-20-000-month-ai-chrome-extension-2cbf4e34ecde)
- [Faceless Content Creator Statistics 2026 - AutoFaceless](https://autofaceless.ai/blog/faceless-content-creator-statistics-2026)
- [ExtensionPay - Monetize Chrome extensions](https://extensionpay.com/)
- [50 Micro-SaaS Ideas for Solo Founders 2026 - IdeaProof](https://ideaproof.io/lists/micro-saas-ideas)
- Local Ollama Qwen3 14B query (2026-04-14, 10 ideas generated)
