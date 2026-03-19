# The Developer's AI Prompt Toolkit
## The Complete Guide to AI-Assisted Development

---

## Table of Contents

1. [Introduction: Why Prompt Engineering Matters for Developers](#chapter-1)
2. [How to Use This Toolkit](#chapter-2)
3. [Setting Up Your AI Tools](#chapter-3)
4. [Prompt Anatomy: What Makes a Great Developer Prompt](#chapter-4)
5. [Category Deep Dives](#chapter-5)
   - 5.1 Debugging & Error Fixing
   - 5.2 Code Review
   - 5.3 Writing Tests
   - 5.4 Documentation
   - 5.5 Refactoring
   - 5.6 API Development
   - 5.7 Database & SQL
   - 5.8 Git & Version Control
   - 5.9 DevOps & CI/CD
   - 5.10 Architecture & Design
   - 5.11 Performance Optimization
   - 5.12 Security
6. [Prompt Chaining Techniques](#chapter-6)
7. [Customizing Prompts for Your Stack](#chapter-7)
8. [Working with Local LLMs (Ollama)](#chapter-8)
9. [Troubleshooting Bad AI Output](#chapter-9)
10. [Advanced Techniques](#chapter-10)
11. [Quick Reference Tables](#chapter-11)

---

<a name="chapter-1"></a>
## Chapter 1: Introduction - Why Prompt Engineering Matters for Developers

### The Developer's Productivity Multiplier

AI coding assistants are not magic. They are tools, and like any tool, the quality of your results depends on how you use them. A vague prompt produces vague output. A precise, well-structured prompt produces code you can actually ship.

This toolkit exists because most developers use AI the same way: they paste code, type "fix this" or "write tests," and hope for the best. Sometimes it works. Often it doesn't. And when it doesn't, developers waste time re-prompting, debugging AI output, or giving up and writing the code manually.

The prompts in this toolkit are the result of hundreds of real development sessions. Each one has been refined to get useful, accurate output on the first attempt.

### What This Toolkit Gives You

- **222 ready-to-use prompts** organized by developer workflow
- **Specific, actionable instructions** that work across AI platforms
- **Placeholder markers** so you can quickly fill in your own code and context
- **Pro tips** for getting better results from each prompt
- **Prompt chaining patterns** for complex, multi-step tasks

### Who This Is For

- Developers who use AI tools daily but want better results
- Team leads who want to standardize how their team uses AI
- Solo developers who want a senior engineer's thinking encoded in prompts
- Anyone learning to code who wants an AI tutor that gives structured help

### How to Read This Guide

If you are eager to start using prompts immediately, skip to Chapter 5 and pick the category that matches your current task. Come back to the earlier chapters when you want to understand the principles behind effective prompting.

---

<a name="chapter-2"></a>
## Chapter 2: How to Use This Toolkit

### The Basic Workflow

1. **Identify your task.** What are you trying to accomplish? Debug an error? Write tests? Review code?
2. **Find the right prompt.** Browse the category files or use the master index to find the prompt that matches.
3. **Fill in the placeholders.** Replace every `{{PLACEHOLDER}}` with your actual code, context, or requirements.
4. **Paste into your AI tool.** Use ChatGPT, Claude, Ollama, or any LLM.
5. **Review and iterate.** The AI's first response is a draft. Review it critically and ask follow-up questions.

### Placeholder Reference

Throughout the prompts, you'll see placeholders in double curly braces:

- `{{PASTE_CODE}}` - Paste your actual source code here
- `{{LANGUAGE}}` - Replace with the programming language (javascript, python, sql, etc.)
- `{{FRAMEWORK}}` - Replace with your framework name (Express, FastAPI, etc.)
- `{{DESCRIBE_...}}` - Write a brief description in your own words
- `{{YES/NO}}` - Choose one
- `{{LIST_...}}` - Provide a list of items

### Tips for All Prompts

**Give more context, not less.** AI models work better with more information. Include:
- Your tech stack and versions
- The specific error message (exact text, not paraphrased)
- What you have already tried
- What you expect to happen vs. what actually happens

**Be specific about the output format.** If you want code, say which language. If you want a list, say so. If you want step-by-step instructions, ask for them.

**Include constraints.** If you need vanilla JavaScript (no TypeScript), say so. If you need the solution to work with Node.js 18+, mention it. If you need it to work with Ollama, note that.

### File Organization

The prompts are organized in two ways:

1. **By category file** (in the `/prompts/` directory) - Browse one category at a time
2. **Master index** (`00-master-collection.txt`) - Quick reference to all 222 prompts

---

<a name="chapter-3"></a>
## Chapter 3: Setting Up Your AI Tools

### ChatGPT

ChatGPT (GPT-4 and later) works well with all prompts in this toolkit. For best results:

- Use GPT-4 or later for complex code analysis
- Paste code in fenced code blocks with the language specified
- Use "Custom Instructions" to set your default stack and preferences
- For long code, split into multiple messages and reference previous context

### Claude

Claude excels at long-context tasks like code review and architecture design. Tips:

- Claude handles very long code pastes well (up to 100K+ tokens)
- Use Claude for tasks requiring analysis of multiple files at once
- Claude tends to be thorough; specify if you want concise output
- Works well for security reviews and finding subtle bugs

### Ollama (Local LLMs)

Running models locally gives you privacy and zero API costs. Setup:

**Quick Start:**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a capable coding model
ollama pull qwen2.5-coder:14b

# Or for a smaller, faster model
ollama pull qwen2.5-coder:7b

# Run interactively
ollama run qwen2.5-coder:14b
```

**Using with this toolkit:**

1. Copy the prompt from the toolkit
2. Fill in placeholders
3. Paste into the Ollama terminal
4. For large prompts, use the API instead:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5-coder:14b",
  "prompt": "YOUR_PROMPT_HERE",
  "stream": false
}'
```

**Model Recommendations for This Toolkit:**

| Task Type | Minimum Model | Recommended Model |
|-----------|--------------|-------------------|
| Debugging | 7B | 14B+ |
| Code Review | 14B | 32B+ |
| Writing Tests | 7B | 14B+ |
| Documentation | 7B | 14B+ |
| Architecture | 14B+ | 32B+ |
| Security | 14B+ | 32B+ |

**Ollama-Specific Tips:**
- Keep prompts under 4000 tokens for 7B models
- For large codebases, break into smaller chunks
- Use system prompts to set context: `ollama run qwen2.5-coder:14b --system "You are a senior Node.js developer"`
- The 14B parameter models offer the best balance of quality and speed for most coding tasks

---

<a name="chapter-4"></a>
## Chapter 4: Prompt Anatomy - What Makes a Great Developer Prompt

### The Five Elements of an Effective Developer Prompt

Every prompt in this toolkit follows a structure. Understanding this structure lets you modify prompts for your needs and create your own.

**1. Context Setting**
Tell the AI what it is looking at and what role to play.
```
"Review this Express.js API endpoint for security vulnerabilities.
Assume an attacker will try to exploit it."
```

**2. The Task**
State exactly what you want done. Be specific and use action verbs.
```
"Identify all SQL injection points. For each one, show the attack
payload that would work and provide the parameterized query fix."
```

**3. The Code/Data**
Provide the actual material to work with, properly formatted.
```
```javascript
// Paste your code in fenced code blocks with language
app.get('/users', (req, res) => { ... });
```
```

**4. Output Specification**
Tell the AI how to format its response.
```
"For each issue found:
1. Current vulnerable code
2. Attack payload demonstration
3. Fixed code
4. Severity rating (Critical/High/Medium/Low)"
```

**5. Constraints and Preferences**
Set boundaries on the solution.
```
"Use vanilla JavaScript. No TypeScript. Must work with Node.js 20.
Do not use any npm packages not already in our package.json."
```

### Common Mistakes

**Too vague:** "Make this code better"
**Better:** "Refactor this function to reduce cyclomatic complexity. Extract helper functions for each logical step and add error handling for the database calls."

**No context:** "Why is this broken?"
**Better:** "This function returns undefined instead of the user object. Here's the function, the test that fails, and the database query log showing the data exists."

**No output format:** "Review this code"
**Better:** "Review this code. Organize findings as: Must Fix (blocking), Should Fix (important), and Suggestions (nice to have). Include the line number and a code snippet for each finding."

---

<a name="chapter-5"></a>
## Chapter 5: Category Deep Dives

### 5.1 Debugging & Error Fixing (27 prompts)

Debugging is the most common use of AI in development. These prompts turn "I don't know what's wrong" into structured, methodical analysis.

**When to reach for this category:**
- You have a stack trace and don't know where to start
- Code runs but produces wrong output
- Something works locally but fails in production
- An error message is cryptic or unfamiliar

**Highlighted Prompts:**

**DEBUG-01: Stack Trace Decoder** - The most-used prompt in this entire toolkit. Paste any stack trace and your code, and get a root cause analysis with fix. Works across any language.

**DEBUG-03: Logic Bug Finder** - For when there's no error, just wrong output. The prompt asks the AI to walk through your code step by step with specific input, showing variable values at each step. This catches bugs that staring at code misses.

**DEBUG-05: Memory Leak Detective** - Provides a structured checklist for memory leak causes (event listeners, closures, growing collections, timers). Paste your suspected code and get specific identification of the leak source.

**DEBUG-12: CORS Error Fixer** - CORS errors are confusing even for experienced developers. This prompt asks for the right information (frontend origin, backend URL, request method) and returns the exact headers to set.

**DEBUG-24: Silent Error Finder** - For the worst kind of bug: nothing happens and no error is thrown. The prompt systematically checks for swallowed exceptions, conditional logic that silently skips, and promises whose results are never used.

**Chaining Pattern:**
Start with DEBUG-01 (Stack Trace Decoder) to identify the issue, then use the fix prompt for the specific problem type (DEBUG-04 for async, DEBUG-06 for types, etc.), then use TEST-14 (Regression Test from Bug Report) to prevent recurrence.

---

### 5.2 Code Review (20 prompts)

These prompts give you the thinking of a senior engineer reviewing your code. Each prompt focuses on a different review lens.

**Highlighted Prompts:**

**REVIEW-01: Security-Focused Code Review** - Checks 10 specific vulnerability categories. Use before any code goes to production.

**REVIEW-12: Pull Request Review Assistant** - Formats output like a real PR review with Must Fix, Should Fix, Suggestions, and Praise categories.

**REVIEW-11: Code Smell Detector** - Scans for 9 specific code smells with refactoring suggestions. Great for code you inherited.

---

### 5.3 Writing Tests (25 prompts)

The most comprehensive testing prompt collection available. Covers unit tests through to browser extension tests.

**Highlighted Prompts:**

**TEST-01: Unit Test Generator** - The go-to prompt. Generates tests with happy path, edge cases, error cases, and boundary values.

**TEST-02: Edge Case Test Generator** - Specifically targets the edge cases that basic tests miss: Unicode, null vs undefined vs empty, floating point precision, concurrent calls.

**TEST-14: Regression Test from Bug Report** - Turn any bug fix into a permanent test. Includes the bug scenario as a comment for future context.

---

### 5.4 Documentation (20 prompts)

Documentation is where AI shines because the task is well-defined but tedious. These prompts produce documentation that humans actually want to read.

**Highlighted Prompts:**

**DOC-01: JSDoc Generator** - Add JSDoc to an entire file at once. Includes @param, @returns, @throws, and @example tags.

**DOC-03: API Documentation Generator** - Produces complete endpoint docs with curl examples, JavaScript examples, and Python examples.

**DOC-07: Onboarding Documentation Writer** - Creates setup guides that actually work. Covers prerequisites through deployment.

---

### 5.5 Refactoring (20 prompts)

Systematic refactoring prompts that preserve behavior while improving code quality.

**Highlighted Prompts:**

**REFACTOR-01: Extract Function** - Breaks long functions into small, testable, single-purpose functions.

**REFACTOR-02: Simplify Conditionals** - Transforms nested if/else chains into flat, readable code using guard clauses and lookup tables.

**REFACTOR-04: Modernize Legacy Syntax** - Updates ES5 code to modern JavaScript with warnings about behavioral differences.

**REFACTOR-18: Make Code Testable** - Restructures tightly coupled code so it can be unit tested with dependency injection.

---

### 5.6 API Development (20 prompts)

From endpoint design to OpenAPI specs, these prompts cover the full API development lifecycle.

**Highlighted Prompts:**

**API-01: REST Endpoint Designer** - Design and implement endpoints with proper HTTP methods, status codes, and validation.

**API-03: Error Response Standardizer** - Create a consistent error handling system with custom error classes and a global handler.

**API-05: Authentication Middleware Builder** - Complete JWT auth with access tokens, refresh tokens, and role-based authorization.

---

### 5.7 Database & SQL (15 prompts)

Query optimization, schema design, and database operations.

**Highlighted Prompts:**

**DB-01: Query Optimizer** - Paste a slow query with its EXPLAIN output and get an optimized version with recommended indexes.

**DB-02: Schema Designer** - Design normalized schemas with proper constraints, indexes, and seed data.

**DB-06: N+1 Query Fixer** - Identify and fix the most common database performance problem.

---

### 5.8 Git & Version Control (15 prompts)

From commit messages to branching strategies.

**Highlighted Prompts:**

**GIT-01: Commit Message Writer** - Paste a git diff, get a properly formatted conventional commit message.

**GIT-02: Pull Request Description Writer** - Generate PR descriptions with summary, changes, testing instructions, and checklist.

**GIT-03: Git Conflict Resolver** - Resolve merge conflicts by explaining the intent of both sides and providing the merged result.

---

### 5.9 DevOps & CI/CD (15 prompts)

Dockerfiles, CI pipelines, and deployment automation.

**Highlighted Prompts:**

**DEVOPS-01: Dockerfile Builder** - Multi-stage, production-ready Dockerfiles with security best practices.

**DEVOPS-02: GitHub Actions Workflow Builder** - Complete CI/CD workflows with caching, parallel jobs, and deployment.

**DEVOPS-07: CI Pipeline Optimizer** - Speed up slow CI pipelines with parallelization and caching strategies.

---

### 5.10 Architecture & Design (15 prompts)

System design, pattern selection, and technical decision-making.

**Highlighted Prompts:**

**ARCH-01: System Design from Requirements** - Go from requirements to a complete architecture with technology choices and cost estimates.

**ARCH-02: Design Pattern Selector** - Compare patterns for your specific problem and get the implementation.

**ARCH-13: Tech Stack Decision** - Evaluate technology options based on team skills, timeline, and requirements.

---

### 5.11 Performance Optimization (15 prompts)

Frontend, backend, and database performance.

**Highlighted Prompts:**

**PERF-01: Frontend Performance Audit** - Audit Core Web Vitals with specific fixes for LCP, CLS, and INP.

**PERF-02: Backend API Optimizer** - Profile-driven optimization of slow endpoints.

**PERF-06: Caching Implementation** - Complete caching strategy with cache-aside pattern, invalidation, and monitoring.

---

### 5.12 Security (15 prompts)

Vulnerability prevention and security hardening.

**Highlighted Prompts:**

**SEC-01: Input Validation Hardener** - Protect against 10 injection attack categories with specific fixes.

**SEC-06: API Security Checklist** - 15-point security checklist with pass/fail status for each item.

**SEC-09: Security Headers Configuration** - Configure all modern security headers with explanations of what each one prevents.

---

<a name="chapter-6"></a>
## Chapter 6: Prompt Chaining Techniques

Prompt chaining is the practice of using the output of one prompt as input to the next. This is how you handle complex, multi-step development tasks.

### Chain Pattern 1: Bug Fix Pipeline

```
Step 1: DEBUG-01 (Stack Trace Decoder)
   Input: Your stack trace + code
   Output: Root cause identification

Step 2: DEBUG-03/04/05/06 (Specific debugger for the bug type)
   Input: Identified root cause + code
   Output: Fixed code

Step 3: TEST-14 (Regression Test from Bug Report)
   Input: Bug description + fixed code
   Output: Test that prevents recurrence

Step 4: GIT-01 (Commit Message Writer)
   Input: The diff of your fix
   Output: Conventional commit message
```

### Chain Pattern 2: New Feature Pipeline

```
Step 1: ARCH-01 (System Design)
   Input: Feature requirements
   Output: Architecture plan

Step 2: API-01 (REST Endpoint Designer)
   Input: Architecture plan
   Output: API endpoints with implementation

Step 3: DB-02 (Schema Designer)
   Input: Data model from architecture plan
   Output: Database schema with migrations

Step 4: TEST-04 (API Endpoint Test Suite)
   Input: API implementation
   Output: Complete test suite

Step 5: DOC-03 (API Documentation)
   Input: API endpoints
   Output: Developer documentation
```

### Chain Pattern 3: Code Quality Pipeline

```
Step 1: REVIEW-11 (Code Smell Detector)
   Input: Your code
   Output: List of code smells

Step 2: REFACTOR-01/02/03 (Specific refactoring)
   Input: Code smells + original code
   Output: Refactored code

Step 3: TEST-01 (Unit Test Generator)
   Input: Refactored code
   Output: Tests confirming behavior preserved

Step 4: REVIEW-03 (Readability Review)
   Input: Refactored code
   Output: Final readability improvements
```

### Chain Pattern 4: Security Hardening Pipeline

```
Step 1: REVIEW-01 (Security Review)
   Input: Your code
   Output: Vulnerability list

Step 2: SEC-01 (Input Validation Hardener)
   Input: Code with identified vulnerabilities
   Output: Hardened input handling

Step 3: SEC-09 (Security Headers)
   Input: Your server configuration
   Output: Security header configuration

Step 4: TEST-20 (Security Test Writer)
   Input: Hardened code
   Output: Tests verifying security controls
```

### Tips for Effective Chaining

1. **Copy relevant output, not everything.** Each prompt should get focused context, not the AI's entire previous response.
2. **Summarize between chains.** When moving between prompts, summarize what was found/decided rather than pasting everything.
3. **Validate at each step.** Don't chain 5 prompts without reviewing intermediate output. Errors compound.
4. **Use consistent terminology.** If prompt 1 calls something a "user service," use that same term in subsequent prompts.

---

<a name="chapter-7"></a>
## Chapter 7: Customizing Prompts for Your Stack

### Creating a Prompt Prefix

Save time by creating a reusable prefix that sets your project context:

```
Project context: Node.js 20, Express 4, PostgreSQL 15, vanilla JavaScript
(no TypeScript), Vitest for testing, deployed on Vercel.
Code style: ES modules, async/await, small functions, JSDoc comments.
```

Paste this before any prompt to immediately set the right context.

### Stack-Specific Modifications

**For Python developers:**
- Replace `{{TEST_FRAMEWORK}}` with `pytest`
- Replace `{{LANGUAGE}}` with `python`
- Adjust import/module patterns to Python conventions
- Use `requirements.txt` or `pyproject.toml` instead of `package.json`

**For vanilla JavaScript (no framework):**
- Specify "vanilla JavaScript, no frameworks, no build tools"
- Mention browser compatibility requirements
- Note that you're using ES modules or script tags

**For Chrome Extensions:**
- Add "This is a Chrome Extension using Manifest V3"
- Mention content scripts vs background scripts vs popup
- Note that Chrome APIs are available (chrome.storage, chrome.runtime, etc.)

### Building a Team Prompt Library

1. Start with the prompts from this toolkit that match your stack
2. Fill in the common placeholders for your project (language, framework, database)
3. Add your team's coding conventions and style guide
4. Store customized prompts in your project's `/docs/prompts/` directory
5. Add project-specific prompts for your domain (e.g., e-commerce order processing)

---

<a name="chapter-8"></a>
## Chapter 8: Working with Local LLMs (Ollama)

### Why Run Models Locally?

- **Privacy:** Code never leaves your machine
- **Cost:** No API fees, no usage limits
- **Speed:** No network latency for small queries
- **Offline:** Works without internet

### Recommended Setup

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# For Windows, download from https://ollama.com/download

# Pull recommended models
ollama pull qwen2.5-coder:14b    # Best balance of quality and speed
ollama pull qwen2.5-coder:7b     # Faster, good for simple tasks
ollama pull deepseek-coder-v2:16b # Alternative, strong at code generation
```

### Adapting Prompts for Local Models

Local models (7B-14B parameters) are less capable than GPT-4 or Claude. To get good results:

1. **Shorten prompts.** Remove sections that aren't essential for your specific task.
2. **Be more explicit.** Local models need more explicit instructions than cloud models.
3. **Reduce the number of items in checklists.** Instead of "check for 10 things," pick the 3-4 most relevant.
4. **Provide more examples.** Show the exact output format you want with a concrete example.
5. **Use one-shot prompting.** Show an example input-output pair before your actual request.

### Example: Adapting a Prompt for Ollama

**Original (for ChatGPT/Claude):**
```
Write comprehensive unit tests for this function using Vitest.
Test happy path, edge cases, error cases, boundary values...
[10 more requirements]
```

**Adapted for Ollama (7B):**
```
Write 5 unit tests for this function using Vitest.
Include: 1 happy path, 2 edge cases, 2 error cases.

Example test format:
test('should return sum of two numbers', () => {
  expect(add(2, 3)).toBe(5);
});

Function to test:
[paste function]
```

### Using Ollama's API Programmatically

```javascript
async function askOllama(prompt, model = 'qwen2.5-coder:14b') {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.2, // Lower = more deterministic for code
        num_predict: 4096
      }
    })
  });
  const data = await response.json();
  return data.response;
}
```

---

<a name="chapter-9"></a>
## Chapter 9: Troubleshooting Bad AI Output

### Problem: The AI Generates Code That Doesn't Work

**Causes:**
- Missing context (the AI doesn't know your stack or constraints)
- Outdated knowledge (AI suggests deprecated APIs)
- Hallucinated APIs (AI invents function names that don't exist)

**Fixes:**
- Specify exact library versions: "Using Express 4.18, not Express 5"
- Ask: "Verify that every function and method you used actually exists in [library] version [X]"
- Add: "Do not use any APIs or functions that don't exist. If unsure, note it."

### Problem: The AI Gives a Generic Answer

**Causes:**
- Your prompt is too vague
- You didn't provide enough code context
- The prompt is too broad (asking for everything at once)

**Fixes:**
- Add specific code and specific error messages
- Ask one focused question per prompt
- Use the structured prompts from this toolkit instead of freeform questions

### Problem: The AI Output Is Too Long

**Causes:**
- No length constraint in the prompt
- Asking for multiple things at once

**Fixes:**
- Add: "Keep your response under 200 lines of code"
- Add: "Focus only on the [specific thing], skip the rest"
- Add: "Show only the changed code, not the entire file"

### Problem: The AI Misunderstands the Task

**Causes:**
- Ambiguous language
- Missing "what" vs "why" context
- The AI interpreted a constraint differently than intended

**Fixes:**
- Restate the task with a concrete example of input and expected output
- Add: "Do NOT do [common misinterpretation]. Instead, do [what you actually want]"
- Break the task into smaller, less ambiguous steps

### Problem: The AI Gives Outdated Advice

**Causes:**
- Training data cutoff
- AI defaulting to older patterns it's seen more often

**Fixes:**
- Specify the version: "Use React 19 patterns, not class components"
- Add: "Use the latest best practices as of 2024/2025"
- For very new APIs, paste the current documentation as context

### The "Fix My Fix" Pattern

When the AI's fix introduces a new problem:

```
Your previous fix introduced a new issue.

Your fix:
[paste the AI's code]

New error:
[paste the new error]

Original code for context:
[paste original]

Fix the new issue without reintroducing the original bug.
```

---

<a name="chapter-10"></a>
## Chapter 10: Advanced Techniques

### Technique 1: Role Setting

Start prompts with a role for more specialized output:

```
You are a senior security engineer reviewing code for a financial application.
Every suggestion must consider PCI-DSS compliance.
```

```
You are a performance engineer. Focus only on runtime performance,
not code style or readability.
```

### Technique 2: Comparative Analysis

Ask the AI to compare approaches before committing:

```
Show me 3 different ways to implement [feature].
For each approach, show:
- The implementation (under 30 lines)
- Time complexity
- Memory complexity
- Pros and cons
- When to use this approach

Then recommend the best one for my constraints: [constraints]
```

### Technique 3: Rubber Duck Debugging with AI

Use the AI as a thinking partner, not just a code generator:

```
I'm debugging a problem. Don't give me the answer yet.
Instead, ask me 5 questions that would help narrow down the issue.
After I answer, ask 5 more. Only then suggest a diagnosis.
```

### Technique 4: Iterative Refinement

Use follow-up prompts to improve output:

```
Good start. Now:
1. Add error handling for the database connection failure case
2. Replace the magic numbers with named constants
3. Add JSDoc comments to the public functions
```

### Technique 5: Constraint-Based Prompting

Set hard constraints to prevent over-engineering:

```
Implement this feature with these constraints:
- Maximum 50 lines of code
- No external dependencies
- Must work in Node.js 20 without transpilation
- Must handle errors without try/catch (use result types or early returns)
```

---

<a name="chapter-11"></a>
## Chapter 11: Quick Reference Tables

### Prompt Selection Guide

| I need to... | Use this prompt |
|--------------|----------------|
| Fix a crash | DEBUG-01 |
| Fix wrong output | DEBUG-03 |
| Fix async issues | DEBUG-04 |
| Fix CORS errors | DEBUG-12 |
| Review security | REVIEW-01 |
| Review a PR | REVIEW-12 |
| Write unit tests | TEST-01 |
| Write edge case tests | TEST-02 |
| Write API tests | TEST-04 |
| Add JSDoc | DOC-01 |
| Write a README | DOC-02 |
| Document an API | DOC-03 |
| Break up a long function | REFACTOR-01 |
| Simplify if/else | REFACTOR-02 |
| Remove duplication | REFACTOR-03 |
| Design an endpoint | API-01 |
| Add auth | API-05 |
| Optimize a query | DB-01 |
| Design a schema | DB-02 |
| Write a commit message | GIT-01 |
| Write a PR description | GIT-02 |
| Create a Dockerfile | DEVOPS-01 |
| Set up CI/CD | DEVOPS-02 |
| Design a system | ARCH-01 |
| Speed up page load | PERF-01 |
| Speed up an API | PERF-02 |
| Prevent XSS | SEC-05 |
| Prevent SQL injection | SEC-11 |
| Add security headers | SEC-09 |

### Model Comparison for Developer Tasks

| Task | ChatGPT | Claude | Ollama 14B |
|------|---------|--------|------------|
| Short debugging | Great | Great | Good |
| Long code review | Good | Excellent | Fair |
| Test generation | Great | Great | Good |
| Documentation | Good | Excellent | Good |
| Architecture | Good | Excellent | Fair |
| Security review | Good | Excellent | Fair |
| Quick refactoring | Great | Great | Good |
| Multi-file analysis | Fair | Excellent | Poor |

### Prompt Complexity Guide

| Prompt Length | Best For | Time Investment |
|--------------|---------|-----------------|
| Short (< 100 words) | Simple fixes, quick questions | 30 seconds |
| Medium (100-300 words) | Most toolkit prompts | 2-3 minutes |
| Long (300+ words) | Architecture, complex review | 5-10 minutes |
| Chained (3+ prompts) | Feature development, migration | 20-30 minutes |

---

## Conclusion

The prompts in this toolkit are starting points, not endpoints. As you use them, you'll develop intuition for what works with different AI models and different types of problems.

The developers who get the most value from AI are not the ones who use it for everything. They are the ones who know which tasks AI accelerates and which tasks are better done manually. Use these prompts for the repetitive, structured work - debugging, testing, documentation, reviews - so you can spend your focused attention on the creative, architectural work that only you can do.

Build great things.

---

*The Developer's AI Prompt Toolkit - 222 Battle-Tested Prompts for Professional Development*
