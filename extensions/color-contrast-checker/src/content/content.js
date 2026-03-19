/**
 * content.js — Content script for Color Contrast Checker
 *
 * When activated by the user, adds a click listener to the page.
 * On click, calculates the contrast ratio between the element's
 * text color and resolved background color, then shows results
 * in a Shadow DOM overlay.
 *
 * Uses WCAG 2.1 contrast ratio formulas.
 */

(function () {
  'use strict';

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------

  var isActive = false;          // Whether checker mode is on
  var overlayHost = null;        // Shadow DOM host element
  var shadowRoot = null;         // Shadow root for the overlay
  var highlightedEl = null;      // Currently highlighted element
  var hoverHighlightEl = null;   // Element being hovered
  var settings = {
    showOverlay: true,
    showHighlight: true
  };

  // -------------------------------------------------------
  // Color parsing utilities
  // -------------------------------------------------------

  /**
   * Parse a CSS color string (rgb, rgba, hex) into {r, g, b, a}.
   * Returns values in 0-255 range for r, g, b and 0-1 for a.
   */
  function parseColor(colorStr) {
    if (!colorStr || colorStr === 'transparent') {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Handle rgb() and rgba()
    var rgbMatch = colorStr.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
    );
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
        a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
      };
    }

    // Handle hex colors
    var hexMatch = colorStr.match(/^#([0-9a-f]{3,8})$/i);
    if (hexMatch) {
      var hex = hexMatch[1];
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
          a: 1
        };
      }
      if (hex.length === 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
          a: 1
        };
      }
    }

    return { r: 0, g: 0, b: 0, a: 1 };
  }

  /**
   * Convert an {r, g, b} color to hex string (e.g., "#FF00AA").
   */
  function rgbToHex(color) {
    var r = Math.round(color.r).toString(16).padStart(2, '0');
    var g = Math.round(color.g).toString(16).padStart(2, '0');
    var b = Math.round(color.b).toString(16).padStart(2, '0');
    return '#' + (r + g + b).toUpperCase();
  }

  /**
   * Blend a foreground color (with alpha) over a background color.
   * Returns the resulting opaque color.
   */
  function blendColors(fg, bg) {
    var a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1
    };
  }

  // -------------------------------------------------------
  // Background color resolution
  // -------------------------------------------------------

  /**
   * Walk up the DOM tree to find the actual visible background color.
   * Handles transparent backgrounds by blending with parent backgrounds.
   */
  function resolveBackgroundColor(element) {
    var bgColor = { r: 255, g: 255, b: 255, a: 1 }; // default to white
    var layers = [];

    // Collect background colors from element up to body/html
    var el = element;
    while (el && el !== document.documentElement) {
      var style = window.getComputedStyle(el);
      var bg = parseColor(style.backgroundColor);

      if (bg.a > 0) {
        layers.unshift(bg); // add to front (bottom of stack)
      }

      // If we found a fully opaque background, stop climbing
      if (bg.a >= 1) {
        break;
      }

      el = el.parentElement;
    }

    // If no opaque layer found, start with white
    if (layers.length === 0) {
      return bgColor;
    }

    // Blend layers from bottom to top
    var result = { r: 255, g: 255, b: 255, a: 1 };
    for (var i = 0; i < layers.length; i++) {
      result = blendColors(layers[i], result);
    }

    return result;
  }

  // -------------------------------------------------------
  // WCAG contrast calculation
  // -------------------------------------------------------

  /**
   * Convert an sRGB channel value (0-255) to linear RGB (0-1).
   * Uses the WCAG 2.1 formula for sRGB linearization.
   */
  function srgbToLinear(channel) {
    var c = channel / 255;
    if (c <= 0.03928) {
      return c / 12.92;
    }
    return Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /**
   * Calculate the relative luminance of a color.
   * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
   */
  function relativeLuminance(color) {
    var r = srgbToLinear(color.r);
    var g = srgbToLinear(color.g);
    var b = srgbToLinear(color.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate the WCAG contrast ratio between two colors.
   * Returns a value >= 1 (e.g., 4.5 for 4.5:1).
   */
  function contrastRatio(color1, color2) {
    var l1 = relativeLuminance(color1);
    var l2 = relativeLuminance(color2);

    // L1 should be the lighter color
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Format a contrast ratio for display (e.g., "4.52:1").
   */
  function formatRatio(ratio) {
    return ratio.toFixed(2) + ':1';
  }

  /**
   * Check WCAG compliance for a given contrast ratio.
   * Returns an object with pass/fail for each level.
   */
  function checkWCAG(ratio) {
    return {
      aaNormal: ratio >= 4.5,    // AA for normal text (< 18pt or < 14pt bold)
      aaLarge: ratio >= 3.0,     // AA for large text (>= 18pt or >= 14pt bold)
      aaaNormal: ratio >= 7.0,   // AAA for normal text
      aaaLarge: ratio >= 4.5     // AAA for large text
    };
  }

  // -------------------------------------------------------
  // Element inspection
  // -------------------------------------------------------

  /**
   * Inspect a clicked element and return contrast data.
   */
  function inspectElement(element) {
    var style = window.getComputedStyle(element);

    // Get foreground color
    var fgColor = parseColor(style.color);

    // Resolve the actual background color (walking up the DOM)
    var bgColor = resolveBackgroundColor(element);

    // If foreground has alpha, blend it over the background
    var effectiveFg = fgColor.a < 1 ? blendColors(fgColor, bgColor) : fgColor;

    // Calculate contrast ratio
    var ratio = contrastRatio(effectiveFg, bgColor);
    var wcag = checkWCAG(ratio);

    // Get font size info to determine if text is "large"
    var fontSize = parseFloat(style.fontSize);
    var fontWeight = style.fontWeight;
    var isBold = fontWeight === 'bold' || parseInt(fontWeight, 10) >= 700;
    var isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);

    return {
      fgHex: rgbToHex(effectiveFg),
      bgHex: rgbToHex(bgColor),
      fgColor: effectiveFg,
      bgColor: bgColor,
      ratio: formatRatio(ratio),
      ratioValue: ratio,
      aaNormal: wcag.aaNormal,
      aaLarge: wcag.aaLarge,
      aaaNormal: wcag.aaaNormal,
      aaaLarge: wcag.aaaLarge,
      isLargeText: isLargeText,
      fontSize: fontSize,
      isBold: isBold
    };
  }

  // -------------------------------------------------------
  // Overlay (Shadow DOM)
  // -------------------------------------------------------

  /**
   * Create or update the results overlay using Shadow DOM.
   */
  function showOverlay(result, x, y) {
    if (!settings.showOverlay) return;

    // Remove existing overlay
    removeOverlay();

    // Create host element
    overlayHost = document.createElement('div');
    overlayHost.id = 'ccc-overlay-host';
    overlayHost.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

    // Position near the click, but keep within viewport
    var posX = Math.min(x + 12, window.innerWidth - 280);
    var posY = Math.min(y + 12, window.innerHeight - 320);
    posX = Math.max(8, posX);
    posY = Math.max(8, posY);
    overlayHost.style.left = posX + 'px';
    overlayHost.style.top = posY + 'px';

    // Attach shadow DOM
    shadowRoot = overlayHost.attachShadow({ mode: 'closed' });
    shadowRoot.innerHTML = getOverlayStyles() + getOverlayHTML(result);

    document.body.appendChild(overlayHost);

    // Set up overlay events
    setupOverlayEvents(result);
  }

  /**
   * Build the overlay CSS styles.
   */
  function getOverlayStyles() {
    return '<style>' +
      ':host { all: initial; }' +
      '.ccc-overlay {' +
      '  position: relative;' +
      '  background: #ffffff;' +
      '  border: 1px solid #e0e0e0;' +
      '  border-radius: 12px;' +
      '  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);' +
      '  padding: 14px;' +
      '  width: 256px;' +
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
      '  font-size: 13px;' +
      '  color: #333;' +
      '  line-height: 1.4;' +
      '  cursor: default;' +
      '}' +
      '.ccc-close {' +
      '  position: absolute;' +
      '  top: 8px;' +
      '  right: 8px;' +
      '  width: 20px;' +
      '  height: 20px;' +
      '  border: none;' +
      '  background: #f0f0f0;' +
      '  cursor: pointer;' +
      '  color: #666;' +
      '  font-size: 14px;' +
      '  line-height: 1;' +
      '  display: flex;' +
      '  align-items: center;' +
      '  justify-content: center;' +
      '  border-radius: 50%;' +
      '  padding: 0;' +
      '}' +
      '.ccc-close:hover {' +
      '  background: #e0e0e0;' +
      '  color: #333;' +
      '}' +
      '.ccc-colors {' +
      '  display: flex;' +
      '  align-items: center;' +
      '  gap: 6px;' +
      '  margin-bottom: 10px;' +
      '}' +
      '.ccc-swatch {' +
      '  width: 28px;' +
      '  height: 28px;' +
      '  border-radius: 6px;' +
      '  border: 1px solid #ddd;' +
      '  flex-shrink: 0;' +
      '}' +
      '.ccc-hex {' +
      '  font-family: "SF Mono", Consolas, Monaco, monospace;' +
      '  font-size: 12px;' +
      '  color: #555;' +
      '}' +
      '.ccc-on {' +
      '  font-size: 11px;' +
      '  color: #999;' +
      '  margin: 0 2px;' +
      '}' +
      '.ccc-ratio {' +
      '  text-align: center;' +
      '  margin: 10px 0;' +
      '  padding: 8px;' +
      '  border-radius: 8px;' +
      '}' +
      '.ccc-ratio-value {' +
      '  font-size: 22px;' +
      '  font-weight: 700;' +
      '}' +
      '.ccc-ratio-label {' +
      '  font-size: 10px;' +
      '  color: #888;' +
      '  margin-top: 2px;' +
      '}' +
      '.ccc-ratio.pass { background: #f0fdf4; }' +
      '.ccc-ratio.pass .ccc-ratio-value { color: #166534; }' +
      '.ccc-ratio.fail { background: #fef2f2; }' +
      '.ccc-ratio.fail .ccc-ratio-value { color: #991b1b; }' +
      '.ccc-grid {' +
      '  display: grid;' +
      '  grid-template-columns: 1fr 1fr;' +
      '  gap: 4px;' +
      '}' +
      '.ccc-item {' +
      '  display: flex;' +
      '  justify-content: space-between;' +
      '  align-items: center;' +
      '  padding: 4px 8px;' +
      '  background: #f8f8f8;' +
      '  border-radius: 6px;' +
      '}' +
      '.ccc-item-label {' +
      '  font-size: 9px;' +
      '  font-weight: 600;' +
      '  color: #666;' +
      '  text-transform: uppercase;' +
      '  letter-spacing: 0.3px;' +
      '}' +
      '.ccc-badge {' +
      '  font-size: 9px;' +
      '  font-weight: 700;' +
      '  padding: 2px 6px;' +
      '  border-radius: 4px;' +
      '  text-transform: uppercase;' +
      '}' +
      '.ccc-badge.pass {' +
      '  background: #dcfce7;' +
      '  color: #166534;' +
      '}' +
      '.ccc-badge.fail {' +
      '  background: #fee2e2;' +
      '  color: #991b1b;' +
      '}' +
      '.ccc-font-info {' +
      '  margin-top: 8px;' +
      '  font-size: 10px;' +
      '  color: #888;' +
      '  text-align: center;' +
      '}' +
      '.ccc-preview {' +
      '  margin-top: 10px;' +
      '  padding: 8px;' +
      '  border-radius: 6px;' +
      '  text-align: center;' +
      '  font-size: 14px;' +
      '  font-weight: 500;' +
      '}' +
      '</style>';
  }

  /**
   * Build the overlay HTML content.
   */
  function getOverlayHTML(result) {
    // Determine overall pass/fail based on whether it meets AA for its text size
    var overallPass = result.isLargeText ? result.aaLarge : result.aaNormal;
    var ratioClass = overallPass ? 'pass' : 'fail';
    var textSizeLabel = result.isLargeText ? 'Large text' : 'Normal text';
    var fontDetail = Math.round(result.fontSize) + 'px' +
      (result.isBold ? ' bold' : '');

    return '<div class="ccc-overlay">' +
      '<button class="ccc-close" id="ccc-close" title="Dismiss">\u00D7</button>' +

      // Color swatches row
      '<div class="ccc-colors">' +
      '<div class="ccc-swatch" style="background-color: ' + result.fgHex + '"></div>' +
      '<span class="ccc-hex">' + escapeHTML(result.fgHex) + '</span>' +
      '<span class="ccc-on">on</span>' +
      '<div class="ccc-swatch" style="background-color: ' + result.bgHex + '"></div>' +
      '<span class="ccc-hex">' + escapeHTML(result.bgHex) + '</span>' +
      '</div>' +

      // Contrast ratio
      '<div class="ccc-ratio ' + ratioClass + '">' +
      '<div class="ccc-ratio-value">' + escapeHTML(result.ratio) + '</div>' +
      '<div class="ccc-ratio-label">Contrast Ratio (' + textSizeLabel + ')</div>' +
      '</div>' +

      // WCAG grid
      '<div class="ccc-grid">' +
      wcagItem('AA Normal', result.aaNormal) +
      wcagItem('AA Large', result.aaLarge) +
      wcagItem('AAA Normal', result.aaaNormal) +
      wcagItem('AAA Large', result.aaaLarge) +
      '</div>' +

      // Font info
      '<div class="ccc-font-info">' +
      'Detected: ' + escapeHTML(fontDetail) + ' (' + textSizeLabel.toLowerCase() + ')' +
      '</div>' +

      // Preview
      '<div class="ccc-preview" style="color: ' + result.fgHex +
      '; background-color: ' + result.bgHex + ';">' +
      'Sample Text Preview' +
      '</div>' +

      '</div>';
  }

  /**
   * Build HTML for a single WCAG result row.
   */
  function wcagItem(label, passes) {
    var cls = passes ? 'pass' : 'fail';
    var text = passes ? 'Pass' : 'Fail';
    return '<div class="ccc-item">' +
      '<span class="ccc-item-label">' + escapeHTML(label) + '</span>' +
      '<span class="ccc-badge ' + cls + '">' + text + '</span>' +
      '</div>';
  }

  /**
   * Escape HTML special characters.
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }

  /**
   * Set up event listeners on the overlay.
   */
  function setupOverlayEvents() {
    var closeBtn = shadowRoot.getElementById('ccc-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        removeOverlay();
        removeHighlight();
      });
    }

    // Prevent overlay clicks from triggering page inspection
    overlayHost.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    overlayHost.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });
  }

  /**
   * Remove the overlay from the page.
   */
  function removeOverlay() {
    if (overlayHost && overlayHost.parentNode) {
      overlayHost.parentNode.removeChild(overlayHost);
    }
    overlayHost = null;
    shadowRoot = null;
  }

  // -------------------------------------------------------
  // Element highlighting
  // -------------------------------------------------------

  /**
   * Add a highlight border to the checked element.
   * Saves original inline styles so they can be restored later.
   */
  function highlightElement(element) {
    removeHighlight();
    if (!settings.showHighlight) return;

    highlightedEl = element;
    highlightedEl._cccOrigOutline = element.style.outline;
    highlightedEl._cccOrigOutlineOffset = element.style.outlineOffset;
    element.style.outline = '3px solid #4f46e5';
    element.style.outlineOffset = '2px';
  }

  /**
   * Remove the highlight from the previously checked element.
   * Restores original inline styles rather than blanking them.
   */
  function removeHighlight() {
    if (highlightedEl) {
      highlightedEl.style.outline = highlightedEl._cccOrigOutline || '';
      highlightedEl.style.outlineOffset = highlightedEl._cccOrigOutlineOffset || '';
      delete highlightedEl._cccOrigOutline;
      delete highlightedEl._cccOrigOutlineOffset;
      highlightedEl = null;
    }
  }

  /**
   * Add a hover highlight to an element under the cursor.
   * Saves original inline styles so they can be restored later.
   */
  function addHoverHighlight(element) {
    removeHoverHighlight();
    if (!element || element === overlayHost) return;

    hoverHighlightEl = element;
    hoverHighlightEl._cccOrigHoverOutline = element.style.outline;
    hoverHighlightEl._cccOrigHoverOutlineOffset = element.style.outlineOffset;
    element.style.outline = '2px dashed #4f46e5';
    element.style.outlineOffset = '1px';
  }

  /**
   * Remove the hover highlight.
   * Restores original inline styles rather than blanking them.
   */
  function removeHoverHighlight() {
    if (hoverHighlightEl) {
      // Only remove if it's not also the checked element
      if (hoverHighlightEl !== highlightedEl) {
        hoverHighlightEl.style.outline = hoverHighlightEl._cccOrigHoverOutline || '';
        hoverHighlightEl.style.outlineOffset = hoverHighlightEl._cccOrigHoverOutlineOffset || '';
      }
      delete hoverHighlightEl._cccOrigHoverOutline;
      delete hoverHighlightEl._cccOrigHoverOutlineOffset;
      hoverHighlightEl = null;
    }
  }

  // -------------------------------------------------------
  // Click handler
  // -------------------------------------------------------

  /**
   * Handle clicks on page elements when checker is active.
   */
  function handleClick(e) {
    if (!isActive) return;

    // Ignore clicks on the overlay itself
    if (overlayHost && overlayHost.contains(e.target)) return;

    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();

    var target = e.target;

    // Inspect the element
    var result = inspectElement(target);

    // Show overlay near the click
    showOverlay(result, e.clientX, e.clientY);

    // Highlight the element
    highlightElement(target);

    // Save result to storage so popup can display it
    chrome.storage.local.set({ lastResult: result });
  }

  /**
   * Handle mouseover for hover highlighting.
   */
  function handleMouseOver(e) {
    if (!isActive) return;
    if (overlayHost && overlayHost.contains(e.target)) return;
    addHoverHighlight(e.target);
  }

  /**
   * Handle mouseout for removing hover highlighting.
   */
  function handleMouseOut(e) {
    if (!isActive) return;
    removeHoverHighlight();
  }

  // -------------------------------------------------------
  // Activation / Deactivation
  // -------------------------------------------------------

  /**
   * Activate checker mode — adds click and hover listeners.
   */
  function activate() {
    isActive = true;
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.body.style.cursor = 'crosshair';
  }

  /**
   * Deactivate checker mode — removes listeners and cleanup.
   */
  function deactivate() {
    isActive = false;
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.body.style.cursor = '';
    removeOverlay();
    removeHighlight();
    removeHoverHighlight();
  }

  // -------------------------------------------------------
  // Message handling
  // -------------------------------------------------------

  /**
   * Listen for messages from popup and background script.
   */
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'toggleChecker') {
      if (message.isActive) {
        activate();
      } else {
        deactivate();
      }
      sendResponse({ success: true });
    }

    if (message.action === 'updateSettings') {
      settings[message.key] = message.value;
      sendResponse({ success: true });
    }

    // Return true for async response (not needed here, but good practice)
    return true;
  });

  // -------------------------------------------------------
  // Load initial settings
  // -------------------------------------------------------

  /**
   * Load settings from storage on script load.
   */
  function loadSettings() {
    chrome.storage.local.get({
      showOverlay: true,
      showHighlight: true,
      isActive: false
    }, function (items) {
      settings.showOverlay = items.showOverlay;
      settings.showHighlight = items.showHighlight;

      // If checker was left active (e.g., page reload), reactivate
      if (items.isActive) {
        activate();
      }
    });
  }

  loadSettings();
})();
