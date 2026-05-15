// headers.test.js — unit tests for the core security-headers analysis logic.
//
// headers.js uses an IIFE/global-function pattern (it's loaded as a script tag
// in popup.html, not as an ES module). To test, we read the source, append a
// return statement exposing the bits we need, and execute in a fresh closure.

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let HEADER_DEFINITIONS;
let analyzeHeaders;
let calculateGrade;
let gradeColor;
let badgeBgColor;
let formatReport;

beforeAll(() => {
  const code = readFileSync(resolve(__dirname, '../src/lib/headers.js'), 'utf-8');
  // The file's last top-level declaration is the HEADER_DEFINITIONS array.
  // We append a return statement to surface everything we need to test.
  const wrapped =
    code +
    '\nreturn { HEADER_DEFINITIONS, analyzeHeaders, calculateGrade, gradeColor, badgeBgColor, formatReport };';
  const exports = new Function(wrapped)();
  HEADER_DEFINITIONS = exports.HEADER_DEFINITIONS;
  analyzeHeaders = exports.analyzeHeaders;
  calculateGrade = exports.calculateGrade;
  gradeColor = exports.gradeColor;
  badgeBgColor = exports.badgeBgColor;
  formatReport = exports.formatReport;
});

/* ---------------------------------------------------------------------------
 * HEADER_DEFINITIONS shape
 * ------------------------------------------------------------------------- */

describe('HEADER_DEFINITIONS', () => {
  it('contains exactly 10 headers (current shipped set)', () => {
    expect(HEADER_DEFINITIONS).toHaveLength(10);
  });

  it('every header has the required fields', () => {
    HEADER_DEFINITIONS.forEach((def) => {
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('recommendation');
      expect(def).toHaveProperty('severity');
      expect(def).toHaveProperty('weight');
      expect(def).toHaveProperty('attack');
      expect(def).toHaveProperty('breach');
      expect(typeof def.evaluate).toBe('function');
      expect(def.snippets).toHaveProperty('nginx');
      expect(def.snippets).toHaveProperty('apache');
      expect(def.snippets).toHaveProperty('express');
      expect(def.snippets).toHaveProperty('cloudflare');
    });
  });

  it('severity is one of critical/important/optional', () => {
    HEADER_DEFINITIONS.forEach((def) => {
      expect(['critical', 'important', 'optional']).toContain(def.severity);
    });
  });
});

/* ---------------------------------------------------------------------------
 * Per-header evaluator: Content-Security-Policy
 * ------------------------------------------------------------------------- */

const evaluatorFor = (name) =>
  HEADER_DEFINITIONS.find((h) => h.name === name).evaluate;

describe('Content-Security-Policy evaluator', () => {
  const ev = (v) => evaluatorFor('Content-Security-Policy')(v);

  it('missing when no value', () => {
    expect(ev(null)).toBe('missing');
    expect(ev(undefined)).toBe('missing');
    expect(ev('')).toBe('missing');
  });

  it('weak when both unsafe-inline AND unsafe-eval are present', () => {
    expect(ev("script-src 'self' 'unsafe-inline' 'unsafe-eval'")).toBe('weak');
  });

  it('good when restrictive policy', () => {
    expect(ev("default-src 'self'")).toBe('good');
    expect(ev("default-src 'self'; script-src 'self'")).toBe('good');
  });

  it('good when only one of unsafe-inline OR unsafe-eval (still gets a pass)', () => {
    expect(ev("script-src 'self' 'unsafe-inline'")).toBe('good');
  });
});

/* ---------------------------------------------------------------------------
 * Per-header evaluator: Strict-Transport-Security
 * ------------------------------------------------------------------------- */

describe('Strict-Transport-Security evaluator', () => {
  const ev = (v) => evaluatorFor('Strict-Transport-Security')(v);

  it('missing when no value', () => {
    expect(ev(null)).toBe('missing');
  });

  it('weak when max-age below 30 days (2592000s)', () => {
    expect(ev('max-age=86400')).toBe('weak');       // 1 day
    expect(ev('max-age=2591999')).toBe('weak');     // just below 30d
  });

  it('good when max-age 30 days or more', () => {
    expect(ev('max-age=2592000')).toBe('good');
    expect(ev('max-age=31536000')).toBe('good');    // 1 year — recommended
    expect(ev('max-age=31536000; includeSubDomains; preload')).toBe('good');
  });
});

/* ---------------------------------------------------------------------------
 * Per-header evaluator: X-Content-Type-Options
 * ------------------------------------------------------------------------- */

describe('X-Content-Type-Options evaluator', () => {
  const ev = (v) => evaluatorFor('X-Content-Type-Options')(v);

  it('good only for "nosniff" (case-insensitive)', () => {
    expect(ev('nosniff')).toBe('good');
    expect(ev('NOSNIFF')).toBe('good');
    expect(ev(' nosniff ')).toBe('good');
  });

  it('weak for any other non-empty value', () => {
    expect(ev('off')).toBe('weak');
    expect(ev('sniff')).toBe('weak');
  });

  it('missing when no value', () => {
    expect(ev(null)).toBe('missing');
  });
});

/* ---------------------------------------------------------------------------
 * Per-header evaluator: X-Frame-Options
 * ------------------------------------------------------------------------- */

describe('X-Frame-Options evaluator', () => {
  const ev = (v) => evaluatorFor('X-Frame-Options')(v);

  it('good for DENY or SAMEORIGIN (case-insensitive)', () => {
    expect(ev('DENY')).toBe('good');
    expect(ev('deny')).toBe('good');
    expect(ev('SAMEORIGIN')).toBe('good');
    expect(ev('sameorigin')).toBe('good');
  });

  it('weak for ALLOW-FROM or anything else', () => {
    expect(ev('ALLOW-FROM https://example.com')).toBe('weak');
    expect(ev('garbage')).toBe('weak');
  });

  it('missing when no value', () => {
    expect(ev(null)).toBe('missing');
  });
});

/* ---------------------------------------------------------------------------
 * Per-header evaluator: Referrer-Policy
 *
 * THIS IS WHERE A BUG WAS FOUND: the original code returned 'good' for ANY
 * non-empty value except 'unsafe-url'. So permissive values like 'origin' or
 * 'no-referrer-when-downgrade' got reported as good. Fix: anything not in the
 * strict allowlist returns 'weak'.
 * ------------------------------------------------------------------------- */

describe('Referrer-Policy evaluator', () => {
  const ev = (v) => evaluatorFor('Referrer-Policy')(v);

  it('missing when no value', () => {
    expect(ev(null)).toBe('missing');
  });

  it('good for strict policies', () => {
    expect(ev('no-referrer')).toBe('good');
    expect(ev('strict-origin')).toBe('good');
    expect(ev('strict-origin-when-cross-origin')).toBe('good');
    expect(ev('same-origin')).toBe('good');
  });

  it('weak for unsafe-url', () => {
    expect(ev('unsafe-url')).toBe('weak');
  });

  // BUG FIX: these were all marked 'good' in v1.1.1
  it('weak for permissive non-strict values (regression guard)', () => {
    expect(ev('origin')).toBe('weak');
    expect(ev('origin-when-cross-origin')).toBe('weak');
    expect(ev('no-referrer-when-downgrade')).toBe('weak');
  });

  it('weak for garbage values (regression guard)', () => {
    expect(ev('foo-bar-baz')).toBe('weak');
    expect(ev('hello world')).toBe('weak');
  });
});

/* ---------------------------------------------------------------------------
 * Per-header evaluator: Permissions-Policy
 *
 * The original v1.1.1 evaluator was a length-only check (>= 10 chars => good),
 * which marked `camera=*` (9 chars, permissive) as weak — correct by accident —
 * BUT marked `camera=*, microphone=*` (22 chars, fully permissive) as good,
 * which is wrong. And `camera=()` (9 chars, strict deny) as weak — also wrong.
 *
 * Fix: parse the directives. Strict if all use `()` or `'self'`. Weak if any
 * uses `*` (wildcard allowlist).
 * ------------------------------------------------------------------------- */

describe('Permissions-Policy evaluator', () => {
  const ev = (v) => evaluatorFor('Permissions-Policy')(v);

  it('missing when no value', () => {
    expect(ev(null)).toBe('missing');
  });

  it('good for strict deny-everything policy', () => {
    expect(ev('camera=()')).toBe('good');
    expect(ev('camera=(), microphone=(), geolocation=()')).toBe('good');
  });

  it('good for self-only policy', () => {
    expect(ev("camera=(self)")).toBe('good');
  });

  it('weak for wildcard allowlists', () => {
    expect(ev('camera=*')).toBe('weak');
    expect(ev('camera=*, microphone=*')).toBe('weak');
  });

  it('weak for mixed permissive policies', () => {
    expect(ev('camera=*, microphone=()')).toBe('weak'); // any * = weak
  });
});

/* ---------------------------------------------------------------------------
 * analyzeHeaders integration
 * ------------------------------------------------------------------------- */

describe('analyzeHeaders', () => {
  it('returns one result per defined header regardless of input case', () => {
    const headers = {
      'content-security-policy': "default-src 'self'",
      'STRICT-TRANSPORT-SECURITY': 'max-age=31536000',
      'X-Frame-Options': 'DENY',
    };
    const results = analyzeHeaders(headers);
    expect(results).toHaveLength(HEADER_DEFINITIONS.length);
    const csp = results.find((r) => r.name === 'Content-Security-Policy');
    const hsts = results.find((r) => r.name === 'Strict-Transport-Security');
    const xfo = results.find((r) => r.name === 'X-Frame-Options');
    expect(csp.status).toBe('good');
    expect(hsts.status).toBe('good');
    expect(xfo.status).toBe('good');
  });

  it('reports missing for absent headers', () => {
    const results = analyzeHeaders({});
    results.forEach((r) => expect(r.status).toBe('missing'));
  });
});

/* ---------------------------------------------------------------------------
 * calculateGrade
 * ------------------------------------------------------------------------- */

describe('calculateGrade', () => {
  it('F grade when every header is missing', () => {
    const results = analyzeHeaders({});
    const grade = calculateGrade(results);
    expect(grade.grade).toBe('F');
    expect(grade.percentage).toBe(0);
  });

  it('A+ when every header is good', () => {
    const results = HEADER_DEFINITIONS.map((def) => ({
      name: def.name,
      status: 'good',
      severity: def.severity,
      weight: def.weight,
      deprecated: def.deprecated || false,
    }));
    const grade = calculateGrade(results);
    expect(grade.grade).toBe('A+');
    expect(grade.percentage).toBe(100);
  });

  it('counts critical/important/optional issues separately', () => {
    const results = analyzeHeaders({});
    const grade = calculateGrade(results);
    const crit = HEADER_DEFINITIONS.filter(
      (d) => d.severity === 'critical' && !d.deprecated
    ).length;
    const imp = HEADER_DEFINITIONS.filter(
      (d) => d.severity === 'important' && !d.deprecated
    ).length;
    const opt = HEADER_DEFINITIONS.filter(
      (d) => d.severity === 'optional' && !d.deprecated
    ).length;
    expect(grade.criticalIssues).toBe(crit);
    expect(grade.importantIssues).toBe(imp);
    expect(grade.optionalIssues).toBe(opt);
  });

  it('ignores deprecated headers when counting issues', () => {
    // X-XSS-Protection is the deprecated one; even when missing it shouldn't
    // appear in any of the issue counts.
    const results = analyzeHeaders({});
    const grade = calculateGrade(results);
    const xss = HEADER_DEFINITIONS.find((d) => d.name === 'X-XSS-Protection');
    expect(xss.deprecated).toBe(true);
    // Deprecated headers contribute to maxScore but not to issue counts.
    // Sanity: total counted issues equals non-deprecated header count.
    const nonDep = HEADER_DEFINITIONS.filter((d) => !d.deprecated).length;
    expect(
      grade.criticalIssues + grade.importantIssues + grade.optionalIssues
    ).toBe(nonDep);
  });
});

/* ---------------------------------------------------------------------------
 * gradeColor / badgeBgColor
 * ------------------------------------------------------------------------- */

describe('gradeColor and badgeBgColor', () => {
  it('return valid hex strings for known grades', () => {
    ['A+', 'A', 'B', 'C', 'D', 'F'].forEach((g) => {
      expect(gradeColor(g)).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(badgeBgColor(g)).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('return fallback for unknown grade', () => {
    expect(gradeColor('Z')).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(badgeBgColor('Z')).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

/* ---------------------------------------------------------------------------
 * formatReport
 * ------------------------------------------------------------------------- */

describe('formatReport', () => {
  it('includes the URL, grade, and per-header status', () => {
    const results = analyzeHeaders({
      'content-security-policy': "default-src 'self'",
    });
    const grade = calculateGrade(results);
    const report = formatReport('https://example.com', grade, results);
    expect(report).toContain('https://example.com');
    expect(report).toContain('Grade:');
    expect(report).toContain('Content-Security-Policy');
    expect(report).toContain('PASS');
  });
});
