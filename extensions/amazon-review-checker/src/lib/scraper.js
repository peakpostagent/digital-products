/**
 * Amazon Review Checker — DOM scraper
 *
 * Robust selectors for amazon.com / amazon.ca / amazon.co.uk / amazon.de
 * product pages. Returns the structured `reviewData` shape consumed by
 * lib/grader.js (see that file's evaluateReviews docstring).
 *
 * Design principles:
 *  - Multiple selectors per data point; bail to null on any failure rather
 *    than throwing — Amazon changes selectors quarterly.
 *  - Never scrape what the user can't already see (we only read the
 *    rendered DOM, never fetch a separate API).
 *  - All counts are integers; all timestamps are unix ms.
 */

(function (root) {
  'use strict';

  // ---------------------------------------------------------------
  // Total review count + verified count
  // ---------------------------------------------------------------
  function scrapeReviewCounts() {
    // Total review count appears in several places. Use whichever resolves first.
    var totalReviews = null;
    var verifiedReviews = null;

    var totalEl =
      document.querySelector('[data-hook="total-review-count"]') ||
      document.querySelector('#acrCustomerReviewText') ||
      document.querySelector('a[href*="reviews"][href*="ref=acr"]');

    if (totalEl) {
      var m = (totalEl.textContent || '').replace(/[,.\s]/g, '').match(/(\d+)/);
      if (m) totalReviews = parseInt(m[1], 10);
    }

    // Verified-purchase ratio is hard from product page alone; we estimate
    // from the visible review cards (only ~8 are shown). Pro tier walks
    // pagination for an accurate count.
    var reviewCards = document.querySelectorAll('[data-hook="review"]');
    if (reviewCards.length > 0) {
      var verifiedOnPage = 0;
      reviewCards.forEach(function (card) {
        if (card.querySelector('[data-hook="avp-badge"]')) verifiedOnPage++;
      });
      // Extrapolate to total (rough estimate)
      var pageRatio = verifiedOnPage / reviewCards.length;
      verifiedReviews = totalReviews ? Math.round(totalReviews * pageRatio) : verifiedOnPage;
    }

    return { totalReviews: totalReviews, verifiedReviews: verifiedReviews, sampledCount: reviewCards.length };
  }

  // ---------------------------------------------------------------
  // Star histogram (5,4,3,2,1)
  // ---------------------------------------------------------------
  function scrapeStarHistogram() {
    var hist = [0, 0, 0, 0, 0];
    // Amazon's rating histogram bars
    var rows = document.querySelectorAll(
      '[data-hook="cm_cr_histogram"] li, #cm_cr_dp_d_rating_histogram tr, [data-hook="histogram-popover"] tr'
    );
    if (rows.length === 0) {
      // Modern layout
      rows = document.querySelectorAll('a[href*="filterByStar"]');
    }

    rows.forEach(function (row) {
      var label = (row.textContent || '').match(/(\d)\s*star/i);
      var pctMatch = (row.textContent || '').match(/(\d+)\s*%/);
      if (label && pctMatch) {
        var star = parseInt(label[1], 10);
        var pct = parseInt(pctMatch[1], 10);
        if (star >= 1 && star <= 5) hist[star - 1] = pct;
      }
    });

    // If we have percentages, convert to counts using total reviews
    var counts = scrapeReviewCounts();
    if (counts.totalReviews && hist.some(function (v) { return v > 0; })) {
      return hist.map(function (pct) { return Math.round((pct / 100) * counts.totalReviews); });
    }
    return null;
  }

  // ---------------------------------------------------------------
  // Review timestamps from visible review cards
  // ---------------------------------------------------------------
  function scrapeTimestamps() {
    var timestamps = [];
    var cards = document.querySelectorAll('[data-hook="review-date"]');
    cards.forEach(function (el) {
      var text = (el.textContent || '').trim();
      // Format examples:
      //   "Reviewed in the United States on March 3, 2025"
      //   "Reviewed in Canada on January 12, 2024"
      var m = text.match(/on\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/);
      if (m) {
        var d = new Date(m[1]);
        if (!isNaN(d)) timestamps.push(d.getTime());
      }
    });
    return timestamps.length > 0 ? timestamps : null;
  }

  // ---------------------------------------------------------------
  // Repeated phrasing detection (n-gram overlap across reviews)
  // ---------------------------------------------------------------
  function scrapeCommonPhrases() {
    var bodies = document.querySelectorAll('[data-hook="review-body"]');
    if (bodies.length < 3) return null;

    // Build trigram histogram
    var trigrams = {};
    var distinctiveCount = 0;
    bodies.forEach(function (el) {
      var text = (el.textContent || '').toLowerCase().replace(/[^a-z\s]/g, ' ');
      var words = text.split(/\s+/).filter(Boolean);
      var seenInThisReview = new Set();
      for (var i = 0; i < words.length - 2; i++) {
        var gram = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
        // Skip very common ones
        if (gram.match(/^(this|the|a|i|it|and|so|but|to|for)\b/)) continue;
        if (seenInThisReview.has(gram)) continue;
        seenInThisReview.add(gram);
        trigrams[gram] = (trigrams[gram] || 0) + 1;
      }
    });

    // Distinctive = a trigram appearing in 3+ reviews (out of typically 8 visible)
    Object.keys(trigrams).forEach(function (g) {
      if (trigrams[g] >= 3) distinctiveCount++;
    });

    return { suspiciousCount: distinctiveCount };
  }

  // ---------------------------------------------------------------
  // Reviews with photos / video count
  // ---------------------------------------------------------------
  function scrapePhotoCount() {
    var withPhotos = document.querySelectorAll('[data-hook="review-image-tile"]').length;
    return withPhotos;
  }

  // ---------------------------------------------------------------
  // Main entry — returns the full reviewData shape for grader.js
  // ---------------------------------------------------------------
  function scrapeProductPage() {
    var counts = scrapeReviewCounts();
    return {
      totalReviews: counts.totalReviews,
      verifiedReviews: counts.verifiedReviews,
      timestamps: scrapeTimestamps(),
      starHistogram: scrapeStarHistogram(),
      commonPhrases: scrapeCommonPhrases(),
      reviewsWithPhotos: scrapePhotoCount(),
      productTitle: getProductTitle(),
      productAsin: getAsin(),
      reviewerProfiles: null, // Pro-tier — populated by background.js sampling pass
    };
  }

  function getProductTitle() {
    var el = document.querySelector('#productTitle, #title');
    return el ? el.textContent.trim() : null;
  }

  function getAsin() {
    var asinInput = document.querySelector('input[name="ASIN"], #ASIN');
    if (asinInput && asinInput.value) return asinInput.value;
    var match = location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
    return match ? match[1] : null;
  }

  // Export
  var api = {
    scrapeProductPage: scrapeProductPage,
    scrapeReviewCounts: scrapeReviewCounts,
    scrapeStarHistogram: scrapeStarHistogram,
    scrapeTimestamps: scrapeTimestamps,
    scrapeCommonPhrases: scrapeCommonPhrases,
    scrapePhotoCount: scrapePhotoCount,
    getProductTitle: getProductTitle,
    getAsin: getAsin,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.AmazonScraper = api;
  }
})(typeof window !== 'undefined' ? window : this);
