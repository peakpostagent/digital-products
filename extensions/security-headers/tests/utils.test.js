// utils.test.js — unit tests for lib/utils.js helpers.
// Same script-loading pattern as headers.test.js (utils.js is loaded via
// <script> in popup.html, not as an ES module).

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let escapeHtml, getHostname, formatDate, formatTime,
    normalizeUrl, csvCell, toCsv, downloadFile;

beforeAll(() => {
  const code = readFileSync(resolve(__dirname, '../src/lib/utils.js'), 'utf-8');
  const wrapped = code + `\nreturn { escapeHtml, getHostname, formatDate, formatTime, normalizeUrl, csvCell, toCsv, downloadFile };`;
  const exports = new Function(wrapped)();
  ({ escapeHtml, getHostname, formatDate, formatTime, normalizeUrl, csvCell, toCsv, downloadFile } = exports);
});

/* ---------- escapeHtml ---------- */

describe('escapeHtml', () => {
  it('escapes the 5 standard HTML special chars', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('A & B')).toBe('A &amp; B');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('coerces non-string input', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(true)).toBe('true');
  });

  it('escapes ALL ampersands, even inside already-escaped entities (double-escape is intentional defense)', () => {
    // If a user-supplied string already contains an entity, we double-escape
    // it on purpose so it renders as text, not as the entity.
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});

/* ---------- getHostname ---------- */

describe('getHostname', () => {
  it('extracts hostname from valid URLs', () => {
    expect(getHostname('https://example.com/path')).toBe('example.com');
    expect(getHostname('http://sub.example.com:8080/foo')).toBe('sub.example.com');
    expect(getHostname('https://example.com')).toBe('example.com');
  });

  it('returns empty string for invalid URLs', () => {
    expect(getHostname('not a url')).toBe('');
    expect(getHostname('')).toBe('');
    expect(getHostname(null)).toBe('');
  });
});

/* ---------- normalizeUrl ---------- */

describe('normalizeUrl', () => {
  it('adds https:// to bare domains', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
    expect(normalizeUrl('sub.example.com')).toBe('https://sub.example.com/');
  });

  it('preserves http:// and https:// protocols', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
    expect(normalizeUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('trims whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com/');
  });

  it('returns null for invalid input', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });

  it('returns null for malformed strings', () => {
    // URL constructor accepts a lot of weird inputs — these are confirmed bad
    expect(normalizeUrl('http://')).toBeNull();
  });
});

/* ---------- csvCell ---------- */

describe('csvCell', () => {
  it('returns plain strings unchanged when no special chars', () => {
    expect(csvCell('hello')).toBe('hello');
    expect(csvCell('hello world')).toBe('hello world');
    expect(csvCell('A+ grade')).toBe('A+ grade');
  });

  it('wraps and escapes when value contains comma', () => {
    expect(csvCell('a, b, c')).toBe('"a, b, c"');
  });

  it('wraps and doubles embedded quotes', () => {
    expect(csvCell('she said "hi"')).toBe('"she said ""hi"""');
  });

  it('wraps when value contains newline (LF or CRLF)', () => {
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(csvCell('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('handles null and undefined as empty string', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('coerces numbers to strings', () => {
    expect(csvCell(42)).toBe('42');
    expect(csvCell(0)).toBe('0');
  });
});

/* ---------- toCsv ---------- */

describe('toCsv', () => {
  it('joins rows with CRLF, cells with comma', () => {
    const rows = [
      ['Name', 'Score'],
      ['Alice', 95],
      ['Bob', 80],
    ];
    expect(toCsv(rows)).toBe('Name,Score\r\nAlice,95\r\nBob,80');
  });

  it('escapes cells containing commas, quotes, or newlines', () => {
    const rows = [
      ['Field', 'Value'],
      ['quote-test', 'she said "hi"'],
      ['comma-test', 'a, b'],
    ];
    expect(toCsv(rows)).toBe('Field,Value\r\nquote-test,"she said ""hi"""\r\ncomma-test,"a, b"');
  });

  it('handles an empty array', () => {
    expect(toCsv([])).toBe('');
  });
});

/* ---------- formatDate / formatTime ---------- */

describe('formatDate and formatTime', () => {
  // Note: locale-dependent. These tests just verify shape, not exact content.
  it('returns non-empty strings for valid timestamps', () => {
    const ts = Date.UTC(2026, 4, 15, 14, 30, 0); // 2026-05-15 14:30 UTC
    expect(formatDate(ts)).toMatch(/.+/);
    expect(formatTime(ts)).toMatch(/.+/);
  });

  it('formatDate includes the year', () => {
    const ts = Date.UTC(2026, 4, 15);
    expect(formatDate(ts)).toContain('2026');
  });
});
