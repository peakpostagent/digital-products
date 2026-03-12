// parser.js -- Core env file parsing logic for DotEnv Preview
// Exposes the DotEnvPreview global namespace with parsing utilities
// Works in both browser (content script) and Node.js (tests)

(function (root) {
  'use strict';

  // ============================================================
  // Known prefix labels for grouping variables
  // ============================================================
  var PREFIX_LABELS = {
    DB: 'Database (DB_)',
    DATABASE: 'Database (DATABASE_)',
    MONGO: 'Database (MONGO_)',
    REDIS: 'Redis (REDIS_)',
    API: 'API (API_)',
    AWS: 'AWS (AWS_)',
    S3: 'AWS S3 (S3_)',
    SMTP: 'Email (SMTP_)',
    MAIL: 'Email (MAIL_)',
    EMAIL: 'Email (EMAIL_)',
    AUTH: 'Auth (AUTH_)',
    JWT: 'Auth (JWT_)',
    OAUTH: 'Auth (OAUTH_)',
    SESSION: 'Auth (SESSION_)',
    APP: 'Application (APP_)',
    NEXT_PUBLIC: 'Next.js Public (NEXT_PUBLIC_)',
    VITE: 'Vite (VITE_)',
    REACT_APP: 'React (REACT_APP_)',
    VUE_APP: 'Vue (VUE_APP_)',
    NUXT: 'Nuxt (NUXT_)',
    NODE: 'Node (NODE_)',
    PORT: 'Server (PORT)',
    HOST: 'Server (HOST_)',
    SERVER: 'Server (SERVER_)',
    LOG: 'Logging (LOG_)',
    SENTRY: 'Logging (SENTRY_)',
    STRIPE: 'Stripe (STRIPE_)',
    TWILIO: 'Twilio (TWILIO_)',
    SENDGRID: 'SendGrid (SENDGRID_)',
    GOOGLE: 'Google (GOOGLE_)',
    FIREBASE: 'Firebase (FIREBASE_)',
    GITHUB: 'GitHub (GITHUB_)',
    DOCKER: 'Docker (DOCKER_)',
    CI: 'CI/CD (CI_)',
    SSL: 'SSL/TLS (SSL_)',
    TLS: 'SSL/TLS (TLS_)',
    CACHE: 'Cache (CACHE_)',
    QUEUE: 'Queue (QUEUE_)',
    RABBITMQ: 'Queue (RABBITMQ_)',
    AMQP: 'Queue (AMQP_)'
  };

  // Multi-word prefixes that need special detection (order matters: check longer first)
  var MULTI_WORD_PREFIXES = [
    'NEXT_PUBLIC',
    'REACT_APP',
    'VUE_APP'
  ];

  // ============================================================
  // Sensitive key patterns -- keys whose values are likely secrets
  // ============================================================
  var SENSITIVE_KEY_PATTERNS = [
    /key/i,
    /secret/i,
    /token/i,
    /password/i,
    /passwd/i,
    /pass$/i,
    /credential/i,
    /private/i,
    /api_key/i,
    /apikey/i,
    /auth/i,
    /access/i,
    /signing/i,
    /encryption/i,
    /certificate/i,
    /cert$/i
  ];

  // ============================================================
  // Placeholder value patterns -- values that need to be replaced
  // ============================================================
  var PLACEHOLDER_PATTERNS = [
    /^your[_-]/i,
    /^change[-_]?me$/i,
    /^xxx+$/i,
    /^todo$/i,
    /^fixme$/i,
    /^replace[-_]?me$/i,
    /^put[-_]/i,
    /^insert[-_]/i,
    /^<[^>]+>$/,           // <your-key-here>
    /^\[.+\]$/,            // [your-key-here]
    /^\{.+\}$/,            // {your-key-here}
    /^example/i,
    /^placeholder/i,
    /^fill[-_]?in/i,
    /^set[-_]?this/i,
    /^update[-_]?this/i,
    /^sk[-_]test/i,        // Stripe test keys
    /^pk[-_]test/i
  ];

  // ============================================================
  // parseEnvContent(text)
  // Parse raw env file text into structured data.
  //
  // @param {string} text - Raw env file content
  // @returns {Array} Array of parsed line objects:
  //   { type: 'comment'|'variable'|'blank', key, value, rawLine, lineNumber }
  // ============================================================
  function parseEnvContent(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    var lines = text.split(/\r?\n/);
    var result = [];

    for (var i = 0; i < lines.length; i++) {
      var rawLine = lines[i];
      var lineNumber = i + 1;
      var trimmed = rawLine.trim();

      // Blank lines
      if (trimmed === '') {
        result.push({
          type: 'blank',
          key: null,
          value: null,
          rawLine: rawLine,
          lineNumber: lineNumber
        });
        continue;
      }

      // Comment lines (# ...)
      if (trimmed.charAt(0) === '#') {
        result.push({
          type: 'comment',
          key: null,
          value: null,
          rawLine: rawLine,
          lineNumber: lineNumber
        });
        continue;
      }

      // Try to parse as KEY=VALUE
      var parsed = parseKeyValue(trimmed);
      if (parsed) {
        // Handle multiline quoted values
        if (parsed.multilineOpen) {
          var quoteChar = parsed.multilineOpen;
          var valueLines = [parsed.value];
          var j = i + 1;

          // Read lines until we find the closing quote
          while (j < lines.length) {
            var nextLine = lines[j];
            var closingIdx = nextLine.indexOf(quoteChar);
            if (closingIdx !== -1) {
              // Found closing quote
              valueLines.push(nextLine.substring(0, closingIdx));
              i = j; // Skip consumed lines
              break;
            } else {
              valueLines.push(nextLine);
              j++;
            }
          }
          // If we ran off the end without finding a closing quote, just use what we have
          if (j >= lines.length) {
            i = lines.length - 1;
          }
          parsed.value = valueLines.join('\n');
        }

        result.push({
          type: 'variable',
          key: parsed.key,
          value: parsed.value,
          rawLine: rawLine,
          lineNumber: lineNumber
        });
      } else {
        // Line doesn't match any pattern -- treat as comment/unknown
        result.push({
          type: 'comment',
          key: null,
          value: null,
          rawLine: rawLine,
          lineNumber: lineNumber
        });
      }
    }

    return result;
  }

  // ============================================================
  // parseKeyValue(line)
  // Parse a single KEY=VALUE line.
  // Supports: KEY=VALUE, KEY="VALUE", KEY='VALUE', export KEY=VALUE
  //
  // @param {string} line - Trimmed line to parse
  // @returns {object|null} { key, value, multilineOpen } or null
  // ============================================================
  function parseKeyValue(line) {
    // Strip optional "export " prefix
    var work = line;
    if (work.indexOf('export ') === 0) {
      work = work.substring(7).trimStart();
    }

    // Find the first = sign
    var eqIndex = work.indexOf('=');
    if (eqIndex < 1) {
      return null; // No = sign, or = at start
    }

    var key = work.substring(0, eqIndex).trim();

    // Validate key: must be a valid env variable name
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return null;
    }

    var rawValue = work.substring(eqIndex + 1);
    var value = rawValue.trim();

    // Handle empty value
    if (value === '') {
      return { key: key, value: '', multilineOpen: null };
    }

    // Handle double-quoted value
    if (value.charAt(0) === '"') {
      var content = value.substring(1);
      var closeIdx = findClosingQuote(content, '"');
      if (closeIdx === -1) {
        // Multiline: no closing quote on this line
        return { key: key, value: content, multilineOpen: '"' };
      }
      return { key: key, value: content.substring(0, closeIdx), multilineOpen: null };
    }

    // Handle single-quoted value
    if (value.charAt(0) === "'") {
      var content2 = value.substring(1);
      var closeIdx2 = findClosingQuote(content2, "'");
      if (closeIdx2 === -1) {
        // Multiline: no closing quote on this line
        return { key: key, value: content2, multilineOpen: "'" };
      }
      return { key: key, value: content2.substring(0, closeIdx2), multilineOpen: null };
    }

    // Unquoted value -- strip inline comments
    var commentIdx = value.indexOf(' #');
    if (commentIdx !== -1) {
      value = value.substring(0, commentIdx).trim();
    }

    return { key: key, value: value, multilineOpen: null };
  }

  // ============================================================
  // findClosingQuote(str, quoteChar)
  // Find the closing quote, skipping escaped quotes.
  //
  // @param {string} str - String after the opening quote
  // @param {string} quoteChar - The quote character to match
  // @returns {number} Index of closing quote, or -1 if not found
  // ============================================================
  function findClosingQuote(str, quoteChar) {
    for (var i = 0; i < str.length; i++) {
      if (str.charAt(i) === '\\' && i + 1 < str.length) {
        i++; // Skip escaped character
        continue;
      }
      if (str.charAt(i) === quoteChar) {
        return i;
      }
    }
    return -1;
  }

  // ============================================================
  // groupByPrefix(variables)
  // Group an array of variable objects by their detected prefix.
  //
  // @param {Array} variables - Array of { key, value, ... } objects
  // @returns {object} Map of group label to array of variables
  // ============================================================
  function groupByPrefix(variables) {
    var groups = {};

    for (var i = 0; i < variables.length; i++) {
      var v = variables[i];
      var label = detectPrefixLabel(v.key);

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(v);
    }

    return groups;
  }

  // ============================================================
  // detectPrefixLabel(key)
  // Detect the prefix group label for a given key.
  //
  // @param {string} key - Environment variable key
  // @returns {string} Group label (e.g., "Database (DB_)" or "Other")
  // ============================================================
  function detectPrefixLabel(key) {
    if (!key) return 'Other';

    // Check multi-word prefixes first (NEXT_PUBLIC_, REACT_APP_, VUE_APP_)
    for (var m = 0; m < MULTI_WORD_PREFIXES.length; m++) {
      var mp = MULTI_WORD_PREFIXES[m];
      if (key.indexOf(mp + '_') === 0) {
        return PREFIX_LABELS[mp] || mp;
      }
    }

    // Special case: PORT without underscore
    if (key === 'PORT') {
      return PREFIX_LABELS.PORT;
    }

    // Extract the prefix (everything before the first underscore)
    var underscoreIdx = key.indexOf('_');
    if (underscoreIdx < 1) {
      return 'Other';
    }

    var prefix = key.substring(0, underscoreIdx);

    // Check known prefixes
    if (PREFIX_LABELS[prefix]) {
      return PREFIX_LABELS[prefix];
    }

    // Custom prefix: use prefix as label
    return prefix + ' (' + prefix + '_)';
  }

  // ============================================================
  // classifyValue(key, value)
  // Classify whether a value looks sensitive, is a placeholder, or normal.
  //
  // @param {string} key - Environment variable key
  // @param {string} value - Environment variable value
  // @returns {string} 'sensitive' | 'placeholder' | 'normal'
  // ============================================================
  function classifyValue(key, value) {
    // Empty value is a placeholder
    if (value === '' || value === undefined || value === null) {
      return 'placeholder';
    }

    // Check placeholder patterns first
    for (var p = 0; p < PLACEHOLDER_PATTERNS.length; p++) {
      if (PLACEHOLDER_PATTERNS[p].test(value)) {
        return 'placeholder';
      }
    }

    // Check if the key name suggests sensitivity
    var keySuggestsSensitive = false;
    for (var s = 0; s < SENSITIVE_KEY_PATTERNS.length; s++) {
      if (SENSITIVE_KEY_PATTERNS[s].test(key)) {
        keySuggestsSensitive = true;
        break;
      }
    }

    // If the key suggests a secret, classify based on value
    if (keySuggestsSensitive) {
      // If value is a long random-looking string, it's sensitive
      if (looksLikeSecret(value)) {
        return 'sensitive';
      }
      // If the key name is sensitive but the value looks like a simple
      // value (true/false, short word, URL, number), still flag as sensitive
      // unless it looks like a very common non-secret
      if (!looksLikeCommonValue(value)) {
        return 'sensitive';
      }
    }

    // Even if key doesn't suggest sensitivity, check if the value itself
    // looks like a secret (very long random strings, base64 tokens)
    if (looksLikeSecret(value)) {
      return 'sensitive';
    }

    return 'normal';
  }

  // ============================================================
  // looksLikeSecret(value)
  // Heuristic: does this value look like a real API key or token?
  //
  // @param {string} value - The value to check
  // @returns {boolean}
  // ============================================================
  function looksLikeSecret(value) {
    if (!value || typeof value !== 'string') return false;

    // Very long random strings (20+ chars, mix of alphanumeric)
    if (value.length >= 20 && /^[A-Za-z0-9+/=_\-]{20,}$/.test(value)) {
      // Check for entropy: should have mix of cases/digits
      var hasUpper = /[A-Z]/.test(value);
      var hasLower = /[a-z]/.test(value);
      var hasDigit = /[0-9]/.test(value);
      var mixCount = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0);
      if (mixCount >= 2) {
        return true;
      }
    }

    // Starts with common key prefixes
    if (/^(sk|pk|rk|ak)[-_]/.test(value) && value.length > 10) {
      return true;
    }

    // Looks like a JWT (three dot-separated base64 parts)
    if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
      return true;
    }

    // AWS key format
    if (/^AKIA[A-Z0-9]{16}$/.test(value)) {
      return true;
    }

    return false;
  }

  // ============================================================
  // looksLikeCommonValue(value)
  // Check if a value looks like a common non-secret setting.
  //
  // @param {string} value
  // @returns {boolean}
  // ============================================================
  function looksLikeCommonValue(value) {
    if (!value) return true;

    // Boolean values
    if (/^(true|false|yes|no|on|off|0|1)$/i.test(value)) {
      return true;
    }

    // Small numbers (ports, counts)
    if (/^\d{1,5}$/.test(value)) {
      return true;
    }

    // Localhost URLs
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(value)) {
      return true;
    }

    return false;
  }

  // ============================================================
  // detectEnvFile(url, content)
  // Determine if the current page shows an env file.
  //
  // @param {string} url - Current page URL
  // @param {string} content - Page text content
  // @returns {boolean}
  // ============================================================
  function detectEnvFile(url, content) {
    // Check URL for .env patterns
    if (url && detectEnvFileFromUrl(url)) {
      return true;
    }

    // Check content patterns
    if (content && detectEnvFileFromContent(content)) {
      return true;
    }

    return false;
  }

  // ============================================================
  // detectEnvFileFromUrl(url)
  // Check if the URL points to a .env file.
  //
  // @param {string} url - URL to check
  // @returns {boolean}
  // ============================================================
  function detectEnvFileFromUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // Patterns for GitHub/GitLab/Bitbucket blob URLs with env filenames
    var envFilePatterns = [
      /\/\.env$/,
      /\/\.env\./,               // .env.local, .env.production, etc.
      /\/\.env\.example$/,
      /\/\.env\.sample$/,
      /\/\.env\.template$/,
      /\/\.env\.test$/,
      /\/\.env\.testing$/,
      /\/\.env\.local$/,
      /\/\.env\.development$/,
      /\/\.env\.production$/,
      /\/\.env\.staging$/,
      /\/env\.example$/,
      /\/\.flaskenv$/
    ];

    for (var i = 0; i < envFilePatterns.length; i++) {
      if (envFilePatterns[i].test(url)) {
        return true;
      }
    }

    // Raw githubusercontent URLs
    if (url.indexOf('raw.githubusercontent.com') !== -1) {
      // Check filename part
      var parts = url.split('/');
      var filename = parts[parts.length - 1];
      if (filename.indexOf('.env') === 0 || filename === '.flaskenv') {
        return true;
      }
    }

    return false;
  }

  // ============================================================
  // detectEnvFileFromContent(content)
  // Check if text content looks like an env file.
  //
  // @param {string} content - Text content to analyze
  // @returns {boolean}
  // ============================================================
  function detectEnvFileFromContent(content) {
    if (!content || typeof content !== 'string') return false;

    var lines = content.split(/\r?\n/);
    var kvCount = 0;
    var totalNonEmpty = 0;

    for (var i = 0; i < lines.length && i < 50; i++) {
      var trimmed = lines[i].trim();
      if (trimmed === '' || trimmed.charAt(0) === '#') continue;
      totalNonEmpty++;

      // Check if line matches KEY=VALUE pattern
      if (/^(export\s+)?[A-Za-z_][A-Za-z0-9_]*=/.test(trimmed)) {
        kvCount++;
      }
    }

    // If most non-empty lines are KEY=VALUE, it's likely an env file
    if (totalNonEmpty >= 2 && kvCount / totalNonEmpty >= 0.5) {
      return true;
    }

    return false;
  }

  // ============================================================
  // detectValueType(value)
  // Detect what type a value appears to be for syntax highlighting.
  //
  // @param {string} value - The value to classify
  // @returns {string} 'string' | 'number' | 'boolean' | 'url' | 'empty'
  // ============================================================
  function detectValueType(value) {
    if (value === '' || value === undefined || value === null) {
      return 'empty';
    }

    // Boolean values
    if (/^(true|false|yes|no|on|off)$/i.test(value)) {
      return 'boolean';
    }

    // Pure numbers (including ports, etc.)
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return 'number';
    }

    // URLs
    if (/^https?:\/\//i.test(value)) {
      return 'url';
    }

    return 'string';
  }

  // ============================================================
  // Expose the DotEnvPreview namespace
  // ============================================================
  var DotEnvPreview = {
    parseEnvContent: parseEnvContent,
    groupByPrefix: groupByPrefix,
    classifyValue: classifyValue,
    detectEnvFile: detectEnvFile,
    detectEnvFileFromUrl: detectEnvFileFromUrl,
    detectEnvFileFromContent: detectEnvFileFromContent,
    detectValueType: detectValueType,
    detectPrefixLabel: detectPrefixLabel,

    // Internal helpers exposed for testing
    _parseKeyValue: parseKeyValue,
    _looksLikeSecret: looksLikeSecret,
    _looksLikeCommonValue: looksLikeCommonValue
  };

  // Export for both browser and Node.js environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DotEnvPreview;
  } else {
    root.DotEnvPreview = DotEnvPreview;
  }

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
