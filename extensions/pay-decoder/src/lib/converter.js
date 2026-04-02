// converter.js — Core salary conversion engine for Pay Decoder
// Loaded as a content script (no ES module imports).
// Functions are attached to a global PayDecoder namespace.

const PayDecoder = (() => {
  /**
   * Default settings for new users
   */
  const DEFAULTS = {
    hoursPerWeek: 40,
    weeksPerYear: 52,
    currency: 'USD',
    showConversions: true
  };

  /**
   * Currency symbols for display
   */
  const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '\u00A5',
    INR: '\u20B9'
  };

  // ---- Parsing Functions ----

  /**
   * Parse a salary string and extract structured data.
   * Handles formats like:
   *   "$80,000"  "$80k"  "$80K/year"  "$80,000 - $100,000"
   *   "$40/hr"  "$40 per hour"  "80,000 USD"  "£60,000"
   *   "€55,000"  "CA$90,000"  "$80k - $120k"
   *
   * @param {string} text - Raw text that may contain a salary
   * @returns {{ min: number, max: number, period: string, currency: string } | null}
   *   period is one of: 'annual', 'hourly', 'monthly', 'weekly', 'biweekly', 'daily'
   *   Returns null if no salary is detected.
   */
  function parseSalary(text) {
    if (!text || typeof text !== 'string') return null;

    // Clean up the text — normalize whitespace
    const clean = text.trim().replace(/\s+/g, ' ');

    // Try to detect the currency from the text
    const currency = detectCurrency(clean);

    // Try range format first (e.g., "$80k - $120k" or "$80,000-$120,000/year")
    const rangeResult = parseRange(clean, currency);
    if (rangeResult) return rangeResult;

    // Try single salary format (e.g., "$80,000" or "$40/hr")
    const singleResult = parseSingle(clean, currency);
    if (singleResult) return singleResult;

    return null;
  }

  /**
   * Detect currency from text string.
   * Checks for currency symbols and codes.
   *
   * @param {string} text - Text to scan for currency indicators
   * @returns {string} Currency code (defaults to 'USD')
   */
  function detectCurrency(text) {
    if (!text) return 'USD';

    // Check for multi-char prefixes first (CA$, A$, AU$, C$)
    if (text.includes('CA$') || text.includes('C$')) return 'CAD';
    if (text.includes('AU$') || text.includes('A$')) return 'AUD';

    // Check for single-char symbols
    if (text.includes('\u00A3')) return 'GBP';
    if (text.includes('\u20AC')) return 'EUR';
    if (text.includes('\u00A5')) return 'JPY';
    if (text.includes('\u20B9')) return 'INR';

    // Check for currency codes as words (e.g., "80,000 USD")
    const codeMatch = text.match(/\b(USD|EUR|GBP|CAD|AUD|JPY|INR)\b/i);
    if (codeMatch) return codeMatch[1].toUpperCase();

    // Default to USD if $ is present or no currency found
    return 'USD';
  }

  /**
   * Detect the pay period from text.
   * Looks for keywords like "/hr", "per hour", "/year", "annual", etc.
   *
   * @param {string} text - Text to scan for period indicators
   * @returns {string} Period: 'hourly', 'annual', 'monthly', 'weekly', 'biweekly', 'daily'
   */
  function detectPeriod(text) {
    if (!text) return 'annual';

    const lower = text.toLowerCase();

    // Hourly indicators
    if (/\/(hr|hour)|per\s*hour|hourly|\bhour\b/i.test(lower)) return 'hourly';

    // Weekly indicators
    if (/\/wk|\/week|per\s*week|weekly|\bweek\b/i.test(lower)) return 'weekly';

    // Biweekly indicators
    if (/bi[\s-]?weekly|every\s*two\s*weeks|bi[\s-]?week/i.test(lower)) return 'biweekly';

    // Monthly indicators
    if (/\/mo|\/month|per\s*month|monthly|\bmonth\b/i.test(lower)) return 'monthly';

    // Daily indicators
    if (/\/day|per\s*day|daily|\bday\b/i.test(lower)) return 'daily';

    // Annual indicators (explicit)
    if (/\/yr|\/year|per\s*year|annual|annually|\byear\b/i.test(lower)) return 'annual';

    // Default: if no period indicator, infer from the number magnitude
    return null; // Let the caller decide based on the amount
  }

  /**
   * Infer the pay period from a dollar amount when no explicit period is given.
   * Heuristic: amounts under $500 are likely hourly, above are likely annual.
   *
   * @param {number} amount - The parsed salary amount
   * @returns {string} Inferred period
   */
  function inferPeriod(amount) {
    if (amount <= 0) return 'annual';
    if (amount < 500) return 'hourly';
    return 'annual';
  }

  /**
   * Parse a single number from salary text (not a range).
   * Handles "$80,000", "$80k", "80,000 USD", etc.
   *
   * @param {string} text - Cleaned text
   * @param {string} currency - Detected currency code
   * @returns {{ min: number, max: number, period: string, currency: string } | null}
   */
  function parseSingle(text, currency) {
    // Match a salary number with optional currency symbol prefix
    // Captures: optional symbol, number (with commas/decimals), optional "k"/"K"
    const pattern = /(?:CA?\$|AU?\$|\$|[\u00A3\u20AC\u00A5\u20B9])\s*(\d[\d,]*\.?\d*)\s*(k|K)?|(\d[\d,]*\.?\d*)\s*(k|K)?\s*(?:USD|EUR|GBP|CAD|AUD|JPY|INR)?/;

    const match = text.match(pattern);
    if (!match) return null;

    // Get the number from whichever capture group matched
    let numStr = match[1] || match[3];
    let multiplier = match[2] || match[4];

    if (!numStr) return null;

    // Parse the number — remove commas
    let amount = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) return null;

    // Apply "k" multiplier (80k = 80,000)
    if (multiplier && multiplier.toLowerCase() === 'k') {
      amount *= 1000;
    }

    // Detect the pay period
    let period = detectPeriod(text);
    if (!period) {
      period = inferPeriod(amount);
    }

    return {
      min: amount,
      max: amount,
      period: period,
      currency: currency
    };
  }

  /**
   * Parse a salary range like "$80k - $120k" or "$80,000-$100,000/year".
   *
   * @param {string} text - Cleaned text
   * @param {string} currency - Detected currency code
   * @returns {{ min: number, max: number, period: string, currency: string } | null}
   */
  function parseRange(text, currency) {
    // Match range patterns with various separators: -, –, —, to
    // Each side can have its own currency symbol
    const rangePattern = /(?:CA?\$|AU?\$|\$|[\u00A3\u20AC\u00A5\u20B9])?\s*(\d[\d,]*\.?\d*)\s*(k|K)?\s*[-\u2013\u2014]+\s*(?:CA?\$|AU?\$|\$|[\u00A3\u20AC\u00A5\u20B9])?\s*(\d[\d,]*\.?\d*)\s*(k|K)?/;

    const match = text.match(rangePattern);
    if (!match) return null;

    let minStr = match[1];
    let minK = match[2];
    let maxStr = match[3];
    let maxK = match[4];

    if (!minStr || !maxStr) return null;

    // Parse the numbers — remove commas
    let minAmount = parseFloat(minStr.replace(/,/g, ''));
    let maxAmount = parseFloat(maxStr.replace(/,/g, ''));

    if (isNaN(minAmount) || isNaN(maxAmount)) return null;
    if (minAmount <= 0 || maxAmount <= 0) return null;

    // Apply "k" multiplier
    if (minK && minK.toLowerCase() === 'k') minAmount *= 1000;
    if (maxK && maxK.toLowerCase() === 'k') maxAmount *= 1000;

    // Ensure min <= max
    if (minAmount > maxAmount) {
      const temp = minAmount;
      minAmount = maxAmount;
      maxAmount = temp;
    }

    // Detect the pay period
    let period = detectPeriod(text);
    if (!period) {
      period = inferPeriod(minAmount);
    }

    return {
      min: minAmount,
      max: maxAmount,
      period: period,
      currency: currency
    };
  }

  // ---- Conversion Functions ----

  /**
   * Convert a parsed salary to all pay periods.
   * Uses settings for hours/week and weeks/year.
   *
   * @param {{ min: number, max: number, period: string, currency: string }} parsed
   *   Output from parseSalary()
   * @param {{ hoursPerWeek: number, weeksPerYear: number }} settings
   *   User's work schedule settings
   * @returns {{
   *   hourly:   { min: number, max: number },
   *   daily:    { min: number, max: number },
   *   weekly:   { min: number, max: number },
   *   biweekly: { min: number, max: number },
   *   monthly:  { min: number, max: number },
   *   annual:   { min: number, max: number },
   *   originalPeriod: string,
   *   currency: string
   * }}
   */
  function convertSalary(parsed, settings) {
    if (!parsed) return null;

    const hoursPerWeek = (settings && settings.hoursPerWeek) || DEFAULTS.hoursPerWeek;
    const weeksPerYear = (settings && settings.weeksPerYear) || DEFAULTS.weeksPerYear;

    // Derived constants
    const hoursPerYear = hoursPerWeek * weeksPerYear;
    const workDaysPerWeek = 5; // Standard work week
    const hoursPerDay = hoursPerWeek / workDaysPerWeek;
    const monthsPerYear = 12;

    // Step 1: Convert to annual (our base unit)
    const minAnnual = toAnnual(parsed.min, parsed.period, hoursPerYear, weeksPerYear, monthsPerYear, workDaysPerWeek, hoursPerWeek);
    const maxAnnual = toAnnual(parsed.max, parsed.period, hoursPerYear, weeksPerYear, monthsPerYear, workDaysPerWeek, hoursPerWeek);

    // Step 2: Derive all periods from annual
    return {
      hourly: {
        min: round(minAnnual / hoursPerYear),
        max: round(maxAnnual / hoursPerYear)
      },
      daily: {
        min: round(minAnnual / (weeksPerYear * workDaysPerWeek)),
        max: round(maxAnnual / (weeksPerYear * workDaysPerWeek))
      },
      weekly: {
        min: round(minAnnual / weeksPerYear),
        max: round(maxAnnual / weeksPerYear)
      },
      biweekly: {
        min: round(minAnnual / (weeksPerYear / 2)),
        max: round(maxAnnual / (weeksPerYear / 2))
      },
      monthly: {
        min: round(minAnnual / monthsPerYear),
        max: round(maxAnnual / monthsPerYear)
      },
      annual: {
        min: round(minAnnual),
        max: round(maxAnnual)
      },
      originalPeriod: parsed.period,
      currency: parsed.currency
    };
  }

  /**
   * Convert an amount from a given period to annual.
   *
   * @param {number} amount - The salary amount
   * @param {string} period - The current pay period
   * @param {number} hoursPerYear - Total working hours per year
   * @param {number} weeksPerYear - Total working weeks per year
   * @param {number} monthsPerYear - Always 12
   * @param {number} workDaysPerWeek - Typically 5
   * @param {number} hoursPerWeek - Hours per week from settings
   * @returns {number} Annual equivalent
   */
  function toAnnual(amount, period, hoursPerYear, weeksPerYear, monthsPerYear, workDaysPerWeek, hoursPerWeek) {
    switch (period) {
      case 'hourly':
        return amount * hoursPerYear;
      case 'daily':
        return amount * weeksPerYear * workDaysPerWeek;
      case 'weekly':
        return amount * weeksPerYear;
      case 'biweekly':
        return amount * (weeksPerYear / 2);
      case 'monthly':
        return amount * monthsPerYear;
      case 'annual':
      default:
        return amount;
    }
  }

  /**
   * Round a number to 2 decimal places.
   *
   * @param {number} n - Number to round
   * @returns {number}
   */
  function round(n) {
    return Math.round(n * 100) / 100;
  }

  // ---- Formatting Functions ----

  /**
   * Format a currency amount with proper symbol and locale.
   * Supports USD, EUR, GBP, CAD, AUD, JPY, INR.
   *
   * @param {number} amount - The amount to format
   * @param {string} currency - Currency code (e.g., 'USD')
   * @returns {string} Formatted string like "$80,000" or "£60,000"
   */
  function formatCurrency(amount, currency) {
    const curr = currency || 'USD';
    const symbol = CURRENCY_SYMBOLS[curr] || '$';

    // JPY and INR typically don't use decimals for large amounts
    const useDecimals = (curr !== 'JPY');

    if (amount >= 1000) {
      // Use locale formatting for large numbers
      const options = useDecimals
        ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 0 };

      return symbol + amount.toLocaleString('en-US', options);
    }

    // For smaller amounts (like hourly rates), show decimals
    if (useDecimals) {
      return symbol + amount.toFixed(2);
    }
    return symbol + Math.round(amount).toLocaleString('en-US');
  }

  /**
   * Format a salary range for display.
   * If min === max, shows single value. Otherwise shows "min - max".
   *
   * @param {number} min - Minimum amount
   * @param {number} max - Maximum amount
   * @param {string} currency - Currency code
   * @returns {string} Formatted range like "$80,000 - $120,000" or "$80,000"
   */
  function formatRange(min, max, currency) {
    if (min === max) {
      return formatCurrency(min, currency);
    }
    return formatCurrency(min, currency) + ' - ' + formatCurrency(max, currency);
  }

  // ---- DOM Detection Functions ----

  /**
   * Find DOM elements that contain salary text.
   * Scans the document for common salary patterns and returns
   * matching elements with their parsed salary data.
   *
   * @param {Document|Element} root - The DOM root to search
   * @returns {Array<{ element: Element, parsed: object, text: string }>}
   */
  function detectSalaryElements(root) {
    if (!root) return [];

    const results = [];
    const seen = new Set(); // Avoid processing duplicates

    // Broad salary pattern for initial text scanning
    // Matches: $80,000  $80k  £60,000  €55  CA$90,000  etc.
    const salaryPattern = /(?:CA?\$|AU?\$|\$|[\u00A3\u20AC\u00A5\u20B9])\s*\d[\d,]*\.?\d*\s*(?:k|K)?|\d[\d,]*\.?\d*\s*(?:k|K)?\s*(?:USD|EUR|GBP|CAD|AUD|JPY|INR)/;

    // Get all text-containing elements that are likely salary displays
    // Use a TreeWalker for efficient DOM traversal
    const walker = root.createTreeWalker
      ? root.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false)
      : null;

    if (!walker) return results;

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();

      // Skip empty or very long text (not a focused salary display)
      if (!text || text.length > 500 || text.length < 2) continue;

      // Quick check: does this text contain a salary pattern?
      if (!salaryPattern.test(text)) continue;

      // Get the parent element for this text node
      const element = node.parentElement;
      if (!element) continue;

      // Skip script/style elements
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') continue;

      // Skip if we already processed this element
      if (seen.has(element)) continue;

      // Try to parse the salary from this element's text
      const fullText = element.textContent.trim();
      if (fullText.length > 500) continue;

      const parsed = parseSalary(fullText);
      if (!parsed) continue;

      seen.add(element);
      results.push({
        element: element,
        parsed: parsed,
        text: fullText
      });
    }

    return results;
  }

  // ---- Public API ----
  return {
    DEFAULTS,
    CURRENCY_SYMBOLS,
    parseSalary,
    convertSalary,
    formatCurrency,
    formatRange,
    detectSalaryElements,
    detectCurrency,
    detectPeriod,
    inferPeriod,
    round
  };
})();

// Make available for testing (Node.js / Vitest environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PayDecoder;
}
