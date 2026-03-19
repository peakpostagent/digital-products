/**
 * popup.js — Popup logic for Color Contrast Checker
 *
 * Handles:
 * - Toggle checker mode on/off via message to content script
 * - Display last check results from storage
 * - Settings management (overlay, highlight)
 */

(function () {
  'use strict';

  // -------------------------------------------------------
  // DOM references
  // -------------------------------------------------------

  var toggleBtn = document.getElementById('toggle-btn');
  var toggleLabel = document.getElementById('toggle-label');
  var toggleIcon = document.getElementById('toggle-icon');
  var hintText = document.getElementById('hint-text');
  var resultSection = document.getElementById('result-section');
  var fgSwatch = document.getElementById('fg-swatch');
  var bgSwatch = document.getElementById('bg-swatch');
  var fgLabel = document.getElementById('fg-label');
  var bgLabel = document.getElementById('bg-label');
  var ratioValue = document.getElementById('ratio-value');
  var aaNormal = document.getElementById('aa-normal');
  var aaLarge = document.getElementById('aa-large');
  var aaaNormal = document.getElementById('aaa-normal');
  var aaaLarge = document.getElementById('aaa-large');
  var toggleOverlay = document.getElementById('toggle-overlay');
  var toggleHighlight = document.getElementById('toggle-highlight');
  var saveStatus = document.getElementById('save-status');

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------

  var isActive = false;

  // -------------------------------------------------------
  // Settings defaults
  // -------------------------------------------------------

  var DEFAULTS = {
    showOverlay: true,
    showHighlight: true,
    lastResult: null,
    isActive: false
  };

  // -------------------------------------------------------
  // Initialize popup
  // -------------------------------------------------------

  /**
   * Load saved settings and last result from storage.
   */
  function init() {
    chrome.storage.local.get(DEFAULTS, function (items) {
      // Restore settings toggles
      toggleOverlay.checked = items.showOverlay !== false;
      toggleHighlight.checked = items.showHighlight !== false;

      // Check if checker is currently active
      isActive = items.isActive || false;
      updateToggleUI();

      // Show last result if available
      if (items.lastResult) {
        displayResult(items.lastResult);
      }
    });
  }

  // -------------------------------------------------------
  // Toggle checker mode
  // -------------------------------------------------------

  /**
   * Update the toggle button appearance based on active state.
   */
  function updateToggleUI() {
    if (isActive) {
      toggleBtn.classList.add('active');
      toggleLabel.textContent = 'Deactivate Checker';
      toggleIcon.innerHTML = '&#9632;'; // square stop icon
      hintText.textContent = 'Click any element on the page to check contrast.';
    } else {
      toggleBtn.classList.remove('active');
      toggleLabel.textContent = 'Activate Checker';
      toggleIcon.innerHTML = '&#9673;'; // circle icon
      hintText.textContent = 'Click to start inspecting elements on the page.';
    }
  }

  /**
   * Send toggle message to the content script on the active tab.
   */
  function toggleCheckerMode() {
    isActive = !isActive;
    updateToggleUI();

    // Save active state
    chrome.storage.local.set({ isActive: isActive });

    // Update badge
    chrome.runtime.sendMessage({
      action: 'updateBadge',
      isActive: isActive
    });

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleChecker',
          isActive: isActive
        });
      }
    });
  }

  // -------------------------------------------------------
  // Display results
  // -------------------------------------------------------

  /**
   * Show a contrast check result in the popup.
   */
  function displayResult(result) {
    if (!result || !result.fgHex) return;

    resultSection.style.display = 'block';

    // Color swatches
    fgSwatch.style.backgroundColor = result.fgHex;
    bgSwatch.style.backgroundColor = result.bgHex;

    // Color labels
    fgLabel.textContent = result.fgHex;
    bgLabel.textContent = result.bgHex;

    // Ratio
    ratioValue.textContent = result.ratio;

    // WCAG badges
    setBadge(aaNormal, result.aaNormal);
    setBadge(aaLarge, result.aaLarge);
    setBadge(aaaNormal, result.aaaNormal);
    setBadge(aaaLarge, result.aaaLarge);
  }

  /**
   * Set a WCAG badge to pass or fail.
   */
  function setBadge(element, passes) {
    if (passes) {
      element.textContent = 'Pass';
      element.className = 'wcag-badge pass';
    } else {
      element.textContent = 'Fail';
      element.className = 'wcag-badge fail';
    }
  }

  // -------------------------------------------------------
  // Settings handlers
  // -------------------------------------------------------

  /**
   * Save a setting and show confirmation.
   */
  function saveSetting(key, value) {
    var data = {};
    data[key] = value;
    chrome.storage.local.set(data, function () {
      showSaveStatus();
    });

    // Notify content script of setting change
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          key: key,
          value: value
        });
      }
    });
  }

  /**
   * Briefly show the "Settings saved" message.
   */
  function showSaveStatus() {
    saveStatus.classList.add('visible');
    setTimeout(function () {
      saveStatus.classList.remove('visible');
    }, 1500);
  }

  // -------------------------------------------------------
  // Event listeners
  // -------------------------------------------------------

  toggleBtn.addEventListener('click', toggleCheckerMode);

  toggleOverlay.addEventListener('change', function () {
    saveSetting('showOverlay', this.checked);
  });

  toggleHighlight.addEventListener('change', function () {
    saveSetting('showHighlight', this.checked);
  });

  // Listen for result updates from content script
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes.lastResult && changes.lastResult.newValue) {
      displayResult(changes.lastResult.newValue);
    }
  });

  // -------------------------------------------------------
  // Run
  // -------------------------------------------------------

  init();
})();
