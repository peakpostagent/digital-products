// pro-features.test.js — Unit tests for Pro-tier helpers
// These functions are pure (no chrome APIs) so they run in Node directly.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Evaluate pro-features.js in this context since it's script-tag-loaded, not
// an ES module. The file sets window.MccProFeatures; we capture the IIFE's
// return value by reading + evaluating in a tiny sandbox.
const src = readFileSync(
  resolve(__dirname, '../src/lib/pro-features.js'),
  'utf8'
);

// Remove the window assignment so it doesn't fail in Node
const stripped = src.replace(/if \(typeof window[\s\S]+?\}\s*$/, '');

// The module uses an IIFE assigning to `const MccProFeatures = (() => {...})()`.
// We evaluate it and extract the binding via `eval` + return trick.
// eslint-disable-next-line no-new-func
const MccProFeatures = new Function(stripped + '\nreturn MccProFeatures;')();

describe('MccProFeatures.csvEscape', () => {
  it('returns empty string for null/undefined', () => {
    expect(MccProFeatures.csvEscape(null)).toBe('');
    expect(MccProFeatures.csvEscape(undefined)).toBe('');
  });

  it('wraps fields with commas in quotes', () => {
    expect(MccProFeatures.csvEscape('hello, world')).toBe('"hello, world"');
  });

  it('escapes inner quotes', () => {
    expect(MccProFeatures.csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps fields containing newlines', () => {
    expect(MccProFeatures.csvEscape('a\nb')).toBe('"a\nb"');
  });

  it('leaves safe strings unwrapped', () => {
    expect(MccProFeatures.csvEscape('abc')).toBe('abc');
  });
});

describe('MccProFeatures.buildMeetingsCsv', () => {
  it('returns a header row when meetings is empty', () => {
    const csv = MccProFeatures.buildMeetingsCsv([], 'USD');
    expect(csv.split('\n').length).toBe(1);
    expect(csv).toContain('Title');
    expect(csv).toContain('Cost (USD)');
  });

  it('serialises each meeting on its own line', () => {
    const meetings = [
      { title: 'Standup', timestamp: Date.UTC(2026, 0, 5), duration: 15, attendees: 5, cost: 62.50, rating: 'valuable', weekKey: '2026-W02' },
      { title: 'All-hands, monthly', timestamp: Date.UTC(2026, 0, 6), duration: 60, attendees: 50, cost: 2500, rating: null, weekKey: '2026-W02' }
    ];
    const csv = MccProFeatures.buildMeetingsCsv(meetings, 'USD');
    const lines = csv.split('\n');
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain('Standup');
    expect(lines[2]).toContain('"All-hands, monthly"');
  });
});

describe('MccProFeatures.pickRateProfile', () => {
  const profiles = [
    { id: '1', name: 'Acme', hourlyRate: 150, matchPattern: '@acme.com' },
    { id: '2', name: 'Ops', hourlyRate: 80, matchPattern: 'standup' }
  ];

  it('returns null when no profile matches', () => {
    expect(MccProFeatures.pickRateProfile(profiles, { title: 'Lunch', attendeeEmails: [] })).toBeNull();
  });

  it('matches on title substring', () => {
    const match = MccProFeatures.pickRateProfile(profiles, { title: 'Weekly Standup', attendeeEmails: [] });
    expect(match.id).toBe('2');
  });

  it('matches on attendee email', () => {
    const match = MccProFeatures.pickRateProfile(profiles, { title: 'Strategy Call', attendeeEmails: ['bob@acme.com'] });
    expect(match.id).toBe('1');
  });

  it('is case-insensitive', () => {
    const match = MccProFeatures.pickRateProfile(profiles, { title: 'Weekly STANDUP', attendeeEmails: [] });
    expect(match.id).toBe('2');
  });
});

describe('MccProFeatures.validateProfile', () => {
  it('rejects empty profiles', () => {
    expect(MccProFeatures.validateProfile(null).valid).toBe(false);
  });

  it('requires a name', () => {
    expect(MccProFeatures.validateProfile({ hourlyRate: 100 }).valid).toBe(false);
  });

  it('requires a positive rate', () => {
    expect(MccProFeatures.validateProfile({ name: 'x', hourlyRate: 0 }).valid).toBe(false);
    expect(MccProFeatures.validateProfile({ name: 'x', hourlyRate: -5 }).valid).toBe(false);
  });

  it('accepts valid profiles', () => {
    expect(MccProFeatures.validateProfile({ name: 'Acme', hourlyRate: 120 }).valid).toBe(true);
  });
});

describe('MccProFeatures.calculateMeetingRoi', () => {
  const base = { durationMinutes: 30, attendeeCount: 5, hourlyRate: 60 };

  it('recommends email when no sync signals and savings exist', () => {
    const result = MccProFeatures.calculateMeetingRoi({ ...base, signals: {} });
    expect(result.recommendation).toBe('email');
    expect(result.savings).toBeGreaterThan(0);
  });

  it('recommends meeting when discussion is needed', () => {
    const result = MccProFeatures.calculateMeetingRoi({ ...base, signals: { needsDiscussion: true } });
    expect(result.recommendation).toBe('meeting');
  });

  it('recommends meeting for sensitive topics', () => {
    const result = MccProFeatures.calculateMeetingRoi({ ...base, signals: { isSensitive: true } });
    expect(result.recommendation).toBe('meeting');
  });

  it('group decisions with >3 people force a meeting', () => {
    const result = MccProFeatures.calculateMeetingRoi({
      ...base,
      attendeeCount: 8,
      signals: { needsDecision: true }
    });
    expect(result.recommendation).toBe('meeting');
  });

  it('handles degenerate inputs gracefully', () => {
    const result = MccProFeatures.calculateMeetingRoi({
      durationMinutes: 0, attendeeCount: 0, hourlyRate: 0, signals: {}
    });
    expect(result.meetingCost).toBe(0);
    expect(result.emailCost).toBe(0);
  });
});

describe('MccProFeatures.projectAnnualCost', () => {
  it('returns zero projection for empty weeks', () => {
    const result = MccProFeatures.projectAnnualCost([]);
    expect(result.projectedAnnual).toBe(0);
    expect(result.confidence).toBe('none');
  });

  it('averages weekly totals and multiplies by 52', () => {
    const weeks = [{ totalCost: 100 }, { totalCost: 200 }];
    const result = MccProFeatures.projectAnnualCost(weeks);
    expect(result.weeklyAverage).toBe(150);
    expect(result.projectedAnnual).toBe(7800);
  });

  it('marks high confidence at 8+ weeks', () => {
    const weeks = Array.from({ length: 8 }, () => ({ totalCost: 100 }));
    expect(MccProFeatures.projectAnnualCost(weeks).confidence).toBe('high');
  });

  it('marks low confidence at <4 weeks', () => {
    const weeks = [{ totalCost: 100 }];
    expect(MccProFeatures.projectAnnualCost(weeks).confidence).toBe('low');
  });
});

describe('MccProFeatures.compareToBenchmark', () => {
  it('returns negative costDelta when below benchmark', () => {
    const result = MccProFeatures.compareToBenchmark({
      totalCost: 500, totalMeetings: 10, valuablePercent: 60
    });
    expect(result.costDelta).toBeLessThan(0);
  });

  it('produces a summary string', () => {
    const result = MccProFeatures.compareToBenchmark({
      totalCost: 300, totalMeetings: 8, valuablePercent: 75
    });
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });
});
