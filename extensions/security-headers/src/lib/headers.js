/**
 * Security Headers — header definitions, grading, and analysis logic.
 * Each header has a name, description, recommendation, and scoring weight.
 */

/**
 * Definitions for all security-relevant HTTP response headers.
 * Each entry includes:
 *  - name:          The header name (case-insensitive matching)
 *  - description:   What the header does
 *  - recommendation: What value to set
 *  - weight:        Points toward the overall grade (higher = more important)
 *  - deprecated:    Optional flag for headers that are no longer recommended
 *  - evaluate:      Function that returns 'good', 'weak', or 'missing'
 */
const HEADER_DEFINITIONS = [
  {
    name: 'Content-Security-Policy',
    description: 'Controls which resources the browser is allowed to load. Prevents XSS, data injection, and clickjacking attacks.',
    recommendation: "Set a restrictive policy. Start with default-src 'self' and add sources as needed.",
    weight: 15,
    evaluate: function (value) {
      if (!value) return 'missing';
      // A very permissive CSP with unsafe-inline and unsafe-eval is weak
      if (value.includes("'unsafe-inline'") && value.includes("'unsafe-eval'")) return 'weak';
      return 'good';
    }
  },
  {
    name: 'Strict-Transport-Security',
    description: 'Forces browsers to use HTTPS for all future requests to this domain. Prevents protocol downgrade attacks.',
    recommendation: 'max-age=31536000; includeSubDomains; preload',
    weight: 15,
    evaluate: function (value) {
      if (!value) return 'missing';
      var match = value.match(/max-age=(\d+)/i);
      if (match && parseInt(match[1], 10) < 2592000) return 'weak'; // less than 30 days
      return 'good';
    }
  },
  {
    name: 'X-Content-Type-Options',
    description: 'Prevents browsers from MIME-sniffing a response away from the declared content type. Stops script injection via content type confusion.',
    recommendation: 'nosniff',
    weight: 10,
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.toLowerCase().trim() === 'nosniff') return 'good';
      return 'weak';
    }
  },
  {
    name: 'X-Frame-Options',
    description: 'Controls whether the page can be embedded in an iframe. Prevents clickjacking attacks.',
    recommendation: 'DENY or SAMEORIGIN',
    weight: 10,
    evaluate: function (value) {
      if (!value) return 'missing';
      var v = value.toUpperCase().trim();
      if (v === 'DENY' || v === 'SAMEORIGIN') return 'good';
      return 'weak';
    }
  },
  {
    name: 'X-XSS-Protection',
    description: 'Legacy XSS filter built into older browsers. Deprecated in modern browsers but still checked for backward compatibility.',
    recommendation: '0 (disable) — modern CSP is preferred. Older recommendation was 1; mode=block.',
    weight: 3,
    deprecated: true,
    evaluate: function (value) {
      if (!value) return 'missing';
      // '0' is the modern recommendation (disable the buggy filter)
      // '1; mode=block' is the legacy recommendation
      var v = value.trim();
      if (v === '0' || v === '1; mode=block') return 'good';
      return 'weak';
    }
  },
  {
    name: 'Referrer-Policy',
    description: 'Controls how much referrer information is included with requests. Protects user privacy when navigating away.',
    recommendation: 'strict-origin-when-cross-origin or no-referrer',
    weight: 8,
    evaluate: function (value) {
      if (!value) return 'missing';
      var good = ['no-referrer', 'strict-origin', 'strict-origin-when-cross-origin', 'same-origin'];
      if (good.indexOf(value.toLowerCase().trim()) !== -1) return 'good';
      if (value.toLowerCase().trim() === 'unsafe-url') return 'weak';
      return 'good'; // origin-when-cross-origin, origin, etc. are acceptable
    }
  },
  {
    name: 'Permissions-Policy',
    description: 'Controls which browser features (camera, mic, geolocation, etc.) the page and its iframes can use.',
    recommendation: 'Restrict unused features. Example: camera=(), microphone=(), geolocation=()',
    weight: 8,
    evaluate: function (value) {
      if (!value) return 'missing';
      // Any value is better than none; a very short policy might be weak
      if (value.length < 10) return 'weak';
      return 'good';
    }
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    description: 'Isolates the browsing context from cross-origin windows. Prevents Spectre-style side-channel attacks.',
    recommendation: 'same-origin',
    weight: 7,
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.toLowerCase().trim() === 'same-origin') return 'good';
      if (value.toLowerCase().trim() === 'same-origin-allow-popups') return 'good';
      return 'weak';
    }
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    description: 'Controls which origins can read the resource. Prevents unauthorized cross-origin reads.',
    recommendation: 'same-origin or same-site',
    weight: 7,
    evaluate: function (value) {
      if (!value) return 'missing';
      var v = value.toLowerCase().trim();
      if (v === 'same-origin' || v === 'same-site') return 'good';
      if (v === 'cross-origin') return 'weak';
      return 'weak';
    }
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    description: 'Requires cross-origin resources to explicitly grant permission to be loaded. Enables SharedArrayBuffer and high-resolution timers.',
    recommendation: 'require-corp',
    weight: 7,
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.toLowerCase().trim() === 'require-corp') return 'good';
      if (value.toLowerCase().trim() === 'credentialless') return 'good';
      return 'weak';
    }
  }
];

/**
 * Analyze headers and return results for each defined header.
 * @param {Object} headersMap - key/value pairs of response headers (lowercase keys)
 * @returns {Array} Array of result objects
 */
function analyzeHeaders(headersMap) {
  return HEADER_DEFINITIONS.map(function (def) {
    // Headers may come with different casing; look up case-insensitively
    var headerValue = null;
    var keys = Object.keys(headersMap);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === def.name.toLowerCase()) {
        headerValue = headersMap[keys[i]];
        break;
      }
    }

    var status = def.evaluate(headerValue);

    return {
      name: def.name,
      value: headerValue,
      status: status,
      description: def.description,
      recommendation: def.recommendation,
      weight: def.weight,
      deprecated: def.deprecated || false
    };
  });
}

/**
 * Calculate a letter grade from analysis results.
 * Grade is based on weighted score of present/good headers.
 * @param {Array} results - output from analyzeHeaders()
 * @returns {Object} { grade, score, maxScore }
 */
function calculateGrade(results) {
  var maxScore = 0;
  var score = 0;

  results.forEach(function (r) {
    maxScore += r.weight;
    if (r.status === 'good') {
      score += r.weight;
    } else if (r.status === 'weak') {
      score += Math.round(r.weight * 0.5);
    }
    // 'missing' adds 0
  });

  var pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  var grade;

  if (pct >= 95) grade = 'A+';
  else if (pct >= 85) grade = 'A';
  else if (pct >= 70) grade = 'B';
  else if (pct >= 55) grade = 'C';
  else if (pct >= 40) grade = 'D';
  else grade = 'F';

  return { grade: grade, score: score, maxScore: maxScore, percentage: Math.round(pct) };
}

/**
 * Get the badge color for a given grade.
 * @param {string} grade
 * @returns {string} hex color
 */
function gradeColor(grade) {
  switch (grade) {
    case 'A+': return '#a6e3a1';
    case 'A':  return '#a6e3a1';
    case 'B':  return '#f9e2af';
    case 'C':  return '#fab387';
    case 'D':  return '#f38ba8';
    case 'F':  return '#f38ba8';
    default:   return '#6c7086';
  }
}

/**
 * Get the badge background color (for the extension icon badge).
 * @param {string} grade
 * @returns {string} hex color for badge background
 */
function badgeBgColor(grade) {
  switch (grade) {
    case 'A+': return '#40a02b';
    case 'A':  return '#40a02b';
    case 'B':  return '#df8e1d';
    case 'C':  return '#fe640b';
    case 'D':  return '#d20f39';
    case 'F':  return '#d20f39';
    default:   return '#6c7086';
  }
}

/**
 * Format a plain-text report of header analysis results.
 * @param {string} url - the page URL
 * @param {Object} gradeInfo - output from calculateGrade()
 * @param {Array} results - output from analyzeHeaders()
 * @returns {string} formatted report
 */
function formatReport(url, gradeInfo, results) {
  var lines = [];
  lines.push('Security Headers Report');
  lines.push('URL: ' + url);
  lines.push('Grade: ' + gradeInfo.grade + ' (' + gradeInfo.percentage + '%)');
  lines.push('Score: ' + gradeInfo.score + ' / ' + gradeInfo.maxScore);
  lines.push('');
  lines.push('Headers:');
  lines.push('--------');

  results.forEach(function (r) {
    var statusLabel = r.status === 'good' ? 'PASS' : (r.status === 'weak' ? 'WEAK' : 'MISSING');
    lines.push('');
    lines.push(r.name + ': ' + statusLabel);
    lines.push('  Value: ' + (r.value || '(not set)'));
    if (r.deprecated) lines.push('  Note: This header is deprecated');
  });

  lines.push('');
  lines.push('Generated by Security Headers Chrome Extension');
  return lines.join('\n');
}
