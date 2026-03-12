/**
 * content.js — Content script for Read Cost extension
 *
 * Detects article content on any page, calculates reading time and cost,
 * and injects a floating badge using Shadow DOM.
 *
 * Depends on: calculator.js (loaded before this via manifest)
 */

(function () {
  'use strict';

  // Bail if ReadCost namespace is not available
  if (typeof ReadCost === 'undefined') {
    return;
  }

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------

  var badge = null;          // The badge host element
  var shadowRoot = null;     // Shadow root for badge styling
  var isExpanded = false;    // Whether badge details are visible
  var isDismissed = false;   // Whether user dismissed the badge
  var isDragging = false;    // Whether badge is being dragged
  var dragOffset = { x: 0, y: 0 };
  var currentSettings = null;
  var articleData = null;    // Cached article analysis

  // -------------------------------------------------------
  // Settings
  // -------------------------------------------------------

  /**
   * Load settings from chrome.storage.local
   */
  function loadSettings(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      // Fallback defaults for testing without extension context
      callback(ReadCost.DEFAULTS);
      return;
    }
    chrome.storage.local.get(ReadCost.DEFAULTS, function (items) {
      callback(items);
    });
  }

  // -------------------------------------------------------
  // Article analysis
  // -------------------------------------------------------

  /**
   * Analyze the current page and return reading data.
   * Returns null if the page is not an article or has too little content.
   */
  function analyzePage() {
    // Check if this looks like an article page
    if (!ReadCost.isArticlePage(document)) {
      return null;
    }

    // Extract article text
    var text = ReadCost.extractArticleText(document);
    var wordCount = ReadCost.countWords(text);

    // Only show badge for meaningful content (> 100 words)
    if (wordCount < 100) {
      return null;
    }

    return {
      text: text,
      wordCount: wordCount
    };
  }

  /**
   * Calculate all display data based on article and settings.
   */
  function calculateDisplayData(article, settings) {
    var wpm = settings.wpm || ReadCost.DEFAULT_WPM;
    var hourlyRate = settings.hourlyRate || ReadCost.DEFAULT_RATE;
    var currency = settings.currency || 'USD';

    var readingTime = ReadCost.estimateReadingTime(article.wordCount, wpm);
    var costResult = ReadCost.calculateReadingCost(readingTime.minutes + readingTime.seconds / 60, hourlyRate);
    var level = ReadCost.getReadingLevel(article.wordCount, wpm);

    return {
      wordCount: article.wordCount,
      readingTime: readingTime,
      cost: costResult.cost,
      formattedCost: ReadCost.formatCost(costResult.cost, currency),
      formattedTime: ReadCost.formatTime(readingTime.minutes + readingTime.seconds / 60),
      formattedWords: ReadCost.formatNumber(article.wordCount),
      level: level,
      levelColor: ReadCost.getReadingLevelColor(level),
      levelLabel: ReadCost.getReadingLevelLabel(level),
      currency: currency
    };
  }

  // -------------------------------------------------------
  // Badge creation
  // -------------------------------------------------------

  /**
   * Create the floating badge element with Shadow DOM.
   */
  function createBadge(displayData, settings) {
    // Remove existing badge if present
    removeBadge();

    // Create host element
    badge = document.createElement('div');
    badge.id = 'read-cost-badge-host';
    badge.style.cssText = 'all: initial; position: fixed; top: 72px; right: 20px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

    // Attach shadow DOM
    shadowRoot = badge.attachShadow({ mode: 'closed' });

    // Build badge HTML
    var showTime = settings.showReadingTime !== false;
    var showWords = settings.showWordCount !== false;

    var secondaryParts = [];
    if (showTime) {
      secondaryParts.push(displayData.formattedTime.replace(' read', ''));
    }
    if (showWords) {
      secondaryParts.push(displayData.formattedWords + ' words');
    }
    var secondaryText = secondaryParts.join(' \u00B7 ');

    shadowRoot.innerHTML = getBadgeStyles() + getBadgeHTML(displayData, secondaryText);

    // Add to page
    document.body.appendChild(badge);

    // Set up event listeners
    setupBadgeEvents();
  }

  /**
   * Build the badge CSS styles.
   */
  function getBadgeStyles() {
    return '<style>' +
      ':host { all: initial; }' +
      '.rc-badge {' +
      '  position: relative;' +
      '  background: #ffffff;' +
      '  border: 1px solid #e0e0e0;' +
      '  border-radius: 12px;' +
      '  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);' +
      '  padding: 10px 14px;' +
      '  cursor: pointer;' +
      '  user-select: none;' +
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
      '  transition: box-shadow 0.2s ease, transform 0.2s ease;' +
      '  max-width: 280px;' +
      '  min-width: 120px;' +
      '}' +
      '.rc-badge:hover {' +
      '  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);' +
      '}' +
      '.rc-badge.dragging {' +
      '  opacity: 0.9;' +
      '  transform: scale(1.02);' +
      '}' +
      '.rc-cost {' +
      '  font-size: 15px;' +
      '  font-weight: 600;' +
      '  color: #00695c;' +
      '  line-height: 1.3;' +
      '  white-space: nowrap;' +
      '}' +
      '.rc-secondary {' +
      '  font-size: 11px;' +
      '  color: #666;' +
      '  margin-top: 3px;' +
      '  display: none;' +
      '  line-height: 1.4;' +
      '}' +
      '.rc-badge.expanded .rc-secondary {' +
      '  display: block;' +
      '}' +
      '.rc-level {' +
      '  display: none;' +
      '  align-items: center;' +
      '  gap: 5px;' +
      '  margin-top: 6px;' +
      '  font-size: 11px;' +
      '  color: #555;' +
      '}' +
      '.rc-badge.expanded .rc-level {' +
      '  display: flex;' +
      '}' +
      '.rc-level-dot {' +
      '  width: 8px;' +
      '  height: 8px;' +
      '  border-radius: 50%;' +
      '  flex-shrink: 0;' +
      '}' +
      '.rc-dismiss {' +
      '  position: absolute;' +
      '  top: 4px;' +
      '  right: 6px;' +
      '  width: 16px;' +
      '  height: 16px;' +
      '  border: none;' +
      '  background: none;' +
      '  cursor: pointer;' +
      '  color: #999;' +
      '  font-size: 14px;' +
      '  line-height: 1;' +
      '  padding: 0;' +
      '  display: none;' +
      '  align-items: center;' +
      '  justify-content: center;' +
      '  border-radius: 50%;' +
      '}' +
      '.rc-badge.expanded .rc-dismiss {' +
      '  display: flex;' +
      '}' +
      '.rc-dismiss:hover {' +
      '  color: #333;' +
      '  background: #f0f0f0;' +
      '}' +
      '</style>';
  }

  /**
   * Build the badge inner HTML.
   */
  function getBadgeHTML(displayData, secondaryText) {
    return '<div class="rc-badge" id="rc-badge">' +
      '<button class="rc-dismiss" id="rc-dismiss" title="Dismiss">\u00D7</button>' +
      '<div class="rc-cost">' + escapeHTML(displayData.formattedCost) + ' of your time</div>' +
      '<div class="rc-secondary">' + escapeHTML(secondaryText) + '</div>' +
      '<div class="rc-level">' +
      '<span class="rc-level-dot" style="background-color: ' + displayData.levelColor + '"></span>' +
      '<span>' + escapeHTML(displayData.levelLabel) + '</span>' +
      '</div>' +
      '</div>';
  }

  /**
   * Escape HTML special characters for safe insertion.
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }

  // -------------------------------------------------------
  // Badge events
  // -------------------------------------------------------

  /**
   * Set up click, drag, and dismiss event listeners.
   */
  function setupBadgeEvents() {
    var badgeEl = shadowRoot.getElementById('rc-badge');
    var dismissBtn = shadowRoot.getElementById('rc-dismiss');

    // Click to expand/collapse
    badgeEl.addEventListener('click', function (e) {
      if (isDragging) return;
      if (e.target === dismissBtn || e.target.closest('.rc-dismiss')) return;
      isExpanded = !isExpanded;
      if (isExpanded) {
        badgeEl.classList.add('expanded');
      } else {
        badgeEl.classList.remove('expanded');
      }
    });

    // Dismiss button
    dismissBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      removeBadge();
      isDismissed = true;
    });

    // Drag functionality
    badge.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isDragging = false;
      dragOffset.x = e.clientX - badge.getBoundingClientRect().left;
      dragOffset.y = e.clientY - badge.getBoundingClientRect().top;

      var moveThreshold = 5;
      var startX = e.clientX;
      var startY = e.clientY;

      function onMouseMove(ev) {
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        if (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold) {
          isDragging = true;
          badgeEl.classList.add('dragging');
        }
        if (isDragging) {
          var newX = ev.clientX - dragOffset.x;
          var newY = ev.clientY - dragOffset.y;
          badge.style.left = newX + 'px';
          badge.style.top = newY + 'px';
          badge.style.right = 'auto';
        }
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        badgeEl.classList.remove('dragging');
        // Reset isDragging after a short delay so click handler can check it
        setTimeout(function () { isDragging = false; }, 50);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // -------------------------------------------------------
  // Badge management
  // -------------------------------------------------------

  /**
   * Remove the badge from the page.
   */
  function removeBadge() {
    if (badge && badge.parentNode) {
      badge.parentNode.removeChild(badge);
    }
    badge = null;
    shadowRoot = null;
    isExpanded = false;
  }

  /**
   * Update the badge with new display data.
   */
  function updateBadge(displayData, settings) {
    if (isDismissed) return;
    if (!badge || !shadowRoot) {
      createBadge(displayData, settings);
    } else {
      // Update existing badge content
      var costEl = shadowRoot.querySelector('.rc-cost');
      if (costEl) {
        costEl.textContent = displayData.formattedCost + ' of your time';
      }
    }
  }

  // -------------------------------------------------------
  // Statistics tracking
  // -------------------------------------------------------

  /**
   * Track that the user viewed an article.
   */
  function trackArticleView(displayData) {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    chrome.storage.local.get({ stats: {} }, function (result) {
      var stats = result.stats || {};

      // Initialize today's stats if needed
      if (!stats[today]) {
        stats[today] = {
          articlesRead: 0,
          totalMinutes: 0,
          totalCost: 0
        };
      }

      stats[today].articlesRead += 1;
      stats[today].totalMinutes += displayData.readingTime.minutes +
                                   displayData.readingTime.seconds / 60;
      stats[today].totalCost += displayData.cost;

      // Keep only the last 30 days of stats
      var keys = Object.keys(stats).sort();
      while (keys.length > 30) {
        delete stats[keys.shift()];
      }

      chrome.storage.local.set({ stats: stats });
    });
  }

  // -------------------------------------------------------
  // Initialization
  // -------------------------------------------------------

  /**
   * Main initialization — analyze page and show badge.
   */
  function init() {
    if (isDismissed) return;

    loadSettings(function (settings) {
      currentSettings = settings;

      // Check if badge display is disabled
      if (settings.showBadge === false) return;

      // Analyze the page
      articleData = analyzePage();
      if (!articleData) return;

      // Calculate and display
      var displayData = calculateDisplayData(articleData, settings);
      createBadge(displayData, settings);
      trackArticleView(displayData);
    });
  }

  // -------------------------------------------------------
  // SPA navigation handling
  // -------------------------------------------------------

  /**
   * Watch for SPA navigation using MutationObserver.
   */
  function watchForNavigation() {
    var lastUrl = location.href;

    var observer = new MutationObserver(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        isDismissed = false;
        // Delay to let new content render
        setTimeout(function () {
          removeBadge();
          init();
        }, 1500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // -------------------------------------------------------
  // Listen for settings changes
  // -------------------------------------------------------

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'local') return;
      // Reload settings and update badge
      loadSettings(function (settings) {
        currentSettings = settings;
        if (settings.showBadge === false) {
          removeBadge();
          return;
        }
        if (articleData) {
          var displayData = calculateDisplayData(articleData, settings);
          updateBadge(displayData, settings);
        }
      });
    });
  }

  // -------------------------------------------------------
  // Run
  // -------------------------------------------------------

  // Wait for page to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 500);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 500);
    });
  }

  // Watch for SPA navigation
  if (document.body) {
    watchForNavigation();
  } else {
    document.addEventListener('DOMContentLoaded', watchForNavigation);
  }
})();
