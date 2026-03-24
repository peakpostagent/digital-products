/**
 * Web Vitals Lite — Content script
 * Creates a floating badge using Shadow DOM that displays LCP, CLS, and INP
 * with color-coded ratings. Click to expand for details and copy report.
 *
 * Loaded after lib/web-vitals.js via manifest script ordering.
 */
(function () {
  'use strict';

  /* ── Color constants ───────────────────────────────────────── */

  var COLORS = {
    good:              '#0cce6b',
    'needs-improvement': '#ffa400',
    poor:              '#ff4e42',
    unknown:           '#888888'
  };

  /* ── Shadow DOM host element ───────────────────────────────── */

  var HOST_ID = 'web-vitals-lite-badge';

  // Prevent duplicate injection (e.g. if script runs twice)
  if (document.getElementById(HOST_ID)) return;

  var host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'all:initial; position:fixed; z-index:2147483647; bottom:16px; right:16px;';
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'closed' });

  /* ── Styles inside Shadow DOM ──────────────────────────────── */

  var style = document.createElement('style');
  style.textContent = [
    '*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }',

    /* Badge container */
    '.wvl-badge {',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '  font-size: 12px; line-height: 1.4; color: #fff;',
    '  background: rgba(30, 30, 46, 0.95); border: 1px solid rgba(255,255,255,0.12);',
    '  border-radius: 10px; padding: 8px 12px;',
    '  cursor: pointer; user-select: none;',
    '  box-shadow: 0 4px 20px rgba(0,0,0,0.35);',
    '  transition: all 0.2s ease;',
    '  backdrop-filter: blur(8px);',
    '}',

    '.wvl-badge:hover { border-color: rgba(255,255,255,0.25); }',

    /* Collapsed view — three metric pills in a row */
    '.wvl-row { display: flex; gap: 8px; align-items: center; }',

    '.wvl-pill {',
    '  display: flex; align-items: center; gap: 4px;',
    '  padding: 2px 8px; border-radius: 6px;',
    '  font-size: 11px; font-weight: 600;',
    '  background: rgba(255,255,255,0.08);',
    '}',

    '.wvl-pill-dot {',
    '  width: 7px; height: 7px; border-radius: 50%;',
    '  flex-shrink: 0;',
    '}',

    '.wvl-pill-label { color: rgba(255,255,255,0.5); font-weight: 400; }',
    '.wvl-pill-value { font-variant-numeric: tabular-nums; }',

    /* Expanded detail panel */
    '.wvl-detail { display: none; margin-top: 10px; }',
    '.wvl-badge.expanded .wvl-detail { display: block; }',

    '.wvl-detail-row {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06);',
    '}',
    '.wvl-detail-row:last-child { border-bottom: none; }',

    '.wvl-detail-name { font-size: 12px; color: rgba(255,255,255,0.6); }',
    '.wvl-detail-val { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }',

    '.wvl-detail-threshold {',
    '  font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 1px;',
    '}',

    /* Rating label */
    '.wvl-rating {',
    '  font-size: 10px; font-weight: 600; text-transform: uppercase;',
    '  padding: 1px 6px; border-radius: 4px;',
    '}',
    '.wvl-rating-good { background: rgba(12,206,107,0.2); color: #0cce6b; }',
    '.wvl-rating-needs-improvement { background: rgba(255,164,0,0.2); color: #ffa400; }',
    '.wvl-rating-poor { background: rgba(255,78,66,0.2); color: #ff4e42; }',

    /* Copy button */
    '.wvl-copy {',
    '  display: block; width: 100%; margin-top: 8px;',
    '  padding: 6px; border: none; border-radius: 6px;',
    '  background: rgba(255,255,255,0.1); color: #fff;',
    '  font-size: 11px; font-weight: 600; cursor: pointer;',
    '  text-align: center; transition: background 0.15s;',
    '}',
    '.wvl-copy:hover { background: rgba(255,255,255,0.18); }',

    /* Hidden state */
    '.wvl-badge.hidden { display: none; }'
  ].join('\n');

  shadow.appendChild(style);

  /* ── Build badge DOM ───────────────────────────────────────── */

  var badge = document.createElement('div');
  badge.className = 'wvl-badge';

  // Current metric values — updated by observers
  var metrics = {
    LCP: { value: null, rating: 'unknown' },
    CLS: { value: null, rating: 'unknown' },
    INP: { value: null, rating: 'unknown' }
  };

  /**
   * Formats a metric value for display.
   */
  function formatValue(name, value) {
    if (value === null) return '—';
    if (name === 'LCP') return (value / 1000).toFixed(2) + 's';
    if (name === 'CLS') return value.toFixed(3);
    if (name === 'INP') return Math.round(value) + 'ms';
    return String(value);
  }

  /**
   * Returns the threshold hint text for a metric.
   */
  function thresholdHint(name) {
    var t = WebVitalsLite.THRESHOLDS[name];
    if (name === 'LCP') return 'Good \u2264 ' + (t.good / 1000) + 's  |  Poor > ' + (t.poor / 1000) + 's';
    if (name === 'CLS') return 'Good \u2264 ' + t.good + '  |  Poor > ' + t.poor;
    if (name === 'INP') return 'Good \u2264 ' + t.good + 'ms  |  Poor > ' + t.poor + 'ms';
    return '';
  }

  /**
   * Builds or rebuilds the badge HTML.
   */
  function render() {
    var names = ['LCP', 'CLS', 'INP'];

    // Collapsed pills row
    var pills = '';
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      var m = metrics[n];
      var color = COLORS[m.rating] || COLORS.unknown;
      pills += '<div class="wvl-pill">' +
        '<div class="wvl-pill-dot" style="background:' + color + '"></div>' +
        '<span class="wvl-pill-label">' + n + '</span> ' +
        '<span class="wvl-pill-value">' + formatValue(n, m.value) + '</span>' +
        '</div>';
    }

    // Expanded detail rows
    var details = '';
    for (var j = 0; j < names.length; j++) {
      var nm = names[j];
      var met = metrics[nm];
      var clr = COLORS[met.rating] || COLORS.unknown;
      var ratingClass = 'wvl-rating wvl-rating-' + met.rating;
      var ratingLabel = met.rating === 'needs-improvement' ? 'Needs Work' :
                        met.rating.charAt(0).toUpperCase() + met.rating.slice(1);

      details += '<div class="wvl-detail-row">' +
        '<div>' +
          '<div class="wvl-detail-name">' + fullName(nm) + '</div>' +
          '<div class="wvl-detail-threshold">' + thresholdHint(nm) + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div class="wvl-detail-val" style="color:' + clr + '">' + formatValue(nm, met.value) + '</div>' +
          '<span class="' + ratingClass + '">' + ratingLabel + '</span>' +
        '</div>' +
        '</div>';
    }

    badge.innerHTML =
      '<div class="wvl-row">' + pills + '</div>' +
      '<div class="wvl-detail">' + details +
        '<button class="wvl-copy">Copy Report</button>' +
      '</div>';

    // Attach copy handler
    var copyBtn = badge.querySelector('.wvl-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        copyReport(copyBtn);
      });
    }
  }

  /**
   * Returns the full name for a metric abbreviation.
   */
  function fullName(abbr) {
    var map = { LCP: 'Largest Contentful Paint', CLS: 'Cumulative Layout Shift', INP: 'Interaction to Next Paint' };
    return map[abbr] || abbr;
  }

  /**
   * Copies a plain-text report of current vitals to the clipboard.
   */
  function copyReport(btn) {
    var names = ['LCP', 'CLS', 'INP'];
    var lines = ['Web Vitals Report', 'URL: ' + location.href, ''];
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      var m = metrics[n];
      var ratingLabel = m.rating === 'needs-improvement' ? 'Needs Improvement' :
                        m.rating.charAt(0).toUpperCase() + m.rating.slice(1);
      lines.push(fullName(n) + ' (' + n + '): ' + formatValue(n, m.value) + ' — ' + ratingLabel);
    }

    navigator.clipboard.writeText(lines.join('\n')).then(function () {
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = 'Copy Report'; }, 1500);
    }).catch(function () {
      btn.textContent = 'Copy failed';
      setTimeout(function () { btn.textContent = 'Copy Report'; }, 1500);
    });
  }

  /* ── Toggle expand / collapse ──────────────────────────────── */

  badge.addEventListener('click', function () {
    badge.classList.toggle('expanded');
  });

  /* ── Initial render & attach ───────────────────────────────── */

  render();
  shadow.appendChild(badge);

  /* ── Start observing metrics ───────────────────────────────── */

  function onMetric(data) {
    metrics[data.name] = { value: data.value, rating: data.rating };
    render();

    // Notify the background service worker so popup can access current data
    try {
      chrome.runtime.sendMessage({
        type: 'vitals-update',
        metrics: {
          LCP: { value: metrics.LCP.value, rating: metrics.LCP.rating },
          CLS: { value: metrics.CLS.value, rating: metrics.CLS.rating },
          INP: { value: metrics.INP.value, rating: metrics.INP.rating }
        },
        url: location.href
      });
    } catch (e) {
      // Extension context may be invalidated; ignore silently
    }
  }

  WebVitalsLite.observeLCP(onMetric);
  WebVitalsLite.observeCLS(onMetric);
  WebVitalsLite.observeINP(onMetric);

  /* ── Listen for messages from popup / background ───────────── */

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === 'toggle-badge') {
      badge.classList.toggle('hidden', !msg.visible);
    }
    if (msg.type === 'get-metrics') {
      try {
        chrome.runtime.sendMessage({
          type: 'vitals-update',
          metrics: {
            LCP: { value: metrics.LCP.value, rating: metrics.LCP.rating },
            CLS: { value: metrics.CLS.value, rating: metrics.CLS.rating },
            INP: { value: metrics.INP.value, rating: metrics.INP.rating }
          },
          url: location.href
        });
      } catch (e) { /* ignore */ }
    }
  });

  /* ── Restore badge visibility preference ───────────────────── */

  chrome.storage.local.get({ badgeVisible: true }, function (data) {
    badge.classList.toggle('hidden', !data.badgeVisible);
  });

  // Listen for storage changes (e.g. when popup toggles visibility)
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.badgeVisible) {
      badge.classList.toggle('hidden', !changes.badgeVisible.newValue);
    }
  });
})();
