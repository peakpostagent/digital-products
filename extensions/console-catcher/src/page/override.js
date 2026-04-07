/**
 * Console Catcher — Page Context Override
 *
 * This script runs in the MAIN world (page JS context) via manifest
 * content_scripts with "world": "MAIN". It wraps every console method
 * to intercept calls, then posts a message back to the content script.
 *
 * Using "world": "MAIN" instead of injecting a <script> tag avoids
 * being blocked by Content Security Policy on strict sites.
 */

(function () {
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
})();
