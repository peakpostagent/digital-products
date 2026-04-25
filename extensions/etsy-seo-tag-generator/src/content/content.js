/**
 * content.js — runs on every etsy.com/listing/* page.
 *
 * Single responsibility: extract the listing's structured data from the page
 * DOM and pass it to the popup / service worker on demand. Does NOT modify
 * the page, does NOT inject UI. Stays passive until the user clicks the
 * extension icon.
 *
 * Why a content script (vs. just popup-only): popups can't read page DOM.
 * Popup messages this content script via chrome.tabs.sendMessage; we reply
 * with the structured listing data.
 */
(function () {
  'use strict';

  /**
   * Extract listing data from the DOM. Etsy's HTML structure changes
   * regularly — keep selectors localized here so future fixes are one place.
   *
   * Returns null if we don't appear to be on a listing page (defensive).
   */
  function extractListing() {
    // Detect listing page by URL pattern; content script match should
    // already guarantee this but double-check.
    if (!/\/listing\/\d+/.test(location.pathname)) return null;

    /* Title — the listing's primary <h1>, sometimes wrapped in a span. */
    var titleEl = document.querySelector('h1[data-buy-box-listing-title]')
      || document.querySelector('h1.wt-text-body-01')
      || document.querySelector('h1');
    var title = titleEl ? titleEl.textContent.trim() : '';

    /* Price — Etsy uses multiple selectors depending on sale state. */
    var priceEl = document.querySelector('p[data-buy-box-region="price"]')
      || document.querySelector('[data-selector="price-only"]')
      || document.querySelector('p.wt-text-title-larger');
    var price = priceEl ? priceEl.textContent.trim() : '';

    /* Description — long text, may be truncated; we capture what's visible. */
    var descEl = document.querySelector('[data-product-details-description-text-content]')
      || document.querySelector('#wt-content-toggle-product-details-read-more');
    var description = descEl ? descEl.textContent.trim() : '';

    /* Tags — Etsy embeds them in a JSON-LD <script> tag for SEO. */
    var tags = [];
    var jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < jsonLdScripts.length; i++) {
      try {
        var data = JSON.parse(jsonLdScripts[i].textContent);
        if (data && Array.isArray(data.keywords)) {
          tags = data.keywords;
          break;
        }
      } catch (_e) {
        /* Malformed JSON-LD — skip and keep looking. */
      }
    }

    /* Category — breadcrumb trail. */
    var breadcrumbEls = document.querySelectorAll('[data-test-id="listing-page-breadcrumbs"] a');
    var breadcrumbs = [];
    breadcrumbEls.forEach(function (el) {
      breadcrumbs.push(el.textContent.trim());
    });

    /* Image count — proxy for listing quality. */
    var imageCount = document.querySelectorAll('[data-carousel-pane] img').length;

    /* Listing ID from URL — used downstream to dedupe and link out. */
    var match = location.pathname.match(/\/listing\/(\d+)/);
    var listingId = match ? match[1] : null;

    return {
      listingId: listingId,
      url: location.href,
      title: title,
      price: price,
      description: description,
      tags: tags,
      breadcrumbs: breadcrumbs,
      imageCount: imageCount,
      capturedAt: Date.now()
    };
  }

  /* Listen for popup → content-script messages. */
  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (msg && msg.type === 'EXTRACT_LISTING') {
      var data = extractListing();
      sendResponse({ ok: true, data: data });
      return true;
    }
    return false;
  });
})();
