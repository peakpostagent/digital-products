/**
 * calculator.test.js — Comprehensive unit tests for Read Cost calculator.js
 *
 * Uses Vitest with jsdom environment.
 * Tests cover: countWords, estimateReadingTime, calculateReadingCost,
 * formatTime, formatCost, extractArticleText, getReadingLevel, and edge cases.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

// Load calculator.js in global scope (IIFE with ReadCost namespace)
let ReadCost;

beforeAll(() => {
  const code = readFileSync(
    resolve(__dirname, '../src/lib/calculator.js'),
    'utf-8'
  );
  const fn = new Function(code + '\nreturn ReadCost;');
  ReadCost = fn();
});

// =========================================================
// countWords
// =========================================================
describe('countWords', () => {
  it('counts words in a simple sentence', () => {
    expect(ReadCost.countWords('hello world')).toBe(2);
  });

  it('counts words in a longer sentence', () => {
    expect(ReadCost.countWords('The quick brown fox jumps over the lazy dog')).toBe(9);
  });

  it('handles multiple spaces between words', () => {
    expect(ReadCost.countWords('hello    world    test')).toBe(3);
  });

  it('handles tabs between words', () => {
    expect(ReadCost.countWords('hello\tworld\ttest')).toBe(3);
  });

  it('handles newlines between words', () => {
    expect(ReadCost.countWords('hello\nworld\ntest')).toBe(3);
  });

  it('handles mixed whitespace', () => {
    expect(ReadCost.countWords('  hello  \n\n  world  \t  test  ')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(ReadCost.countWords('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(ReadCost.countWords('   \t\n  ')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(ReadCost.countWords(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(ReadCost.countWords(undefined)).toBe(0);
  });

  it('returns 0 for non-string input', () => {
    expect(ReadCost.countWords(42)).toBe(0);
  });

  it('counts a single word', () => {
    expect(ReadCost.countWords('hello')).toBe(1);
  });

  it('handles unicode characters', () => {
    expect(ReadCost.countWords('caf\u00E9 r\u00E9sum\u00E9')).toBe(2);
  });

  it('handles CJK characters as single words per cluster', () => {
    // CJK characters without spaces are treated as one "word"
    expect(ReadCost.countWords('\u4F60\u597D \u4E16\u754C')).toBe(2);
  });

  it('handles text with numbers', () => {
    expect(ReadCost.countWords('there are 3 cats and 2 dogs')).toBe(7);
  });

  it('handles hyphenated words as single words', () => {
    expect(ReadCost.countWords('well-known state-of-the-art')).toBe(2);
  });

  it('counts words with punctuation', () => {
    expect(ReadCost.countWords('Hello, world! How are you?')).toBe(5);
  });
});

// =========================================================
// estimateReadingTime
// =========================================================
describe('estimateReadingTime', () => {
  it('calculates reading time at default WPM (238)', () => {
    const result = ReadCost.estimateReadingTime(238);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(0);
    expect(result.totalSeconds).toBe(60);
  });

  it('calculates reading time for 476 words at 238 WPM', () => {
    const result = ReadCost.estimateReadingTime(476, 238);
    expect(result.minutes).toBe(2);
    expect(result.seconds).toBe(0);
  });

  it('calculates reading time at slow speed (150 WPM)', () => {
    const result = ReadCost.estimateReadingTime(150, 150);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(0);
  });

  it('calculates reading time at fast speed (350 WPM)', () => {
    const result = ReadCost.estimateReadingTime(350, 350);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(0);
  });

  it('handles fractional minutes', () => {
    const result = ReadCost.estimateReadingTime(119, 238);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(30);
    expect(result.totalSeconds).toBe(30);
  });

  it('returns zeros for zero word count', () => {
    const result = ReadCost.estimateReadingTime(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.totalSeconds).toBe(0);
  });

  it('returns zeros for negative word count', () => {
    const result = ReadCost.estimateReadingTime(-100);
    expect(result.minutes).toBe(0);
    expect(result.totalSeconds).toBe(0);
  });

  it('returns zeros for null word count', () => {
    const result = ReadCost.estimateReadingTime(null);
    expect(result.minutes).toBe(0);
    expect(result.totalSeconds).toBe(0);
  });

  it('uses default WPM when wpm is 0', () => {
    const result = ReadCost.estimateReadingTime(238, 0);
    expect(result.minutes).toBe(1);
  });

  it('uses default WPM when wpm is negative', () => {
    const result = ReadCost.estimateReadingTime(238, -100);
    expect(result.minutes).toBe(1);
  });

  it('calculates correctly for a long article (5000 words)', () => {
    const result = ReadCost.estimateReadingTime(5000, 238);
    // 5000 / 238 = ~21.01 minutes
    expect(result.minutes).toBe(21);
    expect(result.totalSeconds).toBeGreaterThan(1200);
  });

  it('calculates correctly for a very short text (10 words)', () => {
    const result = ReadCost.estimateReadingTime(10, 238);
    // 10 / 238 = ~0.042 minutes = ~2.5 seconds
    expect(result.minutes).toBe(0);
    expect(result.totalSeconds).toBeLessThan(5);
  });
});

// =========================================================
// calculateReadingCost
// =========================================================
describe('calculateReadingCost', () => {
  it('calculates cost for 60 minutes at $50/hr = $50', () => {
    const result = ReadCost.calculateReadingCost(60, 50);
    expect(result.cost).toBe(50);
  });

  it('calculates cost for 8 minutes at $75/hr = $10', () => {
    const result = ReadCost.calculateReadingCost(8, 75);
    expect(result.cost).toBe(10);
  });

  it('calculates cost for 1 minute at $60/hr = $1', () => {
    const result = ReadCost.calculateReadingCost(1, 60);
    expect(result.cost).toBe(1);
  });

  it('calculates cost for 30 minutes at $100/hr = $50', () => {
    const result = ReadCost.calculateReadingCost(30, 100);
    expect(result.cost).toBe(50);
  });

  it('returns cost of 0 for 0 minutes', () => {
    const result = ReadCost.calculateReadingCost(0, 50);
    expect(result.cost).toBe(0);
  });

  it('returns cost of 0 for 0 hourly rate', () => {
    const result = ReadCost.calculateReadingCost(10, 0);
    expect(result.cost).toBe(0);
  });

  it('returns cost of 0 for negative minutes', () => {
    const result = ReadCost.calculateReadingCost(-5, 50);
    expect(result.cost).toBe(0);
  });

  it('returns cost of 0 for negative rate', () => {
    const result = ReadCost.calculateReadingCost(10, -50);
    expect(result.cost).toBe(0);
  });

  it('returns cost of 0 for null inputs', () => {
    expect(ReadCost.calculateReadingCost(null, 50).cost).toBe(0);
    expect(ReadCost.calculateReadingCost(10, null).cost).toBe(0);
  });

  it('returns a formattedCost string', () => {
    const result = ReadCost.calculateReadingCost(8, 75);
    expect(result.formattedCost).toBe('$10.00');
  });

  it('formats small costs correctly', () => {
    const result = ReadCost.calculateReadingCost(1, 30);
    expect(result.cost).toBe(0.5);
    expect(result.formattedCost).toBe('$0.50');
  });

  it('rounds cost to 2 decimal places', () => {
    const result = ReadCost.calculateReadingCost(7, 33);
    // 7/60 * 33 = 3.85
    expect(result.cost).toBe(3.85);
  });
});

// =========================================================
// formatTime
// =========================================================
describe('formatTime', () => {
  it('formats less than 1 minute', () => {
    expect(ReadCost.formatTime(0.5)).toBe('< 1 min read');
  });

  it('formats exactly 0 minutes', () => {
    expect(ReadCost.formatTime(0)).toBe('< 1 min read');
  });

  it('formats 1 minute', () => {
    expect(ReadCost.formatTime(1)).toBe('1 min read');
  });

  it('formats 5 minutes', () => {
    expect(ReadCost.formatTime(5)).toBe('5 min read');
  });

  it('formats 59 minutes', () => {
    expect(ReadCost.formatTime(59)).toBe('59 min read');
  });

  it('formats exactly 60 minutes as 1 hr', () => {
    expect(ReadCost.formatTime(60)).toBe('1 hr read');
  });

  it('formats 75 minutes as 1 hr 15 min', () => {
    expect(ReadCost.formatTime(75)).toBe('1 hr 15 min read');
  });

  it('formats 120 minutes as 2 hr', () => {
    expect(ReadCost.formatTime(120)).toBe('2 hr read');
  });

  it('formats 150 minutes as 2 hr 30 min', () => {
    expect(ReadCost.formatTime(150)).toBe('2 hr 30 min read');
  });

  it('handles null input', () => {
    expect(ReadCost.formatTime(null)).toBe('< 1 min read');
  });

  it('handles undefined input', () => {
    expect(ReadCost.formatTime(undefined)).toBe('< 1 min read');
  });

  it('handles negative input', () => {
    expect(ReadCost.formatTime(-5)).toBe('< 1 min read');
  });

  it('rounds fractional minutes correctly (4.7 -> 5 min)', () => {
    expect(ReadCost.formatTime(4.7)).toBe('5 min read');
  });

  it('rounds 0.4 to < 1 min', () => {
    expect(ReadCost.formatTime(0.4)).toBe('< 1 min read');
  });
});

// =========================================================
// formatCost
// =========================================================
describe('formatCost', () => {
  it('formats USD correctly', () => {
    expect(ReadCost.formatCost(50, 'USD')).toBe('$50.00');
  });

  it('formats USD with cents', () => {
    expect(ReadCost.formatCost(4.5, 'USD')).toBe('$4.50');
  });

  it('formats large USD amounts with commas', () => {
    expect(ReadCost.formatCost(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats EUR with euro symbol', () => {
    expect(ReadCost.formatCost(100, 'EUR')).toBe('\u20AC100.00');
  });

  it('formats GBP with pound symbol', () => {
    expect(ReadCost.formatCost(75, 'GBP')).toBe('\u00A375.00');
  });

  it('formats CAD with CA$ prefix', () => {
    expect(ReadCost.formatCost(50, 'CAD')).toBe('CA$50.00');
  });

  it('formats AUD with A$ prefix', () => {
    expect(ReadCost.formatCost(50, 'AUD')).toBe('A$50.00');
  });

  it('formats JPY with yen symbol and no decimals', () => {
    expect(ReadCost.formatCost(5000, 'JPY')).toBe('\u00A55,000');
  });

  it('formats INR with rupee symbol', () => {
    expect(ReadCost.formatCost(500, 'INR')).toBe('\u20B9500.00');
  });

  it('defaults to $ for unknown currency', () => {
    expect(ReadCost.formatCost(10, 'XYZ')).toBe('$10.00');
  });

  it('defaults to USD when no currency specified', () => {
    expect(ReadCost.formatCost(25)).toBe('$25.00');
  });

  it('formats zero amount', () => {
    expect(ReadCost.formatCost(0, 'USD')).toBe('$0.00');
  });

  it('handles null amount', () => {
    expect(ReadCost.formatCost(null, 'USD')).toBe('$0.00');
  });

  it('handles NaN amount', () => {
    expect(ReadCost.formatCost(NaN, 'USD')).toBe('$0.00');
  });
});

// =========================================================
// extractArticleText (with mock DOM)
// =========================================================
describe('extractArticleText', () => {
  /**
   * Helper to create a mock document from HTML string.
   */
  function createDoc(html) {
    const dom = new JSDOM(html);
    return dom.window.document;
  }

  it('extracts text from <article> element', () => {
    const doc = createDoc('<html><body><article>' +
      '<p>' + 'word '.repeat(200) + '</p>' +
      '</article></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(ReadCost.countWords(text)).toBeGreaterThan(100);
  });

  it('extracts text from [role="main"] element', () => {
    const doc = createDoc('<html><body><div role="main">' +
      '<p>' + 'content '.repeat(200) + '</p>' +
      '</div></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(ReadCost.countWords(text)).toBeGreaterThan(100);
  });

  it('extracts text from .post-content element', () => {
    const doc = createDoc('<html><body><div class="post-content">' +
      '<p>' + 'text '.repeat(200) + '</p>' +
      '</div></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(ReadCost.countWords(text)).toBeGreaterThan(100);
  });

  it('extracts text from <main> element', () => {
    const doc = createDoc('<html><body><main>' +
      '<p>' + 'paragraph '.repeat(200) + '</p>' +
      '</main></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(ReadCost.countWords(text)).toBeGreaterThan(100);
  });

  it('strips nav elements from extracted text', () => {
    const doc = createDoc('<html><body><article>' +
      '<nav>Navigation links here</nav>' +
      '<p>' + 'article '.repeat(200) + '</p>' +
      '</article></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(text).not.toContain('Navigation links here');
  });

  it('strips script elements from extracted text', () => {
    const doc = createDoc('<html><body><article>' +
      '<script>var x = 1;</script>' +
      '<p>' + 'content '.repeat(200) + '</p>' +
      '</article></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(text).not.toContain('var x = 1');
  });

  it('strips footer elements from extracted text', () => {
    const doc = createDoc('<html><body><article>' +
      '<p>' + 'article '.repeat(200) + '</p>' +
      '<footer>Footer copyright info</footer>' +
      '</article></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(text).not.toContain('Footer copyright info');
  });

  it('falls back to largest text block when no article selectors match', () => {
    const doc = createDoc('<html><body>' +
      '<div id="sidebar"><p>Short text</p></div>' +
      '<div id="main-content"><p>' + 'large block '.repeat(200) + '</p></div>' +
      '</body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(ReadCost.countWords(text)).toBeGreaterThan(100);
  });

  it('returns empty string for empty document', () => {
    const doc = createDoc('<html><body></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(text).toBe('');
  });

  it('returns empty string for null document', () => {
    expect(ReadCost.extractArticleText(null)).toBe('');
  });

  it('returns empty string for document with no body', () => {
    expect(ReadCost.extractArticleText({})).toBe('');
  });

  it('skips article elements with too few words', () => {
    const doc = createDoc('<html><body>' +
      '<article><p>Very short</p></article>' +
      '<div><p>' + 'main content '.repeat(200) + '</p></div>' +
      '</body></html>');
    const text = ReadCost.extractArticleText(doc);
    // Should fall through to the larger div
    expect(ReadCost.countWords(text)).toBeGreaterThan(50);
  });

  it('extracts text from .entry-content selector', () => {
    const doc = createDoc('<html><body><div class="entry-content">' +
      '<p>' + 'blog post '.repeat(200) + '</p>' +
      '</div></body></html>');
    const text = ReadCost.extractArticleText(doc);
    expect(ReadCost.countWords(text)).toBeGreaterThan(100);
  });
});

// =========================================================
// getReadingLevel
// =========================================================
describe('getReadingLevel', () => {
  it('returns quick for under 3 minutes of reading (< 714 words at 238 WPM)', () => {
    expect(ReadCost.getReadingLevel(500, 238)).toBe('quick');
  });

  it('returns moderate for 3-10 minutes (714-2380 words at 238 WPM)', () => {
    expect(ReadCost.getReadingLevel(1000, 238)).toBe('moderate');
  });

  it('returns long for 10-20 minutes (2380-4760 words at 238 WPM)', () => {
    expect(ReadCost.getReadingLevel(3000, 238)).toBe('long');
  });

  it('returns deep for over 20 minutes (> 4760 words at 238 WPM)', () => {
    expect(ReadCost.getReadingLevel(5000, 238)).toBe('deep');
  });

  it('returns quick for 0 words', () => {
    expect(ReadCost.getReadingLevel(0)).toBe('quick');
  });

  it('returns quick for negative word count', () => {
    expect(ReadCost.getReadingLevel(-100)).toBe('quick');
  });

  it('returns quick for null word count', () => {
    expect(ReadCost.getReadingLevel(null)).toBe('quick');
  });

  it('uses default WPM when not specified', () => {
    // 1000 words at 238 WPM = ~4.2 min = moderate
    expect(ReadCost.getReadingLevel(1000)).toBe('moderate');
  });

  it('adjusts level based on different WPM (slow reader)', () => {
    // 500 words at 150 WPM = ~3.3 min = moderate
    expect(ReadCost.getReadingLevel(500, 150)).toBe('moderate');
  });

  it('adjusts level based on different WPM (fast reader)', () => {
    // 1000 words at 350 WPM = ~2.86 min = quick
    expect(ReadCost.getReadingLevel(1000, 350)).toBe('quick');
  });

  it('boundary: exactly 3 minutes (714 words at 238 WPM)', () => {
    // 714 / 238 = 3.0 => moderate (>= 3)
    expect(ReadCost.getReadingLevel(714, 238)).toBe('moderate');
  });

  it('boundary: just under 10 minutes', () => {
    // 2379 / 238 = ~9.996 => moderate (< 10)
    expect(ReadCost.getReadingLevel(2379, 238)).toBe('moderate');
  });
});

// =========================================================
// getReadingLevelColor
// =========================================================
describe('getReadingLevelColor', () => {
  it('returns green for quick', () => {
    expect(ReadCost.getReadingLevelColor('quick')).toBe('#4caf50');
  });

  it('returns yellow for moderate', () => {
    expect(ReadCost.getReadingLevelColor('moderate')).toBe('#ffc107');
  });

  it('returns orange for long', () => {
    expect(ReadCost.getReadingLevelColor('long')).toBe('#ff9800');
  });

  it('returns red for deep', () => {
    expect(ReadCost.getReadingLevelColor('deep')).toBe('#f44336');
  });

  it('returns green for unknown level', () => {
    expect(ReadCost.getReadingLevelColor('unknown')).toBe('#4caf50');
  });
});

// =========================================================
// getReadingLevelLabel
// =========================================================
describe('getReadingLevelLabel', () => {
  it('returns "Quick read" for quick', () => {
    expect(ReadCost.getReadingLevelLabel('quick')).toBe('Quick read');
  });

  it('returns "Moderate read" for moderate', () => {
    expect(ReadCost.getReadingLevelLabel('moderate')).toBe('Moderate read');
  });

  it('returns "Long read" for long', () => {
    expect(ReadCost.getReadingLevelLabel('long')).toBe('Long read');
  });

  it('returns "Deep read" for deep', () => {
    expect(ReadCost.getReadingLevelLabel('deep')).toBe('Deep read');
  });

  it('returns "Quick read" for unknown level', () => {
    expect(ReadCost.getReadingLevelLabel('unknown')).toBe('Quick read');
  });
});

// =========================================================
// isArticlePage
// =========================================================
describe('isArticlePage', () => {
  function createDocWithUrl(url) {
    const dom = new JSDOM('<html><body></body></html>', { url: url });
    return dom.window.document;
  }

  it('returns true for a typical article URL', () => {
    const doc = createDocWithUrl('https://example.com/blog/my-article');
    expect(ReadCost.isArticlePage(doc)).toBe(true);
  });

  it('returns false for a home page (root URL)', () => {
    const doc = createDocWithUrl('https://example.com/');
    expect(ReadCost.isArticlePage(doc)).toBe(false);
  });

  it('returns false for a home page (no trailing slash)', () => {
    const doc = createDocWithUrl('https://example.com');
    expect(ReadCost.isArticlePage(doc)).toBe(false);
  });

  it('returns false for search results page', () => {
    const doc = createDocWithUrl('https://google.com/search?q=test');
    expect(ReadCost.isArticlePage(doc)).toBe(false);
  });

  it('returns false for login page', () => {
    const doc = createDocWithUrl('https://example.com/login');
    expect(ReadCost.isArticlePage(doc)).toBe(false);
  });

  it('returns false for dashboard page', () => {
    const doc = createDocWithUrl('https://app.example.com/dashboard');
    expect(ReadCost.isArticlePage(doc)).toBe(false);
  });

  it('returns false for settings page', () => {
    const doc = createDocWithUrl('https://example.com/settings');
    expect(ReadCost.isArticlePage(doc)).toBe(false);
  });

  it('returns false for null document', () => {
    expect(ReadCost.isArticlePage(null)).toBe(false);
  });

  it('returns false for document without body', () => {
    expect(ReadCost.isArticlePage({})).toBe(false);
  });

  it('returns false for cart page', () => {
    const doc = createDocWithUrl('https://shop.example.com/cart');
    expect(ReadCost.isArticlePage(doc)).toBe(false);
  });
});

// =========================================================
// formatNumber
// =========================================================
describe('formatNumber', () => {
  it('formats small numbers without commas', () => {
    expect(ReadCost.formatNumber(42)).toBe('42');
  });

  it('formats thousands with commas', () => {
    expect(ReadCost.formatNumber(1200)).toBe('1,200');
  });

  it('formats large numbers', () => {
    expect(ReadCost.formatNumber(12345)).toBe('12,345');
  });

  it('handles zero', () => {
    expect(ReadCost.formatNumber(0)).toBe('0');
  });

  it('handles null', () => {
    expect(ReadCost.formatNumber(null)).toBe('0');
  });

  it('handles NaN', () => {
    expect(ReadCost.formatNumber(NaN)).toBe('0');
  });
});

// =========================================================
// Constants and defaults
// =========================================================
describe('DEFAULTS', () => {
  it('has default hourly rate of 50', () => {
    expect(ReadCost.DEFAULTS.hourlyRate).toBe(50);
  });

  it('has default WPM of 238', () => {
    expect(ReadCost.DEFAULTS.wpm).toBe(238);
  });

  it('has default currency of USD', () => {
    expect(ReadCost.DEFAULTS.currency).toBe('USD');
  });

  it('has showBadge default true', () => {
    expect(ReadCost.DEFAULTS.showBadge).toBe(true);
  });

  it('has showReadingTime default true', () => {
    expect(ReadCost.DEFAULTS.showReadingTime).toBe(true);
  });

  it('has showWordCount default true', () => {
    expect(ReadCost.DEFAULTS.showWordCount).toBe(true);
  });
});

describe('CURRENCY_SYMBOLS', () => {
  it('has symbol for USD', () => {
    expect(ReadCost.CURRENCY_SYMBOLS.USD).toBe('$');
  });

  it('has symbol for EUR', () => {
    expect(ReadCost.CURRENCY_SYMBOLS.EUR).toBe('\u20AC');
  });

  it('has symbol for GBP', () => {
    expect(ReadCost.CURRENCY_SYMBOLS.GBP).toBe('\u00A3');
  });

  it('has symbols for all 7 supported currencies', () => {
    const supported = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];
    for (const c of supported) {
      expect(ReadCost.CURRENCY_SYMBOLS[c]).toBeDefined();
    }
  });
});

describe('WPM_PRESETS', () => {
  it('has slow preset at 150', () => {
    expect(ReadCost.WPM_PRESETS.slow).toBe(150);
  });

  it('has average preset at 238', () => {
    expect(ReadCost.WPM_PRESETS.average).toBe(238);
  });

  it('has fast preset at 350', () => {
    expect(ReadCost.WPM_PRESETS.fast).toBe(350);
  });
});

describe('DEFAULT_WPM', () => {
  it('is 238', () => {
    expect(ReadCost.DEFAULT_WPM).toBe(238);
  });
});

describe('DEFAULT_RATE', () => {
  it('is 50', () => {
    expect(ReadCost.DEFAULT_RATE).toBe(50);
  });
});

// =========================================================
// Edge cases and integration
// =========================================================
describe('Edge cases', () => {
  it('handles a very long article (100,000 words)', () => {
    const wordCount = 100000;
    const time = ReadCost.estimateReadingTime(wordCount, 238);
    const cost = ReadCost.calculateReadingCost(
      time.minutes + time.seconds / 60, 75
    );
    // ~420 minutes = ~7 hours at $75/hr = ~$525
    expect(time.minutes).toBeGreaterThan(400);
    expect(cost.cost).toBeGreaterThan(500);
  });

  it('handles exactly 100 words (minimum threshold)', () => {
    const time = ReadCost.estimateReadingTime(100, 238);
    // ~25 seconds
    expect(time.totalSeconds).toBeGreaterThan(20);
    expect(time.totalSeconds).toBeLessThan(30);
  });

  it('end-to-end: 1200 words at 238 WPM with $75/hr', () => {
    const wordCount = 1200;
    const time = ReadCost.estimateReadingTime(wordCount, 238);
    // ~5.04 minutes
    expect(time.minutes).toBe(5);

    const cost = ReadCost.calculateReadingCost(
      time.minutes + time.seconds / 60, 75
    );
    // ~$6.30
    expect(cost.cost).toBeGreaterThan(6);
    expect(cost.cost).toBeLessThan(7);

    const formatted = ReadCost.formatTime(time.minutes + time.seconds / 60);
    expect(formatted).toBe('5 min read');

    const level = ReadCost.getReadingLevel(wordCount, 238);
    expect(level).toBe('moderate');
  });

  it('end-to-end: 200 words at 150 WPM (slow reader) with $100/hr', () => {
    const wordCount = 200;
    const time = ReadCost.estimateReadingTime(wordCount, 150);
    // ~1.33 minutes
    const totalMin = time.minutes + time.seconds / 60;
    expect(totalMin).toBeGreaterThan(1);
    expect(totalMin).toBeLessThan(2);

    const cost = ReadCost.calculateReadingCost(totalMin, 100);
    // ~$2.22
    expect(cost.cost).toBeGreaterThan(2);
    expect(cost.cost).toBeLessThan(3);
  });

  it('formatCost with very large amount', () => {
    const result = ReadCost.formatCost(999999.99, 'USD');
    expect(result).toContain('999');
  });

  it('JPY formatting has no decimal places', () => {
    const result = ReadCost.formatCost(1234.56, 'JPY');
    // JPY should round and show no decimals
    expect(result).toBe('\u00A51,235');
  });

  it('CURRENCY_DECIMALS defines 0 for JPY', () => {
    expect(ReadCost.CURRENCY_DECIMALS.JPY).toBe(0);
  });

  it('CURRENCY_DECIMALS defines 2 for USD', () => {
    expect(ReadCost.CURRENCY_DECIMALS.USD).toBe(2);
  });
});

// =========================================================
// cleanElementText
// =========================================================
describe('cleanElementText', () => {
  it('returns empty string for null element', () => {
    expect(ReadCost.cleanElementText(null)).toBe('');
  });

  it('extracts text and normalizes whitespace', () => {
    const dom = new JSDOM('<div><p>Hello   world</p> <p>Another   paragraph</p></div>');
    const el = dom.window.document.querySelector('div');
    const text = ReadCost.cleanElementText(el);
    expect(text).toBe('Hello world Another paragraph');
  });

  it('removes script content', () => {
    const dom = new JSDOM('<div><p>Real content</p><script>alert("hi")</script></div>');
    const el = dom.window.document.querySelector('div');
    const text = ReadCost.cleanElementText(el);
    expect(text).not.toContain('alert');
    expect(text).toContain('Real content');
  });

  it('removes style content', () => {
    const dom = new JSDOM('<div><p>Real text</p><style>body{color:red}</style></div>');
    const el = dom.window.document.querySelector('div');
    const text = ReadCost.cleanElementText(el);
    expect(text).not.toContain('color:red');
    expect(text).toContain('Real text');
  });
});

// =========================================================
// ARTICLE_SELECTORS
// =========================================================
describe('ARTICLE_SELECTORS', () => {
  it('includes article as a selector', () => {
    expect(ReadCost.ARTICLE_SELECTORS).toContain('article');
  });

  it('includes [role="main"]', () => {
    expect(ReadCost.ARTICLE_SELECTORS).toContain('[role="main"]');
  });

  it('includes main', () => {
    expect(ReadCost.ARTICLE_SELECTORS).toContain('main');
  });

  it('includes .post-content', () => {
    expect(ReadCost.ARTICLE_SELECTORS).toContain('.post-content');
  });

  it('includes .article-body', () => {
    expect(ReadCost.ARTICLE_SELECTORS).toContain('.article-body');
  });
});
