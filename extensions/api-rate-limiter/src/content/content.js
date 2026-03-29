/**
 * API Rate Limiter — Content Script
 *
 * Runs at document_start (before page scripts). Injects a <script>
 * tag into the page context to wrap window.fetch and XMLHttpRequest
 * so we can intercept requests and simulate rate limiting.
 *
 * Communication flow:
 *   Page script <-> postMessage <-> Content script <-> chrome.runtime.sendMessage <-> Background
 */

/* ── 1. Load rules from background, then inject ──────────────── */

var currentRules = [];

/**
 * Fetch rules from the background service worker,
 * then inject the interception script into the page.
 */
function init() {
  try {
    chrome.runtime.sendMessage({ type: 'get_rules' }, function (response) {
      if (response && response.rules) {
        currentRules = response.rules;
      }
      injectPageScript(currentRules);
    });
  } catch (_e) {
    /* Extension context may be invalidated */
    injectPageScript([]);
  }
}

init();

/* ── 2. Inject the fetch/XHR override script into the page ───── */

/**
 * Inject a script element into the page context that overrides
 * fetch and XMLHttpRequest to enforce rate limiting rules.
 */
function injectPageScript(rules) {
  var script = document.createElement('script');
  /* Pass rules as a data attribute so the page script can read them */
  script.dataset.rules = JSON.stringify(rules);
  script.textContent = '(' + pageMain.toString() + ')(document.currentScript.dataset.rules);';
  (document.documentElement || document.head || document.body).appendChild(script);
  script.remove();
}

/**
 * pageMain runs inside the PAGE's JS context.
 * It wraps fetch() and XMLHttpRequest to count requests per rule
 * and return mock error responses when limits are exceeded.
 */
function pageMain(rulesJson) {
  /* Parse rules passed from the content script */
  var rules = [];
  try {
    rules = JSON.parse(rulesJson) || [];
  } catch (_e) {
    rules = [];
  }

  /* Request count tracking: { ruleId: [timestamps] } */
  var requestCounts = {};

  /**
   * Check if a URL matches a rule's glob-like pattern.
   * Supports * as wildcard (matches any characters).
   */
  function matchesPattern(url, pattern) {
    if (!pattern) return false;
    /* Convert glob pattern to regex */
    var escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    var regex = escaped.replace(/\*/g, '.*');
    try {
      return new RegExp('^' + regex + '$', 'i').test(url) ||
             new RegExp(regex, 'i').test(url);
    } catch (_e) {
      return url.indexOf(pattern.replace(/\*/g, '')) !== -1;
    }
  }

  /**
   * Find the first matching enabled rule for a given URL.
   */
  function findMatchingRule(url) {
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].enabled && matchesPattern(url, rules[i].pattern)) {
        return rules[i];
      }
    }
    return null;
  }

  /**
   * Check if a rule's rate limit has been exceeded.
   * Cleans up old timestamps outside the window.
   * Returns true if throttled.
   */
  function isThrottled(rule) {
    var id = rule.id;
    var now = Date.now();
    var windowMs = (rule.windowSeconds || 60) * 1000;

    if (!requestCounts[id]) {
      requestCounts[id] = [];
    }

    /* Remove timestamps outside the window */
    requestCounts[id] = requestCounts[id].filter(function (ts) {
      return (now - ts) < windowMs;
    });

    /* Check count against limit */
    return requestCounts[id].length >= (rule.maxRequests || 10);
  }

  /**
   * Record a request timestamp for a rule.
   */
  function recordRequest(ruleId) {
    if (!requestCounts[ruleId]) {
      requestCounts[ruleId] = [];
    }
    requestCounts[ruleId].push(Date.now());
  }

  /**
   * Build a mock error response body based on rule config.
   */
  function buildErrorBody(rule) {
    if (rule.customBody) {
      return rule.customBody;
    }
    return JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again later.',
      retryAfter: rule.retryAfter || 60
    });
  }

  /**
   * Post a request event back to the content script for logging.
   */
  function postEvent(url, method, rule, throttled, statusCode) {
    try {
      window.postMessage({
        source: '__api_rate_limiter__',
        type: 'request_event',
        url: url,
        method: method,
        ruleId: rule ? rule.id : null,
        rulePattern: rule ? rule.pattern : '',
        throttled: throttled,
        statusCode: statusCode,
        timestamp: Date.now()
      }, '*');
    } catch (_e) { /* silent */ }
  }

  /* ── Override fetch() ──────────────────────────────────────── */

  var originalFetch = window.fetch;

  window.fetch = function (input, init) {
    /* Determine the URL */
    var url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input && input.url) {
      url = input.url;
    } else if (input instanceof URL) {
      url = input.href;
    }

    /* Resolve relative URLs */
    try {
      url = new URL(url, window.location.href).href;
    } catch (_e) { /* keep as-is */ }

    var method = (init && init.method) ? init.method.toUpperCase() : 'GET';

    /* Check against rules */
    var rule = findMatchingRule(url);

    if (rule) {
      if (isThrottled(rule)) {
        /* Rate limit exceeded — return mock error */
        var statusCode = rule.statusCode || 429;
        var retryAfter = String(rule.retryAfter || 60);
        var body = buildErrorBody(rule);

        postEvent(url, method, rule, true, statusCode);

        return Promise.resolve(new Response(body, {
          status: statusCode,
          statusText: statusCode === 429 ? 'Too Many Requests' : 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter,
            'X-Rate-Limiter': 'simulated'
          }
        }));
      }

      /* Under limit — record and pass through */
      recordRequest(rule.id);
      postEvent(url, method, rule, false, 0);
    }

    /* Call original fetch */
    return originalFetch.apply(window, arguments);
  };

  /* ── Override XMLHttpRequest ───────────────────────────────── */

  var OriginalXHR = window.XMLHttpRequest;
  var originalOpen = OriginalXHR.prototype.open;
  var originalSend = OriginalXHR.prototype.send;

  OriginalXHR.prototype.open = function (method, url) {
    /* Store method and url for later use in send() */
    this.__rl_method = method ? method.toUpperCase() : 'GET';
    this.__rl_url = url;

    /* Resolve relative URLs */
    try {
      this.__rl_url = new URL(url, window.location.href).href;
    } catch (_e) { /* keep as-is */ }

    return originalOpen.apply(this, arguments);
  };

  OriginalXHR.prototype.send = function () {
    var xhr = this;
    var url = xhr.__rl_url || '';
    var method = xhr.__rl_method || 'GET';

    /* Check against rules */
    var rule = findMatchingRule(url);

    if (rule && isThrottled(rule)) {
      /* Rate limit exceeded — simulate error response */
      var statusCode = rule.statusCode || 429;
      var body = buildErrorBody(rule);

      postEvent(url, method, rule, true, statusCode);

      /* Override the XHR properties to simulate the response */
      Object.defineProperty(xhr, 'status', { get: function () { return statusCode; } });
      Object.defineProperty(xhr, 'statusText', {
        get: function () { return statusCode === 429 ? 'Too Many Requests' : 'Service Unavailable'; }
      });
      Object.defineProperty(xhr, 'responseText', { get: function () { return body; } });
      Object.defineProperty(xhr, 'response', { get: function () { return body; } });
      Object.defineProperty(xhr, 'readyState', { get: function () { return 4; } });
      Object.defineProperty(xhr, 'getAllResponseHeaders', {
        value: function () {
          return 'content-type: application/json\r\nretry-after: ' +
                 (rule.retryAfter || 60) + '\r\nx-rate-limiter: simulated\r\n';
        }
      });
      Object.defineProperty(xhr, 'getResponseHeader', {
        value: function (name) {
          var n = name.toLowerCase();
          if (n === 'content-type') return 'application/json';
          if (n === 'retry-after') return String(rule.retryAfter || 60);
          if (n === 'x-rate-limiter') return 'simulated';
          return null;
        }
      });

      /* Fire readystatechange and load events asynchronously */
      setTimeout(function () {
        if (typeof xhr.onreadystatechange === 'function') {
          xhr.onreadystatechange(new Event('readystatechange'));
        }
        xhr.dispatchEvent(new Event('readystatechange'));
        if (typeof xhr.onload === 'function') {
          xhr.onload(new ProgressEvent('load'));
        }
        xhr.dispatchEvent(new ProgressEvent('load'));
        if (typeof xhr.onloadend === 'function') {
          xhr.onloadend(new ProgressEvent('loadend'));
        }
        xhr.dispatchEvent(new ProgressEvent('loadend'));
      }, 0);

      return; /* Don't call originalSend */
    }

    if (rule) {
      /* Under limit — record and pass through */
      recordRequest(rule.id);
      postEvent(url, method, rule, false, 0);
    }

    return originalSend.apply(this, arguments);
  };

  /* ── Listen for rule updates from the content script ─────── */

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== '__api_rate_limiter_ctrl__') return;

    if (event.data.type === 'update_rules') {
      rules = event.data.rules || [];
    }

    if (event.data.type === 'reset_counts') {
      requestCounts = {};
    }
  });
}

/* ── 3. Listen for messages from the injected page script ─────── */

window.addEventListener('message', function (event) {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== '__api_rate_limiter__') return;

  /* Forward request events to the background */
  if (event.data.type === 'request_event') {
    try {
      chrome.runtime.sendMessage({
        type: 'request_event',
        url: event.data.url,
        method: event.data.method,
        ruleId: event.data.ruleId,
        rulePattern: event.data.rulePattern,
        throttled: event.data.throttled,
        statusCode: event.data.statusCode,
        timestamp: event.data.timestamp
      });
    } catch (_e) { /* Extension context may be invalidated */ }
  }
});

/* ── 4. Listen for rule updates from the background ───────────── */

try {
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === 'rules_updated') {
      /* Forward updated rules to the page script */
      window.postMessage({
        source: '__api_rate_limiter_ctrl__',
        type: 'update_rules',
        rules: msg.rules || []
      }, '*');
    }

    if (msg.type === 'reset_counts') {
      /* Forward reset to the page script */
      window.postMessage({
        source: '__api_rate_limiter_ctrl__',
        type: 'reset_counts'
      }, '*');
    }
  });
} catch (_e) { /* silent */ }
