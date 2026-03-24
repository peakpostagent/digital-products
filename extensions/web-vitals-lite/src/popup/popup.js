/**
 * Web Vitals Lite — Popup script
 * Displays the current tab's Web Vitals and lets the user toggle badge visibility.
 */
(function () {
  'use strict';

  var toggleBtn = document.getElementById('toggleBtn');
  var pageUrl   = document.getElementById('pageUrl');

  /* ── Format values for display ─────────────────────────────── */

  function formatValue(name, value) {
    if (value === null || value === undefined) return '\u2014';
    if (name === 'LCP') return (value / 1000).toFixed(2) + 's';
    if (name === 'CLS') return value.toFixed(3);
    if (name === 'INP') return Math.round(value) + 'ms';
    return String(value);
  }

  /* ── Update the popup UI with metric data ──────────────────── */

  function updateMetrics(data) {
    if (!data || !data.metrics) return;

    var names = ['LCP', 'CLS', 'INP'];
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      var m = data.metrics[n];
      if (!m) continue;

      var card   = document.getElementById('card-' + n);
      var valEl  = document.getElementById('val-' + n);
      var rateEl = document.getElementById('rating-' + n);

      // Update value text
      valEl.textContent = formatValue(n, m.value);

      // Update rating label
      var label = 'Waiting\u2026';
      if (m.rating === 'good')              label = 'Good';
      if (m.rating === 'needs-improvement') label = 'Needs Improvement';
      if (m.rating === 'poor')              label = 'Poor';
      rateEl.textContent = label;

      // Update CSS classes
      card.className = 'metric-card ' + m.rating;
      rateEl.className = 'metric-rating ' + m.rating;
    }

    // Show page URL
    if (data.url) {
      pageUrl.textContent = data.url;
    }
  }

  /* ── Fetch metrics from background ─────────────────────────── */

  chrome.runtime.sendMessage({ type: 'get-tab-metrics' }, function (response) {
    if (response && response.data) {
      updateMetrics(response.data);
    }
  });

  // Also listen for live updates while popup is open
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === 'vitals-update') {
      updateMetrics(msg);
    }
  });

  /* ── Toggle badge visibility ───────────────────────────────── */

  chrome.storage.local.get({ badgeVisible: true }, function (data) {
    setToggleState(data.badgeVisible);
  });

  toggleBtn.addEventListener('click', function () {
    chrome.storage.local.get({ badgeVisible: true }, function (data) {
      var newState = !data.badgeVisible;
      chrome.runtime.sendMessage({ type: 'toggle-badge', visible: newState });
      setToggleState(newState);
    });
  });

  /**
   * Updates the toggle button text and styling.
   */
  function setToggleState(visible) {
    if (visible) {
      toggleBtn.textContent = 'Hide Badge';
      toggleBtn.className = 'toggle-btn showing';
    } else {
      toggleBtn.textContent = 'Show Badge';
      toggleBtn.className = 'toggle-btn hiding';
    }
  }
})();
