/**
 * Amazon Review Checker — Content Script
 *
 * Runs on amazon.{com,ca,co.uk,de} product pages. Computes a trust grade
 * using lib/scraper.js + lib/grader.js, then injects a floating badge
 * showing the grade A-F on the page. Caches results in chrome.storage.local.
 *
 * The badge uses Shadow DOM to avoid breaking host page styles.
 */

(function () {
  'use strict';

  // Wait for the page to fully render review widgets
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Give Amazon's JS a moment to render review components
    setTimeout(run, 1500);
  }

  function run() {
    try {
      var data = window.AmazonScraper.scrapeProductPage();
      if (!data || !data.productAsin) return;

      // Check cache (key on ASIN)
      var cacheKey = 'arc:' + data.productAsin;
      chrome.storage.local.get([cacheKey], function (cached) {
        var entry = cached[cacheKey];
        var fresh = entry && Date.now() - entry.ts < 1000 * 60 * 60 * 24 * 7; // 7-day cache
        if (fresh) {
          renderBadge(entry.grade, entry.percentage, entry.results);
          return;
        }

        var results = window.AmazonGrader.evaluateReviews(data);
        var summary = window.AmazonGrader.calculateGrade(results);
        var save = {};
        save[cacheKey] = {
          ts: Date.now(),
          grade: summary.grade,
          percentage: summary.percentage,
          results: results,
        };
        chrome.storage.local.set(save);

        renderBadge(summary.grade, summary.percentage, results);
      });
    } catch (err) {
      console.error('[Amazon Review Checker]', err);
    }
  }

  // ---------------------------------------------------------------
  // Badge rendering (Shadow DOM, doesn't pollute host page)
  // ---------------------------------------------------------------
  function renderBadge(grade, percentage, results) {
    if (document.getElementById('arc-host')) return;

    var host = document.createElement('div');
    host.id = 'arc-host';
    host.style.position = 'fixed';
    host.style.bottom = '24px';
    host.style.right = '24px';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);

    var color = window.AmazonGrader.gradeColor(grade);
    var sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML =
      '<style>' +
      '  .badge { all: initial; display: inline-flex; align-items: center; gap: 8px;' +
      '           padding: 10px 14px; border-radius: 999px; cursor: pointer;' +
      '           font: 600 14px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;' +
      '           color: white; background: ' + color + '; box-shadow: 0 6px 16px rgba(0,0,0,.18);' +
      '           transition: transform .12s ease; }' +
      '  .badge:hover { transform: scale(1.04); }' +
      '  .letter { font: 800 18px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif; }' +
      '</style>' +
      '<button class="badge" type="button" title="Click to see trust breakdown">' +
      '  <span class="letter">' + escapeHtml(grade) + '</span>' +
      '  <span>Trust Score: ' + percentage + '%</span>' +
      '</button>';

    sr.querySelector('.badge').addEventListener('click', function () {
      chrome.runtime.sendMessage({ type: 'openPopup' });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
