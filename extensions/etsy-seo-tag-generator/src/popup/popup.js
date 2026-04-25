/**
 * popup.js — orchestrates the popup UI.
 *
 * Flow:
 *   1. On open, ask the active tab's content script to extract the listing
 *   2. If the active tab isn't on Etsy, show empty state
 *   3. If extraction succeeds, render the listing summary + tags
 *   4. The "Rescan listing" button repeats the extraction
 *
 * What's NOT here yet (intentional — scaffold, not finished extension):
 *   - Backend LLM call for AI tag suggestions (pending Vercel function)
 *   - ExtensionPay paid-tier wiring (clone from MCC Pro pattern when ready)
 *   - Competitor scrape for live DOM diff (Pro feature)
 *   - Tag-copy-to-clipboard helper
 *   - Chrome.storage caching of last scan
 */

(function () {
  'use strict';

  // ---- DOM refs ----
  var emptyState = document.getElementById('empty-state');
  var loadingState = document.getElementById('loading-state');
  var listingSection = document.getElementById('listing-section');
  var listingSummary = document.getElementById('listing-summary');
  var currentTags = document.getElementById('current-tags');
  var btnRescan = document.getElementById('btn-rescan');

  // ---- Utility ----

  /**
   * HTML-escape user-supplied text before injecting it into innerHTML.
   * Etsy listings can contain <, >, & in titles/descriptions.
   */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ---- State transitions ----

  function showEmpty() {
    emptyState.classList.remove('hidden');
    loadingState.classList.add('hidden');
    listingSection.classList.add('hidden');
  }

  function showLoading() {
    emptyState.classList.add('hidden');
    loadingState.classList.remove('hidden');
    listingSection.classList.add('hidden');
  }

  function showListing(data) {
    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    listingSection.classList.remove('hidden');

    /* Summary card */
    var crumbs = (data.breadcrumbs || []).join(' › ');
    listingSummary.innerHTML =
      '<div class="summary-title">' + escapeHtml(data.title || 'Untitled') + '</div>'
      + '<div class="summary-meta">' + escapeHtml(data.price || '—') + '</div>'
      + '<div class="summary-meta">' + escapeHtml(crumbs) + '</div>'
      + '<div class="summary-meta">' + (data.imageCount || 0) + ' images</div>';

    /* Current tags */
    currentTags.innerHTML = '';
    if (data.tags && data.tags.length) {
      data.tags.forEach(function (t) {
        var span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        currentTags.appendChild(span);
      });
    } else {
      currentTags.innerHTML = '<span class="tag">No tags found in listing markup</span>';
    }

    /* Suggested tags are placeholder until backend LLM is wired up.
     * See the popup.html TODO comment near #suggested-tags.
     */
  }

  // ---- Extraction ----

  /**
   * Send EXTRACT_LISTING message to the active tab's content script.
   * Falls back to empty state if the tab isn't on Etsy.
   */
  function extractFromActiveTab() {
    showLoading();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || !tabs.length) { showEmpty(); return; }
      var tab = tabs[0];
      if (!tab.url || !/^https:\/\/(www\.)?etsy\.com\/listing\//.test(tab.url)) {
        showEmpty();
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_LISTING' }, function (response) {
        if (chrome.runtime.lastError) {
          /* Most common cause: content script hasn't injected yet because the
           * tab was opened before the extension installed. User can refresh. */
          showEmpty();
          return;
        }
        if (response && response.ok && response.data) {
          showListing(response.data);
        } else {
          showEmpty();
        }
      });
    });
  }

  // ---- Wire up ----

  if (btnRescan) {
    btnRescan.addEventListener('click', extractFromActiveTab);
  }

  /* Initial scan on popup open. */
  extractFromActiveTab();
})();
