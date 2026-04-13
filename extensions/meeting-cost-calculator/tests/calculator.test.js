// calculator.test.js — Unit tests for Meeting Cost Calculator core logic
// Uses Vitest with jsdom environment

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load calculator.js in jsdom (it uses an IIFE with global namespace)
let MeetingCost;

beforeAll(() => {
  const code = readFileSync(
    resolve(__dirname, '../src/lib/calculator.js'),
    'utf-8'
  );
  // Execute in global scope to get the MeetingCost object
  const fn = new Function(code + '\nreturn MeetingCost;');
  MeetingCost = fn();
});

// =========================================================
// annualToHourly
// =========================================================
describe('annualToHourly', () => {
  it('converts $104,000/year to $50/hour', () => {
    expect(MeetingCost.annualToHourly(104000)).toBeCloseTo(50, 0);
  });

  it('converts $52,000/year to $25/hour', () => {
    expect(MeetingCost.annualToHourly(52000)).toBe(25);
  });

  it('returns 0 for zero salary', () => {
    expect(MeetingCost.annualToHourly(0)).toBe(0);
  });

  it('returns 0 for negative salary', () => {
    expect(MeetingCost.annualToHourly(-50000)).toBe(0);
  });

  it('returns 0 for null/undefined', () => {
    expect(MeetingCost.annualToHourly(null)).toBe(0);
    expect(MeetingCost.annualToHourly(undefined)).toBe(0);
  });
});

// =========================================================
// parseTime
// =========================================================
describe('parseTime', () => {
  it('parses "10:00am" to 600 minutes', () => {
    expect(MeetingCost.parseTime('10:00am')).toBe(600);
  });

  it('parses "2:30pm" to 870 minutes', () => {
    expect(MeetingCost.parseTime('2:30pm')).toBe(870);
  });

  it('parses "12:00pm" to 720 minutes (noon)', () => {
    expect(MeetingCost.parseTime('12:00pm')).toBe(720);
  });

  it('parses "12:00am" to 0 minutes (midnight)', () => {
    expect(MeetingCost.parseTime('12:00am')).toBe(0);
  });

  it('parses "9am" without minutes', () => {
    expect(MeetingCost.parseTime('9am')).toBe(540);
  });

  it('parses 24-hour format "14:00"', () => {
    expect(MeetingCost.parseTime('14:00')).toBe(840);
  });

  it('parses with spaces "2:30 PM"', () => {
    expect(MeetingCost.parseTime('2:30 PM')).toBe(870);
  });

  it('returns -1 for invalid input', () => {
    expect(MeetingCost.parseTime('')).toBe(-1);
    expect(MeetingCost.parseTime(null)).toBe(-1);
    expect(MeetingCost.parseTime('abc')).toBe(-1);
  });

  it('returns -1 for invalid hour in 12-hour format', () => {
    expect(MeetingCost.parseTime('13:00am')).toBe(-1);
    expect(MeetingCost.parseTime('0:00am')).toBe(-1);
  });
});

// =========================================================
// parseTimeRange
// =========================================================
describe('parseTimeRange', () => {
  it('parses "10:00am - 11:00am" as 60 minutes', () => {
    const result = MeetingCost.parseTimeRange('10:00am - 11:00am');
    expect(result).not.toBeNull();
    expect(result.durationMinutes).toBe(60);
    expect(result.startMinutes).toBe(600);
    expect(result.endMinutes).toBe(660);
  });

  it('parses "2:00pm \u2013 3:30pm" (en-dash) as 90 minutes', () => {
    const result = MeetingCost.parseTimeRange('2:00pm \u2013 3:30pm');
    expect(result).not.toBeNull();
    expect(result.durationMinutes).toBe(90);
  });

  it('parses time range with date prefix', () => {
    const result = MeetingCost.parseTimeRange('Monday, March 10 \u22C5 10:00am \u2013 11:30am');
    expect(result).not.toBeNull();
    expect(result.durationMinutes).toBe(90);
  });

  it('handles overnight meetings', () => {
    const result = MeetingCost.parseTimeRange('11:00pm - 1:00am');
    expect(result).not.toBeNull();
    expect(result.durationMinutes).toBe(120);
  });

  it('returns null for invalid input', () => {
    expect(MeetingCost.parseTimeRange('')).toBeNull();
    expect(MeetingCost.parseTimeRange(null)).toBeNull();
    expect(MeetingCost.parseTimeRange('no time here')).toBeNull();
  });

  it('parses short format "9am - 10am"', () => {
    const result = MeetingCost.parseTimeRange('9am - 10am');
    expect(result).not.toBeNull();
    expect(result.durationMinutes).toBe(60);
  });

  it('parses Google Calendar format "1:30 – 2:30pm" (am/pm only on end)', () => {
    const result = MeetingCost.parseTimeRange('1:30 \u2013 2:30pm');
    expect(result).not.toBeNull();
    expect(result.startMinutes).toBe(810); // 1:30pm = 13*60+30
    expect(result.endMinutes).toBe(870);   // 2:30pm = 14*60+30
    expect(result.durationMinutes).toBe(60);
  });

  it('parses Google Calendar format with date prefix', () => {
    const result = MeetingCost.parseTimeRange('Tuesday, March 10\u22C51:30 \u2013 2:30pm');
    expect(result).not.toBeNull();
    expect(result.durationMinutes).toBe(60);
    expect(result.startMinutes).toBe(810); // 1:30pm inherited from end
  });

  it('parses "10:00 – 11:30am" (am inherited from end)', () => {
    const result = MeetingCost.parseTimeRange('10:00 \u2013 11:30am');
    expect(result).not.toBeNull();
    expect(result.startMinutes).toBe(600); // 10:00am
    expect(result.endMinutes).toBe(690);   // 11:30am
    expect(result.durationMinutes).toBe(90);
  });
});

// =========================================================
// calculateCost
// =========================================================
describe('calculateCost', () => {
  it('calculates cost for 1 hour, 1 person, $50/hr = $50', () => {
    const result = MeetingCost.calculateCost({
      durationMinutes: 60,
      attendeeCount: 1,
      hourlyRate: 50
    });
    expect(result.totalCost).toBe(50);
    expect(result.costPerMinute).toBeCloseTo(0.83, 1);
    expect(result.costPerPerson).toBe(50);
  });

  it('calculates cost for 30 min, 5 people, $75/hr = $187.50', () => {
    const result = MeetingCost.calculateCost({
      durationMinutes: 30,
      attendeeCount: 5,
      hourlyRate: 75
    });
    expect(result.totalCost).toBe(187.5);
    expect(result.costPerPerson).toBe(37.5);
  });

  it('returns zero for zero duration', () => {
    const result = MeetingCost.calculateCost({
      durationMinutes: 0,
      attendeeCount: 5,
      hourlyRate: 50
    });
    expect(result.totalCost).toBe(0);
  });

  it('returns zero for zero attendees', () => {
    const result = MeetingCost.calculateCost({
      durationMinutes: 60,
      attendeeCount: 0,
      hourlyRate: 50
    });
    expect(result.totalCost).toBe(0);
  });

  it('returns zero for zero rate', () => {
    const result = MeetingCost.calculateCost({
      durationMinutes: 60,
      attendeeCount: 5,
      hourlyRate: 0
    });
    expect(result.totalCost).toBe(0);
  });

  it('handles large meetings correctly', () => {
    const result = MeetingCost.calculateCost({
      durationMinutes: 120,
      attendeeCount: 20,
      hourlyRate: 100
    });
    // 2 hours * 20 people * $100/hr = $4,000
    expect(result.totalCost).toBe(4000);
    expect(result.costPerPerson).toBe(200);
  });

  it('rounds to 2 decimal places', () => {
    const result = MeetingCost.calculateCost({
      durationMinutes: 45,
      attendeeCount: 3,
      hourlyRate: 33
    });
    // 0.75 hours * 3 * $33 = $74.25
    expect(result.totalCost).toBe(74.25);
  });
});

// =========================================================
// formatCost
// =========================================================
describe('formatCost', () => {
  it('formats USD correctly', () => {
    expect(MeetingCost.formatCost(50, 'USD')).toBe('$50.00');
  });

  it('formats large amounts with commas', () => {
    expect(MeetingCost.formatCost(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats EUR with euro symbol', () => {
    expect(MeetingCost.formatCost(100, 'EUR')).toBe('\u20AC100.00');
  });

  it('formats GBP with pound symbol', () => {
    expect(MeetingCost.formatCost(75.5, 'GBP')).toBe('\u00A375.50');
  });

  it('defaults to $ for unknown currency', () => {
    expect(MeetingCost.formatCost(10, 'XYZ')).toBe('$10.00');
  });
});

// =========================================================
// formatDuration
// =========================================================
describe('formatDuration', () => {
  it('formats 60 minutes as "1h"', () => {
    expect(MeetingCost.formatDuration(60)).toBe('1h');
  });

  it('formats 90 minutes as "1h 30m"', () => {
    expect(MeetingCost.formatDuration(90)).toBe('1h 30m');
  });

  it('formats 30 minutes as "30m"', () => {
    expect(MeetingCost.formatDuration(30)).toBe('30m');
  });

  it('formats 0 minutes as "0m"', () => {
    expect(MeetingCost.formatDuration(0)).toBe('0m');
  });

  it('formats 150 minutes as "2h 30m"', () => {
    expect(MeetingCost.formatDuration(150)).toBe('2h 30m');
  });
});

// =========================================================
// getMeetingProgress
// =========================================================
describe('getMeetingProgress', () => {
  it('returns isUpcoming for future meetings', () => {
    // Set start time far in the future (23:59)
    const result = MeetingCost.getMeetingProgress(23 * 60 + 59, 60);
    // This will be upcoming if current time is before 23:59
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < 23 * 60 + 59) {
      expect(result.isUpcoming).toBe(true);
      expect(result.isActive).toBe(false);
    }
  });

  it('returns correct progress for past meetings', () => {
    // Set start time at midnight (long past)
    const result = MeetingCost.getMeetingProgress(0, 1);
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin > 1) {
      expect(result.isActive).toBe(false);
      expect(result.isUpcoming).toBe(false);
      expect(result.progress).toBe(1);
    }
  });

  it('returns elapsedMinutes equal to duration for finished meetings', () => {
    const result = MeetingCost.getMeetingProgress(0, 1);
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin > 1) {
      expect(result.elapsedMinutes).toBe(1);
    }
  });
});

// =========================================================
// DEFAULTS
// =========================================================
describe('DEFAULTS', () => {
  it('has default hourly rate of 50', () => {
    expect(MeetingCost.DEFAULTS.yourRate).toBe(50);
  });

  it('has default currency of USD', () => {
    expect(MeetingCost.DEFAULTS.currency).toBe('USD');
  });

  it('has default rate type of hourly', () => {
    expect(MeetingCost.DEFAULTS.rateType).toBe('hourly');
  });
});

// =========================================================
// CURRENCY_SYMBOLS
// =========================================================
describe('CURRENCY_SYMBOLS', () => {
  it('has symbol for USD', () => {
    expect(MeetingCost.CURRENCY_SYMBOLS.USD).toBe('$');
  });

  it('has symbol for all supported currencies', () => {
    const supported = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];
    for (const c of supported) {
      expect(MeetingCost.CURRENCY_SYMBOLS[c]).toBeDefined();
    }
  });
});

// =========================================================
// detectRecurrence
// =========================================================
describe('detectRecurrence', () => {
  it('detects "Every week" as weekly', () => {
    expect(MeetingCost.detectRecurrence('Every week')).toBe('weekly');
  });

  it('detects "Every Monday" as weekly', () => {
    expect(MeetingCost.detectRecurrence('Every Monday')).toBe('weekly');
  });

  it('detects "Every day" as daily', () => {
    expect(MeetingCost.detectRecurrence('Every day')).toBe('daily');
  });

  it('detects "Daily" as daily', () => {
    expect(MeetingCost.detectRecurrence('Daily')).toBe('daily');
  });

  it('detects "Every weekday" as daily', () => {
    expect(MeetingCost.detectRecurrence('Every weekday')).toBe('daily');
  });

  it('detects "Every 2 weeks" as biweekly', () => {
    expect(MeetingCost.detectRecurrence('Every 2 weeks')).toBe('biweekly');
  });

  it('detects "Every other week" as biweekly', () => {
    expect(MeetingCost.detectRecurrence('Every other week')).toBe('biweekly');
  });

  it('detects "Monthly" as monthly', () => {
    expect(MeetingCost.detectRecurrence('Monthly')).toBe('monthly');
  });

  it('detects "Every month" as monthly', () => {
    expect(MeetingCost.detectRecurrence('Every month')).toBe('monthly');
  });

  it('detects "Annually" as yearly', () => {
    expect(MeetingCost.detectRecurrence('Annually')).toBe('yearly');
  });

  it('returns null for non-recurring text', () => {
    expect(MeetingCost.detectRecurrence('Team standup')).toBeNull();
  });

  it('returns null for null/empty input', () => {
    expect(MeetingCost.detectRecurrence(null)).toBeNull();
    expect(MeetingCost.detectRecurrence('')).toBeNull();
    expect(MeetingCost.detectRecurrence(undefined)).toBeNull();
  });
});

// =========================================================
// calculateAnnualCost
// =========================================================
describe('calculateAnnualCost', () => {
  it('calculates weekly recurring cost correctly', () => {
    // $100 per meeting * 52 weeks = $5,200
    expect(MeetingCost.calculateAnnualCost(100, 'weekly')).toBe(5200);
  });

  it('calculates daily recurring cost correctly', () => {
    // $50 per meeting * 260 workdays = $13,000
    expect(MeetingCost.calculateAnnualCost(50, 'daily')).toBe(13000);
  });

  it('calculates biweekly recurring cost correctly', () => {
    // $200 per meeting * 26 = $5,200
    expect(MeetingCost.calculateAnnualCost(200, 'biweekly')).toBe(5200);
  });

  it('calculates monthly recurring cost correctly', () => {
    // $500 per meeting * 12 = $6,000
    expect(MeetingCost.calculateAnnualCost(500, 'monthly')).toBe(6000);
  });

  it('returns 0 for zero cost', () => {
    expect(MeetingCost.calculateAnnualCost(0, 'weekly')).toBe(0);
  });

  it('returns 0 for invalid frequency', () => {
    expect(MeetingCost.calculateAnnualCost(100, 'invalid')).toBe(0);
  });

  it('returns 0 for null cost', () => {
    expect(MeetingCost.calculateAnnualCost(null, 'weekly')).toBe(0);
  });
});

// =========================================================
// getWeekKey
// =========================================================
describe('getWeekKey', () => {
  it('returns a string in YYYY-WNN format', () => {
    const key = MeetingCost.getWeekKey();
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('returns consistent key for same date', () => {
    const date = new Date('2026-04-12');
    const key1 = MeetingCost.getWeekKey(date);
    const key2 = MeetingCost.getWeekKey(date);
    expect(key1).toBe(key2);
  });

  it('returns different keys for dates in different weeks', () => {
    const date1 = new Date('2026-04-06');
    const date2 = new Date('2026-04-13');
    const key1 = MeetingCost.getWeekKey(date1);
    const key2 = MeetingCost.getWeekKey(date2);
    expect(key1).not.toBe(key2);
  });

  it('uses current date when no argument provided', () => {
    const key = MeetingCost.getWeekKey();
    const now = new Date();
    expect(key.startsWith(String(now.getFullYear()))).toBe(true);
  });
});

// =========================================================
// RECURRENCE_MULTIPLIERS
// =========================================================
describe('RECURRENCE_MULTIPLIERS', () => {
  it('has multiplier for weekly', () => {
    expect(MeetingCost.RECURRENCE_MULTIPLIERS.weekly).toBe(52);
  });

  it('has multiplier for daily (workdays)', () => {
    expect(MeetingCost.RECURRENCE_MULTIPLIERS.daily).toBe(260);
  });

  it('has multiplier for monthly', () => {
    expect(MeetingCost.RECURRENCE_MULTIPLIERS.monthly).toBe(12);
  });

  it('has multiplier for biweekly', () => {
    expect(MeetingCost.RECURRENCE_MULTIPLIERS.biweekly).toBe(26);
  });

  it('has all expected frequency keys', () => {
    const expected = ['daily', 'weekday', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    for (const key of expected) {
      expect(MeetingCost.RECURRENCE_MULTIPLIERS[key]).toBeDefined();
    }
  });
});
