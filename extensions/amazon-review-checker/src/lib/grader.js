/**
 * Amazon Review Checker — Trust Score Grader
 *
 * Ports the A-F letter-grade pattern from extensions/security-headers/src/lib/headers.js
 * to Amazon review trustworthiness. Each heuristic returns a 'good' | 'weak' | 'missing'
 * status; the overall grade is a severity-weighted score from 0-100% mapped to A+ to F.
 *
 * Design principle: NO LLM calls in the grading path. Heuristics are pure functions
 * over the DOM data we already have. LLM is reserved for the optional Pro-tier
 * "explain this score" feature so we don't burn $300/mo on inference for free users.
 *
 * Reusable across amazon.com / amazon.ca / amazon.co.uk / amazon.de.
 */

/**
 * Heuristic definitions. Each entry has:
 *  - name:          Short identifier for the heuristic
 *  - description:   What it checks (shown in the breakdown UI)
 *  - severity:      'critical' | 'important' | 'optional'
 *  - weight:        Base points toward the overall grade
 *  - evaluate:      Function (reviewData) -> 'good' | 'weak' | 'missing'
 *  - reason:        Human-readable explanation per status (shown in popup)
 */
const HEURISTICS = [
  {
    name: 'Verified-Purchase Ratio',
    description: 'How many reviews are from buyers who actually bought the product through Amazon.',
    severity: 'critical',
    weight: 15,
    evaluate: function (data) {
      if (!data.totalReviews || data.totalReviews < 5) return 'missing';
      var ratio = data.verifiedReviews / data.totalReviews;
      if (ratio >= 0.7) return 'good';
      if (ratio >= 0.4) return 'weak';
      return 'missing';
    },
    reason: {
      good: 'Most reviews are from verified purchasers.',
      weak: 'Fewer than 70% of reviews are verified — some manipulation likely.',
      missing: 'Verified-purchase rate is suspiciously low — high manipulation risk.'
    }
  },
  {
    name: 'Review Timestamp Clustering',
    description: 'Are reviews spread across time or suspiciously bunched into a few days?',
    severity: 'critical',
    weight: 15,
    evaluate: function (data) {
      if (!data.timestamps || data.timestamps.length < 5) return 'missing';
      // Calculate ratio of reviews in the tightest 7-day window vs total
      var maxCluster = findMaxClusterInDays(data.timestamps, 7);
      var clusterRatio = maxCluster / data.timestamps.length;
      if (clusterRatio <= 0.25) return 'good';
      if (clusterRatio <= 0.50) return 'weak';
      return 'missing';
    },
    reason: {
      good: 'Reviews are spread naturally across many months.',
      weak: 'A significant chunk of reviews arrived in a short window.',
      missing: 'Most reviews were posted within a tight time window — review-bombing pattern.'
    }
  },
  {
    name: 'Rating Distribution Shape',
    description: 'Healthy products show a J-curve (mostly 5s, some 4s, scattered lower). Faked products show all 5s or a U-shape (5s and 1s only).',
    severity: 'important',
    weight: 10,
    evaluate: function (data) {
      if (!data.starHistogram) return 'missing';
      var hist = data.starHistogram; // [count1, count2, count3, count4, count5]
      var total = hist.reduce(function (a, b) { return a + b; }, 0);
      if (total < 10) return 'missing';
      var fiveStarRatio = hist[4] / total;
      var threeStarRatio = hist[2] / total;
      // Healthy product: 60-85% 5-star, with a believable middle distribution
      if (fiveStarRatio < 0.85 && threeStarRatio > 0.05) return 'good';
      // Suspicious: >95% 5-star or U-shape (5s + 1s only)
      if (fiveStarRatio > 0.95 || threeStarRatio < 0.02) return 'missing';
      return 'weak';
    },
    reason: {
      good: 'Rating distribution looks natural and earned.',
      weak: 'Distribution is unusual but plausible.',
      missing: 'Rating distribution shows clear manipulation signs (all-5s or U-shape).'
    }
  },
  {
    name: 'Repeated Phrasing Detection',
    description: 'Looks for the same distinctive phrases appearing across multiple reviews — sign of templated/incentivized reviews.',
    severity: 'important',
    weight: 10,
    evaluate: function (data) {
      if (!data.commonPhrases) return 'missing';
      if (data.commonPhrases.suspiciousCount === 0) return 'good';
      if (data.commonPhrases.suspiciousCount <= 2) return 'weak';
      return 'missing';
    },
    reason: {
      good: 'No suspicious cross-review phrase repetition detected.',
      weak: 'A few suspicious repeated phrases — possibly templated reviews.',
      missing: 'Multiple identical phrases across reviews — strong templated/incentivized signal.'
    }
  },
  {
    name: 'Reviewer Profile Diversity',
    description: 'Are reviews from real, diverse Amazon profiles with prior review history?',
    severity: 'important',
    weight: 10,
    evaluate: function (data) {
      // Pro-tier feature — only populated when user has paid plan
      if (!data.reviewerProfiles) return 'missing';
      var diverseRatio = data.reviewerProfiles.withHistory / data.reviewerProfiles.sampled;
      if (diverseRatio >= 0.6) return 'good';
      if (diverseRatio >= 0.3) return 'weak';
      return 'missing';
    },
    reason: {
      good: 'Reviews are from diverse, experienced Amazon accounts.',
      weak: 'Some reviewers have thin or new accounts.',
      missing: 'Many reviews from brand-new or single-review accounts — incentivized review pattern.'
    }
  },
  {
    name: 'Photo vs Text Review Mix',
    description: 'Genuine product reviewers often post photos. All-text reviews are easier to fake at scale.',
    severity: 'optional',
    weight: 5,
    evaluate: function (data) {
      if (!data.totalReviews || data.totalReviews < 5) return 'missing';
      var photoRatio = (data.reviewsWithPhotos || 0) / data.totalReviews;
      if (photoRatio >= 0.1) return 'good';
      if (photoRatio >= 0.03) return 'weak';
      return 'missing';
    },
    reason: {
      good: 'Many reviewers posted photos — strong genuine-buyer signal.',
      weak: 'Few photo reviews.',
      missing: 'Almost no photo reviews despite many text reviews.'
    }
  }
];

/**
 * Severity multipliers — critical issues hurt the grade more.
 */
var SEVERITY_MULTIPLIER = {
  critical: 1.5,
  important: 1.0,
  optional: 0.6
};

/**
 * Find the maximum number of timestamps clustered in any rolling window of N days.
 */
function findMaxClusterInDays(timestamps, days) {
  if (!timestamps || timestamps.length === 0) return 0;
  var sorted = timestamps.slice().sort(function (a, b) { return a - b; });
  var windowMs = days * 24 * 60 * 60 * 1000;
  var maxCount = 0;
  for (var i = 0; i < sorted.length; i++) {
    var count = 0;
    for (var j = i; j < sorted.length && sorted[j] - sorted[i] <= windowMs; j++) {
      count++;
    }
    if (count > maxCount) maxCount = count;
  }
  return maxCount;
}

/**
 * Evaluate all heuristics and produce per-heuristic results + overall grade.
 * @param {Object} reviewData - shape:
 *   {
 *     totalReviews: number,
 *     verifiedReviews: number,
 *     timestamps: number[] (unix ms),
 *     starHistogram: [number, number, number, number, number],
 *     commonPhrases: { suspiciousCount: number },
 *     reviewsWithPhotos: number,
 *     reviewerProfiles?: { sampled: number, withHistory: number }  // Pro tier only
 *   }
 */
function evaluateReviews(reviewData) {
  return HEURISTICS.map(function (h) {
    var status = h.evaluate(reviewData);
    return {
      name: h.name,
      description: h.description,
      severity: h.severity,
      weight: h.weight,
      status: status,
      reason: h.reason[status] || ''
    };
  });
}

/**
 * Calculate overall A-F letter grade from heuristic results.
 */
function calculateGrade(results) {
  var maxScore = 0;
  var score = 0;
  var criticalIssues = 0;
  var importantIssues = 0;

  results.forEach(function (r) {
    var mult = SEVERITY_MULTIPLIER[r.severity] || 1.0;
    var weighted = r.weight * mult;
    maxScore += weighted;
    if (r.status === 'good') score += weighted;
    else if (r.status === 'weak') score += weighted * 0.5;

    if (r.status === 'missing' || r.status === 'weak') {
      if (r.severity === 'critical') criticalIssues++;
      else if (r.severity === 'important') importantIssues++;
    }
  });

  var pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  var grade;
  if (pct >= 95) grade = 'A+';
  else if (pct >= 85) grade = 'A';
  else if (pct >= 70) grade = 'B';
  else if (pct >= 55) grade = 'C';
  else if (pct >= 40) grade = 'D';
  else grade = 'F';

  return {
    grade: grade,
    score: Math.round(score),
    maxScore: Math.round(maxScore),
    percentage: Math.round(pct),
    criticalIssues: criticalIssues,
    importantIssues: importantIssues
  };
}

/**
 * Get a color hex for badge / popup display by grade.
 */
function gradeColor(grade) {
  switch (grade) {
    case 'A+': return '#22c55e';
    case 'A':  return '#16a34a';
    case 'B':  return '#f59e0b';
    case 'C':  return '#fb923c';
    case 'D':  return '#ef4444';
    case 'F':  return '#dc2626';
    default:   return '#6b7280';
  }
}

// CommonJS export for testing (browser version sets these as globals)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HEURISTICS,
    evaluateReviews,
    calculateGrade,
    gradeColor,
    findMaxClusterInDays
  };
}
