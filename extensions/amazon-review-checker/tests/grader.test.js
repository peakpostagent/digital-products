/**
 * Unit tests for Amazon Review Checker — lib/grader.js
 *
 * Tests cover:
 *  - All 6 heuristics individually with realistic inputs
 *  - The severity-weighted overall grade calculation
 *  - The findMaxClusterInDays sliding-window math
 *  - Edge cases: insufficient data, missing fields, single-review products
 */

import { describe, it, expect } from 'vitest';
import {
  HEURISTICS,
  evaluateReviews,
  calculateGrade,
  gradeColor,
  findMaxClusterInDays,
} from '../src/lib/grader.js';

const DAY = 24 * 60 * 60 * 1000;

function baseData(overrides) {
  return Object.assign(
    {
      totalReviews: 50,
      verifiedReviews: 40,
      timestamps: evenlySpacedTimestamps(50, 365),
      starHistogram: [2, 3, 5, 10, 30], // healthy J-curve
      commonPhrases: { suspiciousCount: 0 },
      reviewsWithPhotos: 7,
      reviewerProfiles: null,
    },
    overrides
  );
}

function evenlySpacedTimestamps(count, spanDays) {
  var span = spanDays * DAY;
  var step = span / count;
  var now = Date.UTC(2026, 5, 1);
  var arr = [];
  for (var i = 0; i < count; i++) arr.push(now - i * step);
  return arr;
}

describe('Verified-Purchase Ratio heuristic', function () {
  var heuristic = HEURISTICS.find(function (h) {
    return h.name === 'Verified-Purchase Ratio';
  });

  it('returns "missing" when totalReviews is below 5', function () {
    expect(heuristic.evaluate({ totalReviews: 3, verifiedReviews: 3 })).toBe('missing');
  });

  it('returns "good" when verified ratio >= 0.7', function () {
    expect(heuristic.evaluate({ totalReviews: 100, verifiedReviews: 75 })).toBe('good');
  });

  it('returns "weak" when verified ratio 0.4-0.7', function () {
    expect(heuristic.evaluate({ totalReviews: 100, verifiedReviews: 50 })).toBe('weak');
  });

  it('returns "missing" when verified ratio < 0.4', function () {
    expect(heuristic.evaluate({ totalReviews: 100, verifiedReviews: 20 })).toBe('missing');
  });
});

describe('Review Timestamp Clustering heuristic', function () {
  var heuristic = HEURISTICS.find(function (h) {
    return h.name === 'Review Timestamp Clustering';
  });

  it('returns "missing" when timestamps below 5', function () {
    expect(heuristic.evaluate({ timestamps: [Date.now()] })).toBe('missing');
  });

  it('returns "good" for evenly spaced reviews across many months', function () {
    var ts = evenlySpacedTimestamps(50, 365);
    expect(heuristic.evaluate({ timestamps: ts })).toBe('good');
  });

  it('returns "missing" when 70%+ of reviews land in a 7-day window', function () {
    var ts = [];
    var base = Date.UTC(2026, 0, 1);
    for (var i = 0; i < 40; i++) ts.push(base + i * 1000); // all within 40 seconds
    for (var j = 0; j < 10; j++) ts.push(base + (j + 100) * DAY);
    expect(heuristic.evaluate({ timestamps: ts })).toBe('missing');
  });
});

describe('Rating Distribution Shape heuristic', function () {
  var heuristic = HEURISTICS.find(function (h) {
    return h.name === 'Rating Distribution Shape';
  });

  it('returns "missing" when total reviews below 10', function () {
    expect(heuristic.evaluate({ starHistogram: [1, 1, 1, 1, 1] })).toBe('missing');
  });

  it('returns "good" for a healthy J-curve', function () {
    expect(heuristic.evaluate({ starHistogram: [2, 3, 5, 10, 30] })).toBe('good');
  });

  it('returns "missing" for all-5s', function () {
    expect(heuristic.evaluate({ starHistogram: [0, 0, 0, 1, 99] })).toBe('missing');
  });

  it('returns "missing" for U-shape (5s + 1s only)', function () {
    expect(heuristic.evaluate({ starHistogram: [20, 1, 0, 1, 78] })).toBe('missing');
  });
});

describe('Repeated Phrasing Detection heuristic', function () {
  var heuristic = HEURISTICS.find(function (h) {
    return h.name === 'Repeated Phrasing Detection';
  });

  it('returns "missing" when commonPhrases is null', function () {
    expect(heuristic.evaluate({ commonPhrases: null })).toBe('missing');
  });

  it('returns "good" when zero suspicious phrases', function () {
    expect(heuristic.evaluate({ commonPhrases: { suspiciousCount: 0 } })).toBe('good');
  });

  it('returns "weak" when 1-2 suspicious phrases', function () {
    expect(heuristic.evaluate({ commonPhrases: { suspiciousCount: 2 } })).toBe('weak');
  });

  it('returns "missing" when 3+ suspicious phrases', function () {
    expect(heuristic.evaluate({ commonPhrases: { suspiciousCount: 5 } })).toBe('missing');
  });
});

describe('Reviewer Profile Diversity heuristic (Pro)', function () {
  var heuristic = HEURISTICS.find(function (h) {
    return h.name === 'Reviewer Profile Diversity';
  });

  it('returns "missing" when reviewerProfiles is null (free tier)', function () {
    expect(heuristic.evaluate({ reviewerProfiles: null })).toBe('missing');
  });

  it('returns "good" when 60%+ of sampled reviewers have history', function () {
    expect(heuristic.evaluate({ reviewerProfiles: { sampled: 20, withHistory: 15 } })).toBe('good');
  });

  it('returns "missing" when fewer than 30% have history', function () {
    expect(heuristic.evaluate({ reviewerProfiles: { sampled: 20, withHistory: 4 } })).toBe('missing');
  });
});

describe('Photo vs Text Review Mix heuristic', function () {
  var heuristic = HEURISTICS.find(function (h) {
    return h.name === 'Photo vs Text Review Mix';
  });

  it('returns "missing" when totalReviews below 5', function () {
    expect(heuristic.evaluate({ totalReviews: 2, reviewsWithPhotos: 0 })).toBe('missing');
  });

  it('returns "good" when 10%+ of reviews have photos', function () {
    expect(heuristic.evaluate({ totalReviews: 100, reviewsWithPhotos: 15 })).toBe('good');
  });

  it('returns "weak" when 3-10% have photos', function () {
    expect(heuristic.evaluate({ totalReviews: 100, reviewsWithPhotos: 5 })).toBe('weak');
  });

  it('returns "missing" when photoRatio is near zero', function () {
    expect(heuristic.evaluate({ totalReviews: 100, reviewsWithPhotos: 1 })).toBe('missing');
  });
});

describe('findMaxClusterInDays', function () {
  it('returns 0 for empty array', function () {
    expect(findMaxClusterInDays([], 7)).toBe(0);
  });

  it('returns max count for a tight cluster', function () {
    var base = Date.UTC(2026, 0, 1);
    var ts = [base, base + DAY, base + 2 * DAY, base + 3 * DAY, base + 50 * DAY];
    expect(findMaxClusterInDays(ts, 7)).toBe(4);
  });

  it('handles reverse-sorted input', function () {
    var base = Date.UTC(2026, 0, 1);
    var ts = [base + 100 * DAY, base + DAY, base];
    expect(findMaxClusterInDays(ts, 7)).toBe(2);
  });
});

describe('calculateGrade integration', function () {
  it('grades a clean product as A+ or A', function () {
    var results = evaluateReviews(baseData({
      reviewerProfiles: { sampled: 20, withHistory: 18 },
    }));
    var summary = calculateGrade(results);
    expect(['A+', 'A']).toContain(summary.grade);
    expect(summary.percentage).toBeGreaterThan(85);
  });

  it('grades a clearly-faked product as F', function () {
    var results = evaluateReviews(
      baseData({
        verifiedReviews: 5,
        timestamps: (function () {
          var arr = [];
          var b = Date.UTC(2026, 0, 1);
          for (var i = 0; i < 50; i++) arr.push(b + i * 1000);
          return arr;
        })(),
        starHistogram: [0, 0, 0, 2, 98],
        commonPhrases: { suspiciousCount: 6 },
        reviewsWithPhotos: 0,
        reviewerProfiles: { sampled: 20, withHistory: 1 },
      })
    );
    var summary = calculateGrade(results);
    expect(['D', 'F']).toContain(summary.grade);
  });

  it('counts critical and important issues correctly', function () {
    var results = evaluateReviews(
      baseData({
        verifiedReviews: 10, // critical → weak
        starHistogram: [0, 0, 1, 2, 97], // important → missing
      })
    );
    var summary = calculateGrade(results);
    expect(summary.criticalIssues).toBeGreaterThanOrEqual(1);
    expect(summary.importantIssues).toBeGreaterThanOrEqual(1);
  });
});

describe('gradeColor', function () {
  it('returns green for A+', function () {
    expect(gradeColor('A+')).toMatch(/^#/);
  });

  it('returns red for F', function () {
    expect(gradeColor('F')).toBe('#dc2626');
  });

  it('returns gray for unknown grade', function () {
    expect(gradeColor('Z')).toBe('#6b7280');
  });
});
