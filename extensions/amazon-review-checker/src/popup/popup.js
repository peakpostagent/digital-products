/**
 * Amazon Review Checker — Popup script
 *
 * Reads the cached scan result for the currently-active Amazon tab
 * and renders the trust-score breakdown.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    loadActiveScan();
    document.getElementById('rescan-btn').addEventListener('click', requestRescan);
  });

  function loadActiveScan() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab) return showEmpty();

      // Extract ASIN from current URL
      var match = tab.url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
      if (!match) {
        showEmpty('Open an Amazon product page to see its trust score.');
        return;
      }
      var asin = match[1];
      var cacheKey = 'arc:' + asin;
      chrome.storage.local.get([cacheKey], function (cached) {
        var entry = cached[cacheKey];
        if (!entry) {
          showEmpty('Loading product analysis...');
          return;
        }
        render(entry);
      });
    });
  }

  function render(entry) {
    var badge = document.getElementById('grade-badge');
    badge.textContent = entry.grade;
    badge.style.background = window.AmazonGrader
      ? window.AmazonGrader.gradeColor(entry.grade)
      : '#6b7280';

    document.getElementById('product-title').textContent =
      'Product trust analysis';
    document.getElementById('score-line').textContent =
      'Trust score: ' + entry.percentage + '%';

    var container = document.getElementById('breakdown');
    container.innerHTML = '';
    (entry.results || []).forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'heuristic';
      var isPro = h.name === 'Reviewer Profile Diversity';
      row.innerHTML =
        '<span class="heuristic-dot ' + h.status + '"></span>' +
        '<span class="heuristic-name">' + escapeHtml(h.name) + '</span>' +
        (isPro ? '<span class="heuristic-pro">Pro</span>' : '<span></span>') +
        '<span class="heuristic-reason">' + escapeHtml(h.reason || h.description) + '</span>';
      container.appendChild(row);
    });
  }

  function showEmpty(message) {
    document.getElementById('grade-badge').textContent = '--';
    document.getElementById('product-title').textContent =
      message || 'Open an Amazon product page to scan reviews.';
    document.getElementById('score-line').textContent = '';
    document.getElementById('breakdown').innerHTML = '';
  }

  function requestRescan() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab) return;
      var match = tab.url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
      if (!match) return;
      var asin = match[1];
      chrome.storage.local.remove(['arc:' + asin], function () {
        chrome.tabs.reload(tab.id);
        window.close();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
