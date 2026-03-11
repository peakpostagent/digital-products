// converter.test.js — Comprehensive tests for Pay Decoder converter
// Uses Vitest with jsdom environment

import { describe, it, expect, beforeEach } from 'vitest';

// Load the converter module (it uses module.exports for Node compatibility)
const PayDecoder = require('../src/lib/converter.js');

// ============================================================
// parseSalary() Tests
// ============================================================
describe('parseSalary', () => {

  // ---- Basic formats ----
  describe('basic salary formats', () => {
    it('should parse "$80,000"', () => {
      const result = PayDecoder.parseSalary('$80,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(80000);
      expect(result.period).toBe('annual');
      expect(result.currency).toBe('USD');
    });

    it('should parse "$80000" (no commas)', () => {
      const result = PayDecoder.parseSalary('$80000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.period).toBe('annual');
    });

    it('should parse "$80k"', () => {
      const result = PayDecoder.parseSalary('$80k');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(80000);
      expect(result.period).toBe('annual');
    });

    it('should parse "$80K" (uppercase K)', () => {
      const result = PayDecoder.parseSalary('$80K');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
    });

    it('should parse "$80K/year"', () => {
      const result = PayDecoder.parseSalary('$80K/year');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.period).toBe('annual');
    });

    it('should parse "$120,500"', () => {
      const result = PayDecoder.parseSalary('$120,500');
      expect(result).not.toBeNull();
      expect(result.min).toBe(120500);
      expect(result.period).toBe('annual');
    });
  });

  // ---- Hourly formats ----
  describe('hourly salary formats', () => {
    it('should parse "$40/hr"', () => {
      const result = PayDecoder.parseSalary('$40/hr');
      expect(result).not.toBeNull();
      expect(result.min).toBe(40);
      expect(result.max).toBe(40);
      expect(result.period).toBe('hourly');
    });

    it('should parse "$40 per hour"', () => {
      const result = PayDecoder.parseSalary('$40 per hour');
      expect(result).not.toBeNull();
      expect(result.min).toBe(40);
      expect(result.period).toBe('hourly');
    });

    it('should parse "$25.50/hour"', () => {
      const result = PayDecoder.parseSalary('$25.50/hour');
      expect(result).not.toBeNull();
      expect(result.min).toBe(25.50);
      expect(result.period).toBe('hourly');
    });

    it('should parse "$55/hr" as hourly', () => {
      const result = PayDecoder.parseSalary('$55/hr');
      expect(result).not.toBeNull();
      expect(result.min).toBe(55);
      expect(result.period).toBe('hourly');
    });
  });

  // ---- Range formats ----
  describe('salary range formats', () => {
    it('should parse "$80,000 - $100,000"', () => {
      const result = PayDecoder.parseSalary('$80,000 - $100,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(100000);
      expect(result.period).toBe('annual');
    });

    it('should parse "$80k - $120k"', () => {
      const result = PayDecoder.parseSalary('$80k - $120k');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(120000);
      expect(result.period).toBe('annual');
    });

    it('should parse "$80K-$120K" (no spaces)', () => {
      const result = PayDecoder.parseSalary('$80K-$120K');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(120000);
    });

    it('should parse "$80,000-$120,000/year"', () => {
      const result = PayDecoder.parseSalary('$80,000-$120,000/year');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(120000);
      expect(result.period).toBe('annual');
    });

    it('should parse "$45-$55/hour"', () => {
      const result = PayDecoder.parseSalary('$45-$55/hour');
      expect(result).not.toBeNull();
      expect(result.min).toBe(45);
      expect(result.max).toBe(55);
      expect(result.period).toBe('hourly');
    });

    it('should parse "$45 - $55 per hour"', () => {
      const result = PayDecoder.parseSalary('$45 - $55 per hour');
      expect(result).not.toBeNull();
      expect(result.min).toBe(45);
      expect(result.max).toBe(55);
      expect(result.period).toBe('hourly');
    });

    it('should parse range with en dash "$80k\u2013$120k"', () => {
      const result = PayDecoder.parseSalary('$80k\u2013$120k');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(120000);
    });

    it('should parse range with em dash "$80k\u2014$120k"', () => {
      const result = PayDecoder.parseSalary('$80k\u2014$120k');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.max).toBe(120000);
    });
  });

  // ---- Currency formats ----
  describe('different currencies', () => {
    it('should parse "80,000 USD"', () => {
      const result = PayDecoder.parseSalary('80,000 USD');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
      expect(result.currency).toBe('USD');
    });

    it('should parse "\u00A360,000" (GBP)', () => {
      const result = PayDecoder.parseSalary('\u00A360,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(60000);
      expect(result.currency).toBe('GBP');
    });

    it('should parse "\u20AC55,000" (EUR)', () => {
      const result = PayDecoder.parseSalary('\u20AC55,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(55000);
      expect(result.currency).toBe('EUR');
    });

    it('should parse "CA$90,000" (CAD)', () => {
      const result = PayDecoder.parseSalary('CA$90,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(90000);
      expect(result.currency).toBe('CAD');
    });

    it('should parse "C$85,000" (CAD alternate)', () => {
      const result = PayDecoder.parseSalary('C$85,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(85000);
      expect(result.currency).toBe('CAD');
    });

    it('should parse "A$75,000" (AUD)', () => {
      const result = PayDecoder.parseSalary('A$75,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(75000);
      expect(result.currency).toBe('AUD');
    });

    it('should parse "\u00A55,000,000" (JPY)', () => {
      const result = PayDecoder.parseSalary('\u00A55,000,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(5000000);
      expect(result.currency).toBe('JPY');
    });

    it('should parse "\u20B91,200,000" (INR)', () => {
      const result = PayDecoder.parseSalary('\u20B91,200,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(1200000);
      expect(result.currency).toBe('INR');
    });
  });

  // ---- Period detection ----
  describe('period detection', () => {
    it('should detect annual from "/year"', () => {
      const result = PayDecoder.parseSalary('$80,000/year');
      expect(result.period).toBe('annual');
    });

    it('should detect annual from "annually"', () => {
      const result = PayDecoder.parseSalary('$80,000 annually');
      expect(result.period).toBe('annual');
    });

    it('should detect hourly from "/hr"', () => {
      const result = PayDecoder.parseSalary('$40/hr');
      expect(result.period).toBe('hourly');
    });

    it('should detect hourly from "per hour"', () => {
      const result = PayDecoder.parseSalary('$40 per hour');
      expect(result.period).toBe('hourly');
    });

    it('should detect monthly from "/month"', () => {
      const result = PayDecoder.parseSalary('$6,500/month');
      expect(result.period).toBe('monthly');
    });

    it('should detect weekly from "/week"', () => {
      const result = PayDecoder.parseSalary('$1,500/week');
      expect(result.period).toBe('weekly');
    });

    it('should detect daily from "/day"', () => {
      const result = PayDecoder.parseSalary('$300/day');
      expect(result.period).toBe('daily');
    });

    it('should infer annual for large amounts with no period', () => {
      const result = PayDecoder.parseSalary('$80,000');
      expect(result.period).toBe('annual');
    });

    it('should infer hourly for small amounts with no period', () => {
      const result = PayDecoder.parseSalary('$40');
      expect(result.period).toBe('hourly');
    });
  });

  // ---- Edge cases ----
  describe('edge cases', () => {
    it('should return null for empty string', () => {
      expect(PayDecoder.parseSalary('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(PayDecoder.parseSalary(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(PayDecoder.parseSalary(undefined)).toBeNull();
    });

    it('should return null for text with no salary', () => {
      expect(PayDecoder.parseSalary('Software Engineer at Google')).toBeNull();
    });

    it('should return null for non-string input', () => {
      expect(PayDecoder.parseSalary(12345)).toBeNull();
    });

    it('should handle extra whitespace', () => {
      const result = PayDecoder.parseSalary('  $80,000   /year  ');
      expect(result).not.toBeNull();
      expect(result.min).toBe(80000);
    });

    it('should parse very large salaries', () => {
      const result = PayDecoder.parseSalary('$1,000,000');
      expect(result).not.toBeNull();
      expect(result.min).toBe(1000000);
    });

    it('should parse decimal amounts', () => {
      const result = PayDecoder.parseSalary('$45.75/hr');
      expect(result).not.toBeNull();
      expect(result.min).toBe(45.75);
    });
  });
});

// ============================================================
// convertSalary() Tests
// ============================================================
describe('convertSalary', () => {
  const defaultSettings = { hoursPerWeek: 40, weeksPerYear: 52 };

  describe('annual to other periods', () => {
    it('should convert $80,000/year to all periods', () => {
      const parsed = { min: 80000, max: 80000, period: 'annual', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      expect(result).not.toBeNull();
      expect(result.annual.min).toBe(80000);
      expect(result.annual.max).toBe(80000);

      // Hourly: 80000 / (40 * 52) = 80000 / 2080 = 38.46
      expect(result.hourly.min).toBeCloseTo(38.46, 1);

      // Monthly: 80000 / 12 = 6666.67
      expect(result.monthly.min).toBeCloseTo(6666.67, 1);

      // Weekly: 80000 / 52 = 1538.46
      expect(result.weekly.min).toBeCloseTo(1538.46, 1);

      // Biweekly: 80000 / 26 = 3076.92
      expect(result.biweekly.min).toBeCloseTo(3076.92, 1);

      // Daily: 80000 / (52 * 5) = 80000 / 260 = 307.69
      expect(result.daily.min).toBeCloseTo(307.69, 1);
    });
  });

  describe('hourly to other periods', () => {
    it('should convert $40/hr to annual', () => {
      const parsed = { min: 40, max: 40, period: 'hourly', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      // Annual: 40 * 40 * 52 = 83,200
      expect(result.annual.min).toBe(83200);
      expect(result.hourly.min).toBe(40);
    });

    it('should convert $25/hr to monthly', () => {
      const parsed = { min: 25, max: 25, period: 'hourly', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      // Monthly: 25 * 40 * 52 / 12 = 52000 / 12 = 4333.33
      expect(result.monthly.min).toBeCloseTo(4333.33, 1);
    });
  });

  describe('range conversions', () => {
    it('should convert salary ranges correctly', () => {
      const parsed = { min: 80000, max: 120000, period: 'annual', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      expect(result.annual.min).toBe(80000);
      expect(result.annual.max).toBe(120000);
      expect(result.hourly.min).toBeCloseTo(38.46, 1);
      expect(result.hourly.max).toBeCloseTo(57.69, 1);
    });

    it('should convert hourly ranges to annual', () => {
      const parsed = { min: 45, max: 55, period: 'hourly', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      expect(result.annual.min).toBe(93600);
      expect(result.annual.max).toBe(114400);
    });
  });

  describe('custom settings', () => {
    it('should use custom hours per week', () => {
      const parsed = { min: 80000, max: 80000, period: 'annual', currency: 'USD' };
      const customSettings = { hoursPerWeek: 35, weeksPerYear: 52 };
      const result = PayDecoder.convertSalary(parsed, customSettings);

      // Hourly: 80000 / (35 * 52) = 80000 / 1820 = 43.96
      expect(result.hourly.min).toBeCloseTo(43.96, 1);
    });

    it('should use custom weeks per year', () => {
      const parsed = { min: 80000, max: 80000, period: 'annual', currency: 'USD' };
      const customSettings = { hoursPerWeek: 40, weeksPerYear: 48 };
      const result = PayDecoder.convertSalary(parsed, customSettings);

      // Hourly: 80000 / (40 * 48) = 80000 / 1920 = 41.67
      expect(result.hourly.min).toBeCloseTo(41.67, 1);

      // Weekly: 80000 / 48 = 1666.67
      expect(result.weekly.min).toBeCloseTo(1666.67, 1);
    });

    it('should fall back to defaults when settings missing', () => {
      const parsed = { min: 80000, max: 80000, period: 'annual', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, {});

      // Should use 40 hours, 52 weeks
      expect(result.hourly.min).toBeCloseTo(38.46, 1);
    });

    it('should fall back to defaults when settings null', () => {
      const parsed = { min: 80000, max: 80000, period: 'annual', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, null);

      expect(result.hourly.min).toBeCloseTo(38.46, 1);
    });
  });

  describe('all period conversions', () => {
    it('should convert monthly to all periods', () => {
      const parsed = { min: 6000, max: 6000, period: 'monthly', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      // Annual: 6000 * 12 = 72,000
      expect(result.annual.min).toBe(72000);
      // Hourly: 72000 / 2080 = 34.62
      expect(result.hourly.min).toBeCloseTo(34.62, 1);
    });

    it('should convert weekly to all periods', () => {
      const parsed = { min: 1500, max: 1500, period: 'weekly', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      // Annual: 1500 * 52 = 78,000
      expect(result.annual.min).toBe(78000);
      // Hourly: 78000 / 2080 = 37.50
      expect(result.hourly.min).toBe(37.5);
    });

    it('should convert biweekly to all periods', () => {
      const parsed = { min: 3000, max: 3000, period: 'biweekly', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      // Annual: 3000 * 26 = 78,000
      expect(result.annual.min).toBe(78000);
    });

    it('should convert daily to all periods', () => {
      const parsed = { min: 300, max: 300, period: 'daily', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);

      // Annual: 300 * 52 * 5 = 78,000
      expect(result.annual.min).toBe(78000);
      // Hourly: 78000 / 2080 = 37.50
      expect(result.hourly.min).toBe(37.5);
    });
  });

  describe('edge cases', () => {
    it('should return null for null input', () => {
      expect(PayDecoder.convertSalary(null, defaultSettings)).toBeNull();
    });

    it('should preserve currency in output', () => {
      const parsed = { min: 60000, max: 60000, period: 'annual', currency: 'GBP' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);
      expect(result.currency).toBe('GBP');
    });

    it('should preserve originalPeriod in output', () => {
      const parsed = { min: 40, max: 40, period: 'hourly', currency: 'USD' };
      const result = PayDecoder.convertSalary(parsed, defaultSettings);
      expect(result.originalPeriod).toBe('hourly');
    });
  });
});

// ============================================================
// formatCurrency() Tests
// ============================================================
describe('formatCurrency', () => {
  it('should format USD amounts correctly', () => {
    expect(PayDecoder.formatCurrency(80000, 'USD')).toBe('$80,000');
  });

  it('should format small USD amounts with decimals', () => {
    expect(PayDecoder.formatCurrency(38.46, 'USD')).toBe('$38.46');
  });

  it('should format GBP amounts', () => {
    expect(PayDecoder.formatCurrency(60000, 'GBP')).toBe('\u00A360,000');
  });

  it('should format EUR amounts', () => {
    expect(PayDecoder.formatCurrency(55000, 'EUR')).toBe('\u20AC55,000');
  });

  it('should format CAD amounts', () => {
    expect(PayDecoder.formatCurrency(90000, 'CAD')).toBe('C$90,000');
  });

  it('should format AUD amounts', () => {
    expect(PayDecoder.formatCurrency(75000, 'AUD')).toBe('A$75,000');
  });

  it('should format JPY amounts (no decimals)', () => {
    const formatted = PayDecoder.formatCurrency(5000000, 'JPY');
    expect(formatted).toContain('\u00A5');
    expect(formatted).toContain('5,000,000');
  });

  it('should format INR amounts', () => {
    const formatted = PayDecoder.formatCurrency(1200000, 'INR');
    expect(formatted).toContain('\u20B9');
  });

  it('should default to $ for unknown currency', () => {
    expect(PayDecoder.formatCurrency(100, 'XYZ')).toBe('$100.00');
  });

  it('should default to USD when no currency provided', () => {
    expect(PayDecoder.formatCurrency(100)).toBe('$100.00');
  });
});

// ============================================================
// formatRange() Tests
// ============================================================
describe('formatRange', () => {
  it('should format a single value (min === max)', () => {
    const result = PayDecoder.formatRange(80000, 80000, 'USD');
    expect(result).toBe('$80,000');
  });

  it('should format a range (min !== max)', () => {
    const result = PayDecoder.formatRange(80000, 120000, 'USD');
    expect(result).toBe('$80,000 - $120,000');
  });

  it('should format small value ranges', () => {
    const result = PayDecoder.formatRange(38.46, 57.69, 'USD');
    expect(result).toBe('$38.46 - $57.69');
  });
});

// ============================================================
// Helper function tests
// ============================================================
describe('helper functions', () => {
  describe('detectCurrency', () => {
    it('should detect USD from $', () => {
      expect(PayDecoder.detectCurrency('$80,000')).toBe('USD');
    });

    it('should detect GBP from pound sign', () => {
      expect(PayDecoder.detectCurrency('\u00A360,000')).toBe('GBP');
    });

    it('should detect EUR from euro sign', () => {
      expect(PayDecoder.detectCurrency('\u20AC55,000')).toBe('EUR');
    });

    it('should detect CAD from CA$', () => {
      expect(PayDecoder.detectCurrency('CA$90,000')).toBe('CAD');
    });

    it('should detect CAD from C$', () => {
      expect(PayDecoder.detectCurrency('C$85,000')).toBe('CAD');
    });

    it('should detect AUD from A$', () => {
      expect(PayDecoder.detectCurrency('A$75,000')).toBe('AUD');
    });

    it('should detect currency from suffix "USD"', () => {
      expect(PayDecoder.detectCurrency('80,000 USD')).toBe('USD');
    });

    it('should default to USD when no currency found', () => {
      expect(PayDecoder.detectCurrency('some random text')).toBe('USD');
    });
  });

  describe('detectPeriod', () => {
    it('should detect hourly from /hr', () => {
      expect(PayDecoder.detectPeriod('$40/hr')).toBe('hourly');
    });

    it('should detect hourly from "per hour"', () => {
      expect(PayDecoder.detectPeriod('$40 per hour')).toBe('hourly');
    });

    it('should detect annual from /year', () => {
      expect(PayDecoder.detectPeriod('$80,000/year')).toBe('annual');
    });

    it('should detect monthly from /month', () => {
      expect(PayDecoder.detectPeriod('$6,500/month')).toBe('monthly');
    });

    it('should detect weekly from /week', () => {
      expect(PayDecoder.detectPeriod('$1,500/week')).toBe('weekly');
    });

    it('should detect daily from /day', () => {
      expect(PayDecoder.detectPeriod('$300/day')).toBe('daily');
    });

    it('should return null when no period indicator found', () => {
      expect(PayDecoder.detectPeriod('$80,000')).toBeNull();
    });
  });

  describe('inferPeriod', () => {
    it('should infer hourly for amounts under 500', () => {
      expect(PayDecoder.inferPeriod(40)).toBe('hourly');
      expect(PayDecoder.inferPeriod(100)).toBe('hourly');
      expect(PayDecoder.inferPeriod(499)).toBe('hourly');
    });

    it('should infer annual for amounts 500 and above', () => {
      expect(PayDecoder.inferPeriod(500)).toBe('annual');
      expect(PayDecoder.inferPeriod(80000)).toBe('annual');
    });

    it('should return annual for zero or negative', () => {
      expect(PayDecoder.inferPeriod(0)).toBe('annual');
      expect(PayDecoder.inferPeriod(-10)).toBe('annual');
    });
  });

  describe('round', () => {
    it('should round to 2 decimal places', () => {
      expect(PayDecoder.round(38.461538)).toBe(38.46);
      expect(PayDecoder.round(100)).toBe(100);
      expect(PayDecoder.round(3.456)).toBe(3.46);
    });
  });
});

// ============================================================
// Integration / End-to-end parsing + conversion tests
// ============================================================
describe('end-to-end: parse then convert', () => {
  const settings = { hoursPerWeek: 40, weeksPerYear: 52 };

  it('should parse and convert "$80,000" to hourly', () => {
    const parsed = PayDecoder.parseSalary('$80,000');
    const converted = PayDecoder.convertSalary(parsed, settings);
    expect(converted.hourly.min).toBeCloseTo(38.46, 1);
  });

  it('should parse and convert "$40/hr" to annual', () => {
    const parsed = PayDecoder.parseSalary('$40/hr');
    const converted = PayDecoder.convertSalary(parsed, settings);
    expect(converted.annual.min).toBe(83200);
  });

  it('should parse and convert "$80k - $120k" range', () => {
    const parsed = PayDecoder.parseSalary('$80k - $120k');
    const converted = PayDecoder.convertSalary(parsed, settings);
    expect(converted.hourly.min).toBeCloseTo(38.46, 1);
    expect(converted.hourly.max).toBeCloseTo(57.69, 1);
    expect(converted.monthly.min).toBeCloseTo(6666.67, 1);
    expect(converted.monthly.max).toBe(10000);
  });

  it('should parse and convert "\u00A360,000" (GBP)', () => {
    const parsed = PayDecoder.parseSalary('\u00A360,000');
    const converted = PayDecoder.convertSalary(parsed, settings);
    expect(converted.currency).toBe('GBP');
    expect(converted.hourly.min).toBeCloseTo(28.85, 1);
  });

  it('should parse and convert "$6,500/month" to annual', () => {
    const parsed = PayDecoder.parseSalary('$6,500/month');
    const converted = PayDecoder.convertSalary(parsed, settings);
    expect(converted.annual.min).toBe(78000);
    expect(converted.hourly.min).toBeCloseTo(37.5, 1);
  });

  it('should parse and convert "$1,500/week" to annual', () => {
    const parsed = PayDecoder.parseSalary('$1,500/week');
    const converted = PayDecoder.convertSalary(parsed, settings);
    expect(converted.annual.min).toBe(78000);
  });

  it('should handle custom work schedule (35 hrs, 48 weeks)', () => {
    const parsed = PayDecoder.parseSalary('$80,000/year');
    const converted = PayDecoder.convertSalary(parsed, { hoursPerWeek: 35, weeksPerYear: 48 });

    // Hourly: 80000 / (35 * 48) = 80000 / 1680 = 47.62
    expect(converted.hourly.min).toBeCloseTo(47.62, 1);

    // Weekly: 80000 / 48 = 1666.67
    expect(converted.weekly.min).toBeCloseTo(1666.67, 1);
  });
});
