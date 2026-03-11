// content.js — Pay Decoder content script for job board pages
// Detects salary figures and injects inline conversion tooltips
// Uses Shadow DOM for style isolation

(() => {
  // ---- Constants ----
  const HOST_ATTR = 'data-pay-decoder';         // Attribute to mark processed elements
  const DEBOUNCE_MS = 1000;                     // Debounce delay for MutationObserver
  const SCAN_DELAY_MS = 2000;                   // Initial scan delay after page load
  const HOST_TAG = 'pay-decoder-tooltip';       // Custom element name for tooltip host

  // ---- State ----
  let settings = {
    hoursPerWeek: 40,
    weeksPerYear: 52,
    currency: 'USD',
    showConversions: true
  };
  let debounceTimer = null;
  let processedElements = new WeakSet(); // Cache to avoid re-processing

  // ---- Initialize ----
  loadSettings();
  setupObserver();
  setupMessageListener();

  /**
   * Load user settings from chrome.storage.local
   */
  function loadSettings() {
    chrome.storage.local.get(
      ['hoursPerWeek', 'weeksPerYear', 'currency', 'showConversions'],
      (result) => {
        settings.hoursPerWeek = result.hoursPerWeek || 40;
        settings.weeksPerYear = result.weeksPerYear || 52;
        settings.currency = result.currency || 'USD';
        settings.showConversions = result.showConversions !== false; // default true
      }
    );
  }

  /**
   * Listen for messages from popup (settings changes)
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'SETTINGS_UPDATED') {
        loadSettings();
        // Remove existing tooltips and rescan
        removeAllTooltips();
        processedElements = new WeakSet();
        setTimeout(scanPage, 300);
        sendResponse({ ok: true });
      }
      return true; // Keep message channel open
    });
  }

  /**
   * Watch for DOM changes (SPA navigation, lazy-loaded content)
   * Job board sites like LinkedIn use client-side routing
   */
  function setupObserver() {
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(scanPage, DEBOUNCE_MS);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial scan after page loads
    setTimeout(scanPage, SCAN_DELAY_MS);
  }

  /**
   * Main scan function — find salary elements and inject tooltips
   */
  function scanPage() {
    try {
      // Don't inject if conversions are turned off
      if (!settings.showConversions) return;

      // Find all elements containing salary text
      const salaryElements = PayDecoder.detectSalaryElements(document);

      for (const item of salaryElements) {
        // Skip already-processed elements
        if (processedElements.has(item.element)) continue;

        // Skip if this element is inside a pay-decoder tooltip
        if (item.element.closest(HOST_TAG)) continue;

        // Mark as processed
        processedElements.add(item.element);

        // Convert the salary
        const converted = PayDecoder.convertSalary(item.parsed, settings);
        if (!converted) continue;

        // Inject the tooltip
        injectTooltip(item.element, converted);
      }
    } catch (err) {
      console.error('Pay Decoder: scan error', err);
    }
  }

  /**
   * Inject an inline tooltip next to a salary element.
   * Uses Shadow DOM for complete style isolation.
   *
   * @param {Element} targetElement - The DOM element containing the salary
   * @param {object} converted - The conversion result from PayDecoder.convertSalary()
   */
  function injectTooltip(targetElement, converted) {
    // Don't add duplicate tooltips
    if (targetElement.nextElementSibling &&
        targetElement.nextElementSibling.tagName &&
        targetElement.nextElementSibling.tagName.toLowerCase() === HOST_TAG) {
      return;
    }

    // Create the shadow host element
    const host = document.createElement(HOST_TAG);
    host.setAttribute(HOST_ATTR, 'true');

    // Attach shadow DOM
    const shadow = host.attachShadow({ mode: 'closed' });

    // Build the tooltip content
    const tooltipHTML = buildTooltipHTML(converted);
    const tooltipCSS = getTooltipCSS();

    // Add styles
    const style = document.createElement('style');
    style.textContent = tooltipCSS;
    shadow.appendChild(style);

    // Add tooltip content
    const wrapper = document.createElement('span');
    wrapper.className = 'pd-tooltip';
    wrapper.innerHTML = tooltipHTML;
    shadow.appendChild(wrapper);

    // Insert after the salary element
    if (targetElement.nextSibling) {
      targetElement.parentNode.insertBefore(host, targetElement.nextSibling);
    } else {
      targetElement.parentNode.appendChild(host);
    }
  }

  /**
   * Build the tooltip inner HTML based on conversion data.
   * Shows the most useful conversions based on the original period.
   *
   * @param {object} converted - The conversion result
   * @returns {string} HTML string for the tooltip
   */
  function buildTooltipHTML(converted) {
    const curr = converted.currency;
    const isRange = converted.hourly.min !== converted.hourly.max;
    const period = converted.originalPeriod;

    let parts = [];

    // Show conversions that are different from the original period
    if (period === 'annual') {
      // Annual salary found — show hourly, monthly, biweekly
      parts.push(formatConversion(converted.hourly, curr, '/hr'));
      parts.push(formatConversion(converted.monthly, curr, '/mo'));
      parts.push(formatConversion(converted.biweekly, curr, '/2wk'));
    } else if (period === 'hourly') {
      // Hourly rate found — show annual, monthly
      parts.push(formatConversion(converted.annual, curr, '/yr'));
      parts.push(formatConversion(converted.monthly, curr, '/mo'));
    } else if (period === 'monthly') {
      // Monthly salary — show annual, hourly
      parts.push(formatConversion(converted.annual, curr, '/yr'));
      parts.push(formatConversion(converted.hourly, curr, '/hr'));
    } else if (period === 'weekly') {
      // Weekly salary — show annual, hourly, monthly
      parts.push(formatConversion(converted.annual, curr, '/yr'));
      parts.push(formatConversion(converted.hourly, curr, '/hr'));
    } else if (period === 'biweekly') {
      // Biweekly — show annual, hourly
      parts.push(formatConversion(converted.annual, curr, '/yr'));
      parts.push(formatConversion(converted.hourly, curr, '/hr'));
    } else if (period === 'daily') {
      // Daily — show annual, hourly
      parts.push(formatConversion(converted.annual, curr, '/yr'));
      parts.push(formatConversion(converted.hourly, curr, '/hr'));
    }

    return '<span class="pd-icon">&#8644;</span> ' + parts.join(' <span class="pd-sep">|</span> ');
  }

  /**
   * Format a single conversion value for tooltip display.
   *
   * @param {{ min: number, max: number }} values - Min/max for this period
   * @param {string} currency - Currency code
   * @param {string} suffix - Period label like "/hr" or "/yr"
   * @returns {string} Formatted string like "$38.46/hr" or "$80,000 - $120,000/yr"
   */
  function formatConversion(values, currency, suffix) {
    if (values.min === values.max) {
      return PayDecoder.formatCurrency(values.min, currency) + suffix;
    }
    return PayDecoder.formatCurrency(values.min, currency) +
      ' - ' +
      PayDecoder.formatCurrency(values.max, currency) +
      suffix;
  }

  /**
   * Get CSS styles for the tooltip (inside shadow DOM).
   * Designed to be subtle and non-intrusive.
   *
   * @returns {string} CSS text
   */
  function getTooltipCSS() {
    return [
      ':host {',
      '  display: inline;',
      '  vertical-align: baseline;',
      '}',
      '.pd-tooltip {',
      '  display: inline-block;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 12px;',
      '  line-height: 1.4;',
      '  color: #2e7d32;',
      '  background: #e8f5e9;',
      '  border: 1px solid #c8e6c9;',
      '  border-radius: 4px;',
      '  padding: 2px 8px;',
      '  margin-left: 6px;',
      '  white-space: nowrap;',
      '  vertical-align: baseline;',
      '  font-weight: 500;',
      '  letter-spacing: -0.2px;',
      '  cursor: default;',
      '}',
      '.pd-tooltip:hover {',
      '  background: #c8e6c9;',
      '  border-color: #a5d6a7;',
      '}',
      '.pd-icon {',
      '  font-size: 11px;',
      '  opacity: 0.7;',
      '  margin-right: 2px;',
      '}',
      '.pd-sep {',
      '  color: #81c784;',
      '  margin: 0 3px;',
      '  font-weight: 400;',
      '}'
    ].join('\n');
  }

  /**
   * Remove all injected tooltips from the page
   */
  function removeAllTooltips() {
    const tooltips = document.querySelectorAll(HOST_TAG);
    tooltips.forEach((tooltip) => tooltip.remove());
  }
})();
