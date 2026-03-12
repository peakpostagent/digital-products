/**
 * calculator.js — Core reading time and cost calculation logic for Read Cost
 *
 * Exposes a global ReadCost namespace with pure functions for:
 * - Counting words in text
 * - Estimating reading time
 * - Calculating dollar cost of reading
 * - Formatting time and currency values
 * - Extracting article text from a page
 * - Classifying reading level
 */

var ReadCost = (function () {
  'use strict';

  // -------------------------------------------------------
  // Constants
  // -------------------------------------------------------

  /** Default reading speed — average adult (words per minute) */
  var DEFAULT_WPM = 238;

  /** Default hourly rate in dollars */
  var DEFAULT_RATE = 50;

  /** Supported currency symbols */
  var CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '\u00A5',
    INR: '\u20B9'
  };

  /** Currency decimal places (JPY uses 0) */
  var CURRENCY_DECIMALS = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    CAD: 2,
    AUD: 2,
    JPY: 0,
    INR: 2
  };

  /** Default settings */
  var DEFAULTS = {
    hourlyRate: 50,
    wpm: 238,
    currency: 'USD',
    showBadge: true,
    showReadingTime: true,
    showWordCount: true
  };

  /** WPM presets for common reading speeds */
  var WPM_PRESETS = {
    slow: 150,
    average: 238,
    fast: 350
  };

  /** Selectors for elements to strip from article text */
  var STRIP_SELECTORS = [
    'nav', 'header', 'footer', 'aside', 'sidebar',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '[role="complementary"]', '.sidebar', '.nav', '.navigation',
    '.header', '.footer', '.menu', '.ad', '.advertisement',
    '.social-share', '.comments', '.comment', '.related-posts',
    'script', 'style', 'noscript', 'iframe', 'svg',
    'form', 'button', 'input', 'select', 'textarea'
  ];

  /** Selectors to try for article content, in priority order */
  var ARTICLE_SELECTORS = [
    'article',
    '[role="main"]',
    '.post-content',
    '.article-body',
    '.article-content',
    '.entry-content',
    '.post-body',
    '.story-body',
    '.content-body',
    'main',
    '.content',
    '#content'
  ];

  // -------------------------------------------------------
  // Word counting
  // -------------------------------------------------------

  /**
   * Count the number of words in a text string.
   * Handles multiple spaces, newlines, tabs, and unicode.
   *
   * @param {string} text - The text to count words in
   * @returns {number} The word count
   */
  function countWords(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    // Normalize whitespace and trim
    var trimmed = text.trim();
    if (trimmed.length === 0) {
      return 0;
    }
    // Split on whitespace sequences and filter empty strings
    var words = trimmed.split(/\s+/).filter(function (w) {
      return w.length > 0;
    });
    return words.length;
  }

  // -------------------------------------------------------
  // Reading time estimation
  // -------------------------------------------------------

  /**
   * Estimate reading time based on word count and reading speed.
   *
   * @param {number} wordCount - Number of words
   * @param {number} [wpm=238] - Words per minute reading speed
   * @returns {{ minutes: number, seconds: number, totalSeconds: number }}
   */
  function estimateReadingTime(wordCount, wpm) {
    if (!wordCount || wordCount <= 0) {
      return { minutes: 0, seconds: 0, totalSeconds: 0 };
    }
    var speed = (wpm && wpm > 0) ? wpm : DEFAULT_WPM;
    var totalMinutes = wordCount / speed;
    var totalSeconds = Math.round(totalMinutes * 60);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return {
      minutes: minutes,
      seconds: seconds,
      totalSeconds: totalSeconds
    };
  }

  // -------------------------------------------------------
  // Cost calculation
  // -------------------------------------------------------

  /**
   * Calculate the dollar cost of reading based on time and hourly rate.
   *
   * @param {number} readingTimeMinutes - Reading time in minutes
   * @param {number} hourlyRate - Hourly rate in currency units
   * @returns {{ cost: number, formattedCost: string }}
   */
  function calculateReadingCost(readingTimeMinutes, hourlyRate) {
    if (!readingTimeMinutes || readingTimeMinutes <= 0 ||
        !hourlyRate || hourlyRate <= 0) {
      return { cost: 0, formattedCost: '$0.00' };
    }
    var hours = readingTimeMinutes / 60;
    var cost = Math.round(hours * hourlyRate * 100) / 100;
    return {
      cost: cost,
      formattedCost: '$' + cost.toFixed(2)
    };
  }

  // -------------------------------------------------------
  // Formatting
  // -------------------------------------------------------

  /**
   * Format reading time as a human-readable string.
   *
   * @param {number} minutes - Reading time in minutes (can be fractional)
   * @returns {string} Formatted time string
   */
  function formatTime(minutes) {
    if (minutes === null || minutes === undefined || minutes < 0) {
      return '< 1 min read';
    }
    if (minutes < 1) {
      return '< 1 min read';
    }
    var roundedMinutes = Math.round(minutes);
    if (roundedMinutes < 1) {
      return '< 1 min read';
    }
    if (roundedMinutes < 60) {
      return roundedMinutes + ' min read';
    }
    var hours = Math.floor(roundedMinutes / 60);
    var remainingMinutes = roundedMinutes % 60;
    if (remainingMinutes === 0) {
      return hours + ' hr read';
    }
    return hours + ' hr ' + remainingMinutes + ' min read';
  }

  /**
   * Format a currency amount with the appropriate symbol.
   *
   * @param {number} amount - The amount to format
   * @param {string} [currency='USD'] - The currency code
   * @returns {string} Formatted cost string
   */
  function formatCost(amount, currency) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    var curr = currency || 'USD';
    var symbol = CURRENCY_SYMBOLS[curr] || '$';
    var decimals = CURRENCY_DECIMALS[curr];
    if (decimals === undefined) {
      decimals = 2;
    }
    var absAmount = Math.abs(amount);
    var formatted = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    var prefix = amount < 0 ? '-' : '';
    return prefix + symbol + formatted;
  }

  // -------------------------------------------------------
  // Article text extraction
  // -------------------------------------------------------

  /**
   * Extract the main article/content text from a page.
   * Tries known selectors, falls back to largest text block.
   *
   * @param {Document} doc - The document to extract text from
   * @returns {string} Cleaned text string
   */
  function extractArticleText(doc) {
    if (!doc || !doc.body) {
      return '';
    }

    // Try known article selectors in priority order
    for (var i = 0; i < ARTICLE_SELECTORS.length; i++) {
      var selector = ARTICLE_SELECTORS[i];
      var el = doc.querySelector(selector);
      if (el) {
        var text = cleanElementText(el);
        if (countWords(text) > 50) {
          return text;
        }
      }
    }

    // Fallback: find the largest text block on the page
    return findLargestTextBlock(doc);
  }

  /**
   * Clean text from a DOM element by stripping unwanted child elements.
   *
   * @param {Element} element - The DOM element
   * @returns {string} Cleaned text
   */
  function cleanElementText(element) {
    if (!element) {
      return '';
    }
    // Clone so we don't modify the real DOM
    var clone = element.cloneNode(true);

    // Remove unwanted elements
    for (var i = 0; i < STRIP_SELECTORS.length; i++) {
      var unwanted = clone.querySelectorAll(STRIP_SELECTORS[i]);
      for (var j = 0; j < unwanted.length; j++) {
        unwanted[j].remove();
      }
    }

    // Get text and normalize whitespace
    var text = clone.textContent || '';
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Find the largest text block on the page (fallback method).
   * Looks at div and section elements, picks the one with the most text.
   *
   * @param {Document} doc - The document
   * @returns {string} Text from the largest block
   */
  function findLargestTextBlock(doc) {
    var candidates = doc.querySelectorAll('div, section');
    var bestText = '';
    var bestWordCount = 0;

    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var text = cleanElementText(el);
      var words = countWords(text);
      if (words > bestWordCount) {
        bestWordCount = words;
        bestText = text;
      }
    }

    return bestText;
  }

  // -------------------------------------------------------
  // Reading level classification
  // -------------------------------------------------------

  /**
   * Classify reading level based on estimated reading time.
   * Uses word count and default WPM to estimate.
   *
   * @param {number} wordCount - Number of words in the article
   * @param {number} [wpm=238] - Words per minute (used to compute time)
   * @returns {'quick' | 'moderate' | 'long' | 'deep'}
   */
  function getReadingLevel(wordCount, wpm) {
    if (!wordCount || wordCount <= 0) {
      return 'quick';
    }
    var speed = (wpm && wpm > 0) ? wpm : DEFAULT_WPM;
    var minutes = wordCount / speed;

    if (minutes < 3) {
      return 'quick';
    }
    if (minutes < 10) {
      return 'moderate';
    }
    if (minutes < 20) {
      return 'long';
    }
    return 'deep';
  }

  /**
   * Get the display color for a reading level.
   *
   * @param {'quick' | 'moderate' | 'long' | 'deep'} level
   * @returns {string} CSS color value
   */
  function getReadingLevelColor(level) {
    switch (level) {
      case 'quick':    return '#4caf50'; // green
      case 'moderate': return '#ffc107'; // yellow
      case 'long':     return '#ff9800'; // orange
      case 'deep':     return '#f44336'; // red
      default:         return '#4caf50';
    }
  }

  /**
   * Get a human-readable label for a reading level.
   *
   * @param {'quick' | 'moderate' | 'long' | 'deep'} level
   * @returns {string} Label text
   */
  function getReadingLevelLabel(level) {
    switch (level) {
      case 'quick':    return 'Quick read';
      case 'moderate': return 'Moderate read';
      case 'long':     return 'Long read';
      case 'deep':     return 'Deep read';
      default:         return 'Quick read';
    }
  }

  // -------------------------------------------------------
  // Page type detection
  // -------------------------------------------------------

  /**
   * Check if the current page is likely an article (not a home page,
   * search results, dashboard, etc.).
   *
   * @param {Document} doc - The document to check
   * @returns {boolean}
   */
  function isArticlePage(doc) {
    if (!doc || !doc.body) {
      return false;
    }

    var url = (doc.location && doc.location.href) || '';

    // Skip common non-article patterns
    var skipPatterns = [
      /^https?:\/\/[^/]+\/?$/, // Home pages (just domain)
      /\/search\?/,            // Search results
      /\/search\//,
      /\/login/i,
      /\/signup/i,
      /\/register/i,
      /\/cart/i,
      /\/checkout/i,
      /\/dashboard/i,
      /\/settings/i,
      /\/account/i,
      /\/admin/i,
      /\/feed\/?$/i
    ];

    for (var i = 0; i < skipPatterns.length; i++) {
      if (skipPatterns[i].test(url)) {
        return false;
      }
    }

    return true;
  }

  // -------------------------------------------------------
  // Number formatting helpers
  // -------------------------------------------------------

  /**
   * Format a number with commas for display.
   *
   * @param {number} num - The number to format
   * @returns {string} Formatted number
   */
  function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return num.toLocaleString('en-US');
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  return {
    // Constants
    DEFAULT_WPM: DEFAULT_WPM,
    DEFAULT_RATE: DEFAULT_RATE,
    CURRENCY_SYMBOLS: CURRENCY_SYMBOLS,
    CURRENCY_DECIMALS: CURRENCY_DECIMALS,
    DEFAULTS: DEFAULTS,
    WPM_PRESETS: WPM_PRESETS,
    ARTICLE_SELECTORS: ARTICLE_SELECTORS,
    STRIP_SELECTORS: STRIP_SELECTORS,

    // Functions
    countWords: countWords,
    estimateReadingTime: estimateReadingTime,
    calculateReadingCost: calculateReadingCost,
    formatTime: formatTime,
    formatCost: formatCost,
    extractArticleText: extractArticleText,
    cleanElementText: cleanElementText,
    findLargestTextBlock: findLargestTextBlock,
    getReadingLevel: getReadingLevel,
    getReadingLevelColor: getReadingLevelColor,
    getReadingLevelLabel: getReadingLevelLabel,
    isArticlePage: isArticlePage,
    formatNumber: formatNumber
  };
})();
