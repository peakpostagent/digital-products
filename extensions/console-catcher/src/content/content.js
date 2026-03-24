/**
 * Console Catcher — Content Script
 *
 * This content script runs at document_start (before page scripts).
 * It injects a <script> tag into the page so the override runs in the
 * PAGE's JS context (not the content-script sandbox). The injected
 * code communicates back via window.postMessage, and this content
 * script relays the messages to the background service worker.
 */

/* ── 1. Inject the console-override script into the page ────────── */

(function injectPageScript() {
  const script = document.createElement('script');
  script.textContent = '(' + pageMain.toString() + ')();';
  (document.documentElement || document.head || document.body).appendChild(script);
  script.remove(); // clean up — the code is already running
})();

/**
 * pageMain runs inside the PAGE's JS context.
 * It wraps every console method to intercept calls, then posts
 * a message back to the content script.
 */
function pageMain() {
  /* Levels we care about */
  var LEVELS = ['log', 'warn', 'error', 'info', 'debug'];

  /* Keep references to the real console methods */
  var originals = {};
  LEVELS.forEach(function (level) {
    originals[level] = console[level].bind(console);
  });

  /**
   * Safely convert a value to a string representation.
   * Handles circular references, DOM nodes, symbols, etc.
   */
  function safeStringify(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'symbol') return val.toString();
    if (val instanceof Error) {
      return val.stack || val.message || String(val);
    }
    if (typeof val === 'object') {
      try {
        var seen = [];
        return JSON.stringify(val, function (_key, value) {
          if (typeof value === 'object' && value !== null) {
            if (seen.indexOf(value) !== -1) return '[Circular]';
            seen.push(value);
          }
          if (value instanceof HTMLElement) {
            return '<' + value.tagName.toLowerCase() + '>';
          }
          if (typeof value === 'function') return '[Function]';
          if (typeof value === 'symbol') return value.toString();
          return value;
        }, 2);
      } catch (_e) {
        return String(val);
      }
    }
    return String(val);
  }

  /**
   * Extract a useful stack trace, stripping out our own wrapper frames.
   */
  function getStack() {
    var stack = new Error().stack || '';
    /* Remove the first 3 lines: Error, getStack(), and our wrapper */
    var lines = stack.split('\n');
    return lines.slice(3).join('\n');
  }

  /* Override each console method */
  LEVELS.forEach(function (level) {
    console[level] = function () {
      /* 1. Always call the original so DevTools still works */
      originals[level].apply(console, arguments);

      /* 2. Build a serialisable message string */
      var parts = [];
      for (var i = 0; i < arguments.length; i++) {
        parts.push(safeStringify(arguments[i]));
      }

      /* 3. Post to content script */
      try {
        window.postMessage({
          source: '__console_catcher__',
          level: level,
          message: parts.join(' '),
          stack: level === 'error' ? getStack() : '',
          timestamp: Date.now()
        }, '*');
      } catch (_e) {
        /* silently fail — never break the host page */
      }
    };
  });

  /* Also capture unhandled errors */
  window.addEventListener('error', function (event) {
    try {
      window.postMessage({
        source: '__console_catcher__',
        level: 'error',
        message: event.message || String(event.error),
        stack: (event.error && event.error.stack) || ('at ' + event.filename + ':' + event.lineno + ':' + event.colno),
        timestamp: Date.now()
      }, '*');
    } catch (_e) { /* silent */ }
  });

  /* Capture unhandled promise rejections */
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var msg = (reason instanceof Error) ? reason.message : safeStringify(reason);
    var stack = (reason instanceof Error) ? (reason.stack || '') : '';
    try {
      window.postMessage({
        source: '__console_catcher__',
        level: 'error',
        message: 'Unhandled Promise Rejection: ' + msg,
        stack: stack,
        timestamp: Date.now()
      }, '*');
    } catch (_e) { /* silent */ }
  });
}

/* ── 2. Listen for messages from the injected page script ───────── */

window.addEventListener('message', function (event) {
  /* Only accept messages from our injected script on the same page */
  if (event.source !== window) return;
  if (!event.data || event.data.source !== '__console_catcher__') return;

  /* Forward to background service worker */
  try {
    chrome.runtime.sendMessage({
      type: 'console_log',
      level: event.data.level,
      message: event.data.message,
      stack: event.data.stack || '',
      timestamp: event.data.timestamp,
      url: window.location.href
    });
  } catch (_e) {
    /* Extension context may have been invalidated (page stayed open
       after extension update). Silently ignore. */
  }
});
