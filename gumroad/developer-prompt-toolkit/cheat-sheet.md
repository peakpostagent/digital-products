# The Developer's AI Prompt Toolkit - Quick Reference Cheat Sheet

## Top 20 Prompts You'll Use Every Day

---

### 1. Stack Trace Decoder (DEBUG-01)
```
Analyze this stack trace and explain:
1. What is the root cause?
2. Which line in MY code is responsible?
3. What is the most likely fix?

Stack trace:
[paste stack trace]

My code:
[paste relevant code]
```

### 2. Logic Bug Finder (DEBUG-03)
```
This function should {{expected behavior}} but instead it {{actual behavior}}.

[paste function]

Input: {{input}} | Expected: {{expected}} | Actual: {{actual}}

Walk through the code step by step with the sample input, showing each variable's value. Then provide the fix.
```

### 3. Unit Test Generator (TEST-01)
```
Write unit tests for this function using {{Vitest/Jest/pytest}}.
Cover: happy path, edge cases (null, empty, boundary), and error cases.
Use descriptive test names and arrange-act-assert pattern.

[paste function]
```

### 4. Security Code Review (REVIEW-01)
```
Security review this code. Assume an attacker will exploit it.
Check: SQL injection, XSS, CSRF, hardcoded secrets, input validation, path traversal.
Rate each finding: Critical/High/Medium/Low. Provide the fix.

[paste code]
```

### 5. PR Review Assistant (REVIEW-12)
```
Review this diff as a senior engineer. Format as:
- **Must Fix**: bugs, security, data loss
- **Should Fix**: performance, error handling
- **Suggestions**: readability, naming
- **Praise**: good patterns

[paste git diff]
```

### 6. Commit Message Writer (GIT-01)
```
Write a conventional commit message for this diff:
[paste git diff]
Format: type(scope): subject (max 50 chars)
Body: explain WHY, not what.
```

### 7. Extract Function (REFACTOR-01)
```
This function is too long. Extract smaller, single-purpose functions.
Each should do one thing, be independently testable, and have a descriptive name.
Keep the original as a coordinator.

[paste long function]
```

### 8. CORS Error Fixer (DEBUG-12)
```
CORS error: [paste error]
Frontend: {{origin}} | Backend: {{url}} | Method: {{method}}
Current CORS config: [paste config]
Why is this happening? Provide the corrected config.
```

### 9. API Endpoint Designer (API-01)
```
Design a REST endpoint for: {{feature description}}
Provide: method, URL, request/response schemas, validation,
error responses (400/401/404/500), and implementation in {{framework}}.
```

### 10. Error Response Standardizer (API-03)
```
Create a standardized error handling system for my {{framework}} API.
Include: error response format, custom error classes, global error handler,
status code mapping, dev vs prod error detail levels.

[paste current error handling]
```

### 11. Query Optimizer (DB-01)
```
Optimize this query (currently {{X}}ms, target {{Y}}ms):
[paste SQL query]
Schema: [paste CREATE TABLE]
EXPLAIN output: [paste explain]
Provide: optimized query + CREATE INDEX statements.
```

### 12. Dockerfile Builder (DEVOPS-01)
```
Create a production Dockerfile for {{app type}} ({{language}} {{version}}).
Multi-stage build, non-root user, layer caching, health check,
minimal final image. Also provide .dockerignore.
```

### 13. Edge Case Test Generator (TEST-02)
```
Generate ONLY edge case tests for this function (I have basic tests already).
Test: boundaries, null/undefined/empty, Unicode, concurrent calls,
floating point, very large inputs, type coercion.

[paste function]
```

### 14. JSDoc Generator (DOC-01)
```
Add JSDoc to every function: @param, @returns, @throws, @example.
Describe WHAT the function does, not HOW.

[paste code]
```

### 15. Simplify Conditionals (REFACTOR-02)
```
Simplify these conditionals. Use: guard clauses, lookup objects,
optional chaining, named boolean variables. Preserve behavior.

[paste code with nested if/else]
```

### 16. GitHub Actions Builder (DEVOPS-02)
```
Create a GitHub Actions CI workflow:
Trigger: {{push/PR}} | Steps: lint, test, build, deploy to {{target}}
Cache dependencies, fail fast on lint errors.
```

### 17. Input Validation Builder (API-02)
```
Build input validation for {{METHOD}} {{PATH}}.
Expected body: [paste schema]
Validate types, lengths, formats, enums. Sanitize strings.
Return ALL errors at once. Using {{Zod/Joi/manual}}.
```

### 18. Async/Await Debugger (DEBUG-04)
```
Async issue: {{symptoms}}
[paste async code]
Check: missing await, race conditions, unhandled rejections,
error handling in async context, parallel vs sequential.
Provide corrected code with comments.
```

### 19. Schema Designer (DB-02)
```
Design a database schema for: {{feature description}}
Entities: {{list}}
Provide: CREATE TABLE with types, PKs, FKs, indexes,
constraints, timestamps, and seed data.
```

### 20. API Security Checklist (SEC-06)
```
Security checklist for my API:
[paste code]
Check: auth, authorization, input validation, SQL injection,
rate limiting, HTTPS, security headers, CORS, error messages,
request size limits. Pass/fail each item.
```

---

## Quick Patterns

**Bug Fix Pipeline:** DEBUG-01 -> specific debugger -> TEST-14 -> GIT-01

**New Feature:** ARCH-01 -> API-01 -> DB-02 -> TEST-04 -> DOC-03

**Code Quality:** REVIEW-11 -> REFACTOR-01/02/03 -> TEST-01 -> REVIEW-03

**Security Hardening:** REVIEW-01 -> SEC-01 -> SEC-09 -> TEST-20

---

## Universal Tips

1. **Paste the exact error message** - don't paraphrase
2. **Include your versions** - Node 20, Express 4, PostgreSQL 15
3. **State what you tried** - saves the AI from suggesting what you already did
4. **Specify output format** - "as a numbered list" or "as a code block"
5. **For Ollama**: shorten prompts, ask for fewer items, be more explicit

---

*The Developer's AI Prompt Toolkit - 222 Prompts for Professional Development*
