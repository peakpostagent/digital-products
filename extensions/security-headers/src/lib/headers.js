/**
 * Security Headers — header definitions, grading, and analysis logic.
 *
 * Each header has a name, description, recommendation, severity, weight,
 * detailed learning material, a real-world breach example, and a set of
 * per-stack fix snippets (Nginx, Apache, Express, Cloudflare).
 */

/**
 * Definitions for all security-relevant HTTP response headers.
 * Each entry includes:
 *  - name:          The header name (case-insensitive matching)
 *  - description:   Short one-line summary of what the header does
 *  - recommendation: What value to set
 *  - severity:      'critical' | 'important' | 'optional'
 *  - weight:        Points toward the overall grade (higher = more important)
 *  - deprecated:    Optional flag for headers that are no longer recommended
 *  - attack:        What attack the header prevents
 *  - breach:        A real-world incident / example
 *  - evaluate:      Function that returns 'good', 'weak', or 'missing'
 *  - snippets:      { nginx, apache, express, cloudflare } sample configs
 */
const HEADER_DEFINITIONS = [
  {
    name: 'Content-Security-Policy',
    description: 'Controls which resources the browser is allowed to load. Prevents XSS, data injection, and clickjacking attacks.',
    recommendation: "Set a restrictive policy. Start with default-src 'self' and add sources as needed.",
    severity: 'critical',
    weight: 15,
    attack: 'Cross-Site Scripting (XSS), data injection, and clickjacking. A strict CSP stops attacker-injected scripts from executing even if an XSS vulnerability exists in your code.',
    breach: "British Airways 2018: attackers modified 22 lines of JavaScript on the payment page and stole 380,000 card records. A strict Content-Security-Policy would have blocked the attacker's exfiltration domain.",
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.includes("'unsafe-inline'") && value.includes("'unsafe-eval'")) return 'weak';
      return 'good';
    },
    snippets: {
      nginx: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\" always;",
      apache: "Header always set Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('Content-Security-Policy', \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\");\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: Content-Security-Policy\n// Value: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    }
  },
  {
    name: 'Strict-Transport-Security',
    description: 'Forces browsers to use HTTPS for all future requests to this domain. Prevents protocol downgrade attacks.',
    recommendation: 'max-age=31536000; includeSubDomains; preload',
    severity: 'critical',
    weight: 15,
    attack: 'Man-in-the-middle (MITM) and SSL stripping attacks. Without HSTS, an attacker on a shared Wi-Fi network can downgrade a user from HTTPS to HTTP and read every request.',
    breach: 'Firesheep (2010) showed anyone could hijack Facebook, Twitter, and Gmail sessions on public Wi-Fi by sniffing cookies over HTTP. HSTS was created to force HTTPS on every request.',
    evaluate: function (value) {
      if (!value) return 'missing';
      var match = value.match(/max-age=(\d+)/i);
      if (match && parseInt(match[1], 10) < 2592000) return 'weak';
      return 'good';
    },
    snippets: {
      nginx: "add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;",
      apache: "Header always set Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');\n  next();\n});",
      cloudflare: "// SSL/TLS > Edge Certificates > HTTP Strict Transport Security (HSTS)\n// Enable HSTS, Max-Age: 12 months, Include subdomains: ON, Preload: ON"
    }
  },
  {
    name: 'X-Content-Type-Options',
    description: 'Prevents browsers from MIME-sniffing a response away from the declared content type. Stops script injection via content type confusion.',
    recommendation: 'nosniff',
    severity: 'important',
    weight: 10,
    attack: 'MIME-sniffing attacks. If a user uploads a file labeled as an image but containing HTML/JS, old browsers might execute it as a script. nosniff prevents that.',
    breach: "Older IE versions would 'sniff' uploaded files. Attackers used this to run scripts hosted on trusted image CDNs. Setting X-Content-Type-Options: nosniff became the standard mitigation.",
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.toLowerCase().trim() === 'nosniff') return 'good';
      return 'weak';
    },
    snippets: {
      nginx: "add_header X-Content-Type-Options \"nosniff\" always;",
      apache: "Header always set X-Content-Type-Options \"nosniff\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('X-Content-Type-Options', 'nosniff');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: X-Content-Type-Options\n// Value: nosniff"
    }
  },
  {
    name: 'X-Frame-Options',
    description: 'Controls whether the page can be embedded in an iframe. Prevents clickjacking attacks.',
    recommendation: 'DENY or SAMEORIGIN',
    severity: 'critical',
    weight: 10,
    attack: "Clickjacking. An attacker embeds your site in an invisible iframe over a decoy UI, tricking users into clicking buttons on your page (e.g. 'Transfer funds' or 'Delete account').",
    breach: 'Twitter 2009: a clickjacking worm used hidden iframes to trick users into tweeting a malicious link. Setting X-Frame-Options: DENY or a CSP frame-ancestors directive prevents this class of attack.',
    evaluate: function (value) {
      if (!value) return 'missing';
      var v = value.toUpperCase().trim();
      if (v === 'DENY' || v === 'SAMEORIGIN') return 'good';
      return 'weak';
    },
    snippets: {
      nginx: "add_header X-Frame-Options \"DENY\" always;",
      apache: "Header always set X-Frame-Options \"DENY\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('X-Frame-Options', 'DENY');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: X-Frame-Options\n// Value: DENY"
    }
  },
  {
    name: 'X-XSS-Protection',
    description: 'Legacy XSS filter built into older browsers. Deprecated in modern browsers but still checked for backward compatibility.',
    recommendation: '0 (disable) — modern CSP is preferred. Older recommendation was 1; mode=block.',
    severity: 'optional',
    weight: 3,
    deprecated: true,
    attack: 'Legacy reflected-XSS protection for pre-2019 browsers. Modern browsers ignore this header — CSP is the correct replacement.',
    breach: "Security researchers showed the XSS filter itself could be abused as an attack vector in some configurations, which is why modern guidance is '0' (off).",
    evaluate: function (value) {
      if (!value) return 'missing';
      var v = value.trim();
      if (v === '0' || v === '1; mode=block') return 'good';
      return 'weak';
    },
    snippets: {
      nginx: "add_header X-XSS-Protection \"0\" always;",
      apache: "Header always set X-XSS-Protection \"0\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('X-XSS-Protection', '0');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: X-XSS-Protection\n// Value: 0"
    }
  },
  {
    name: 'Referrer-Policy',
    description: 'Controls how much referrer information is included with requests. Protects user privacy when navigating away.',
    recommendation: 'strict-origin-when-cross-origin or no-referrer',
    severity: 'important',
    weight: 8,
    attack: 'Sensitive URL leakage to third parties. If your app puts tokens or internal IDs in URLs, the Referer header can leak them to every external site a user visits.',
    breach: 'Multiple incidents: password-reset tokens and internal page IDs have leaked to analytics providers and ad networks via the Referer header because apps did not restrict the Referrer-Policy.',
    evaluate: function (value) {
      if (!value) return 'missing';
      var good = ['no-referrer', 'strict-origin', 'strict-origin-when-cross-origin', 'same-origin'];
      if (good.indexOf(value.toLowerCase().trim()) !== -1) return 'good';
      if (value.toLowerCase().trim() === 'unsafe-url') return 'weak';
      return 'good';
    },
    snippets: {
      nginx: "add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;",
      apache: "Header always set Referrer-Policy \"strict-origin-when-cross-origin\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: Referrer-Policy\n// Value: strict-origin-when-cross-origin"
    }
  },
  {
    name: 'Permissions-Policy',
    description: 'Controls which browser features (camera, mic, geolocation, etc.) the page and its iframes can use.',
    recommendation: 'Restrict unused features. Example: camera=(), microphone=(), geolocation=()',
    severity: 'important',
    weight: 8,
    attack: 'Unauthorized access to powerful browser APIs via compromised iframes or scripts. A malicious third-party script could request the camera, mic, or location if you do not explicitly deny these features.',
    breach: "Third-party ad iframes have been observed attempting to use user sensors. Permissions-Policy lets you disable any feature your site does not need, shrinking the attack surface.",
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.length < 10) return 'weak';
      return 'good';
    },
    snippets: {
      nginx: "add_header Permissions-Policy \"camera=(), microphone=(), geolocation=(), payment=(), usb=()\" always;",
      apache: "Header always set Permissions-Policy \"camera=(), microphone=(), geolocation=(), payment=(), usb=()\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: Permissions-Policy\n// Value: camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    }
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    description: 'Isolates the browsing context from cross-origin windows. Prevents Spectre-style side-channel attacks.',
    recommendation: 'same-origin',
    severity: 'optional',
    weight: 7,
    attack: 'Cross-origin window attacks and Spectre-style side-channels. Without COOP, a window.opener reference can allow cross-origin access to the page that opened it.',
    breach: "Tabnabbing attacks (rel='noopener' miss): opened windows could navigate the opener to phishing pages. COOP enforces process isolation so this class of attack cannot succeed.",
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.toLowerCase().trim() === 'same-origin') return 'good';
      if (value.toLowerCase().trim() === 'same-origin-allow-popups') return 'good';
      return 'weak';
    },
    snippets: {
      nginx: "add_header Cross-Origin-Opener-Policy \"same-origin\" always;",
      apache: "Header always set Cross-Origin-Opener-Policy \"same-origin\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: Cross-Origin-Opener-Policy\n// Value: same-origin"
    }
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    description: 'Controls which origins can read the resource. Prevents unauthorized cross-origin reads.',
    recommendation: 'same-origin or same-site',
    severity: 'optional',
    weight: 7,
    attack: 'Spectre-class speculative execution reads and unauthorized cross-origin resource loads. CORP lets the server say exactly which origins are allowed to embed or read each resource.',
    breach: 'Spectre (2018) proved that cross-origin resources could be read via CPU speculative execution. CORP was part of the browser response to give servers a hard switch against such loads.',
    evaluate: function (value) {
      if (!value) return 'missing';
      var v = value.toLowerCase().trim();
      if (v === 'same-origin' || v === 'same-site') return 'good';
      if (v === 'cross-origin') return 'weak';
      return 'weak';
    },
    snippets: {
      nginx: "add_header Cross-Origin-Resource-Policy \"same-origin\" always;",
      apache: "Header always set Cross-Origin-Resource-Policy \"same-origin\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: Cross-Origin-Resource-Policy\n// Value: same-origin"
    }
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    description: 'Requires cross-origin resources to explicitly grant permission to be loaded. Enables SharedArrayBuffer and high-resolution timers.',
    recommendation: 'require-corp',
    severity: 'optional',
    weight: 7,
    attack: 'Side-channel timing attacks that rely on shared browser memory. COEP + COOP together enable cross-origin isolation, which blocks these attacks and unlocks powerful APIs like SharedArrayBuffer.',
    breach: 'Spectre (2018) forced browsers to restrict SharedArrayBuffer. COEP is the opt-in signal that a page is ready for cross-origin isolation.',
    evaluate: function (value) {
      if (!value) return 'missing';
      if (value.toLowerCase().trim() === 'require-corp') return 'good';
      if (value.toLowerCase().trim() === 'credentialless') return 'good';
      return 'weak';
    },
    snippets: {
      nginx: "add_header Cross-Origin-Embedder-Policy \"require-corp\" always;",
      apache: "Header always set Cross-Origin-Embedder-Policy \"require-corp\"",
      express: "app.use((req, res, next) => {\n  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');\n  next();\n});",
      cloudflare: "// Transform Rule > Response Header\n// Header name: Cross-Origin-Embedder-Policy\n// Value: require-corp"
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
      severity: def.severity,
      deprecated: def.deprecated || false,
      attack: def.attack,
      breach: def.breach,
      snippets: def.snippets
    };
  });
}

/**
 * Weight multipliers by severity — applied on top of each header's base weight
 * so that "critical" problems hurt the grade more than "optional" ones.
 */
var SEVERITY_MULTIPLIER = {
  critical: 1.5,
  important: 1.0,
  optional: 0.6
};

/**
 * Calculate a letter grade from analysis results.
 * Severity is factored into the weighted score — critical misses hurt more.
 * @param {Array} results - output from analyzeHeaders()
 * @returns {Object} { grade, score, maxScore, percentage, criticalIssues, importantIssues, optionalIssues }
 */
function calculateGrade(results) {
  var maxScore = 0;
  var score = 0;
  var criticalIssues = 0;
  var importantIssues = 0;
  var optionalIssues = 0;

  results.forEach(function (r) {
    var mult = SEVERITY_MULTIPLIER[r.severity] || 1.0;
    var weighted = r.weight * mult;
    maxScore += weighted;

    if (r.status === 'good') {
      score += weighted;
    } else if (r.status === 'weak') {
      score += weighted * 0.5;
    }

    // Count issues by severity (weak or missing — and ignore deprecated headers).
    if (!r.deprecated && (r.status === 'missing' || r.status === 'weak')) {
      if (r.severity === 'critical') criticalIssues++;
      else if (r.severity === 'important') importantIssues++;
      else optionalIssues++;
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
    importantIssues: importantIssues,
    optionalIssues: optionalIssues
  };
}

/**
 * Get the badge color for a given grade (popup UI).
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
  lines.push('Critical issues: ' + gradeInfo.criticalIssues);
  lines.push('Important issues: ' + gradeInfo.importantIssues);
  lines.push('Optional issues: ' + gradeInfo.optionalIssues);
  lines.push('');
  lines.push('Headers:');
  lines.push('--------');

  results.forEach(function (r) {
    var statusLabel = r.status === 'good' ? 'PASS' : (r.status === 'weak' ? 'WEAK' : 'MISSING');
    lines.push('');
    lines.push(r.name + ' [' + (r.severity || 'optional').toUpperCase() + ']: ' + statusLabel);
    lines.push('  Value: ' + (r.value || '(not set)'));
    if (r.deprecated) lines.push('  Note: This header is deprecated');
  });

  lines.push('');
  lines.push('Generated by Security Headers Chrome Extension');
  return lines.join('\n');
}
