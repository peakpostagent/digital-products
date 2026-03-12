/**
 * popup.js — Settings UI logic for Read Cost extension
 *
 * Handles:
 * - Loading and saving settings to chrome.storage.local
 * - WPM preset buttons
 * - Currency prefix updates
 * - Statistics display
 */

(function () {
  'use strict';

  // -------------------------------------------------------
  // Currency symbol map (matches calculator.js)
  // -------------------------------------------------------

  var CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '\u00A5',
    INR: '\u20B9'
  };

  // -------------------------------------------------------
  // Default settings
  // -------------------------------------------------------

  var DEFAULTS = {
    hourlyRate: 50,
    wpm: 238,
    currency: 'USD',
    showBadge: true,
    showReadingTime: true,
    showWordCount: true
  };

  // -------------------------------------------------------
  // DOM references
  // -------------------------------------------------------

  var hourlyRateInput;
  var wpmInput;
  var currencySelect;
  var currencyPrefix;
  var toggleBadge;
  var toggleTime;
  var toggleWords;
  var presetBtns;
  var saveStatus;

  // Stats elements
  var statArticlesToday;
  var statTimeToday;
  var statCostToday;
  var statArticlesWeek;

  // -------------------------------------------------------
  // Initialize
  // -------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    // Cache DOM elements
    hourlyRateInput = document.getElementById('hourly-rate');
    wpmInput = document.getElementById('wpm');
    currencySelect = document.getElementById('currency');
    currencyPrefix = document.getElementById('currency-prefix');
    toggleBadge = document.getElementById('toggle-badge');
    toggleTime = document.getElementById('toggle-time');
    toggleWords = document.getElementById('toggle-words');
    presetBtns = document.querySelectorAll('.preset-btn');
    saveStatus = document.getElementById('save-status');

    statArticlesToday = document.getElementById('stat-articles-today');
    statTimeToday = document.getElementById('stat-time-today');
    statCostToday = document.getElementById('stat-cost-today');
    statArticlesWeek = document.getElementById('stat-articles-week');

    // Load settings
    loadSettings();

    // Load stats
    loadStats();

    // Set up event listeners
    setupListeners();
  });

  // -------------------------------------------------------
  // Load settings from storage
  // -------------------------------------------------------

  function loadSettings() {
    chrome.storage.local.get(DEFAULTS, function (items) {
      hourlyRateInput.value = items.hourlyRate;
      wpmInput.value = items.wpm;
      currencySelect.value = items.currency;
      toggleBadge.checked = items.showBadge;
      toggleTime.checked = items.showReadingTime;
      toggleWords.checked = items.showWordCount;

      // Update currency prefix
      updateCurrencyPrefix(items.currency);

      // Update active preset button
      updatePresetButtons(items.wpm);
    });
  }

  // -------------------------------------------------------
  // Save settings to storage
  // -------------------------------------------------------

  function saveSettings() {
    var settings = {
      hourlyRate: parseFloat(hourlyRateInput.value) || DEFAULTS.hourlyRate,
      wpm: parseInt(wpmInput.value, 10) || DEFAULTS.wpm,
      currency: currencySelect.value,
      showBadge: toggleBadge.checked,
      showReadingTime: toggleTime.checked,
      showWordCount: toggleWords.checked
    };

    // Clamp values
    settings.hourlyRate = Math.max(1, Math.min(10000, settings.hourlyRate));
    settings.wpm = Math.max(50, Math.min(1000, settings.wpm));

    chrome.storage.local.set(settings, function () {
      showSaveStatus();
    });
  }

  // -------------------------------------------------------
  // Event listeners
  // -------------------------------------------------------

  function setupListeners() {
    // Save on change for all inputs
    hourlyRateInput.addEventListener('change', saveSettings);
    wpmInput.addEventListener('change', function () {
      updatePresetButtons(parseInt(wpmInput.value, 10));
      saveSettings();
    });
    currencySelect.addEventListener('change', function () {
      updateCurrencyPrefix(currencySelect.value);
      saveSettings();
    });
    toggleBadge.addEventListener('change', saveSettings);
    toggleTime.addEventListener('change', saveSettings);
    toggleWords.addEventListener('change', saveSettings);

    // Preset buttons
    for (var i = 0; i < presetBtns.length; i++) {
      presetBtns[i].addEventListener('click', function () {
        var wpm = parseInt(this.getAttribute('data-wpm'), 10);
        wpmInput.value = wpm;
        updatePresetButtons(wpm);
        saveSettings();
      });
    }
  }

  // -------------------------------------------------------
  // UI helpers
  // -------------------------------------------------------

  /**
   * Update the currency prefix symbol next to the rate input.
   */
  function updateCurrencyPrefix(currency) {
    currencyPrefix.textContent = CURRENCY_SYMBOLS[currency] || '$';
  }

  /**
   * Highlight the matching WPM preset button.
   */
  function updatePresetButtons(wpm) {
    for (var i = 0; i < presetBtns.length; i++) {
      var btnWpm = parseInt(presetBtns[i].getAttribute('data-wpm'), 10);
      if (btnWpm === wpm) {
        presetBtns[i].classList.add('active');
      } else {
        presetBtns[i].classList.remove('active');
      }
    }
  }

  /**
   * Flash the "Settings saved" message.
   */
  function showSaveStatus() {
    saveStatus.classList.add('visible');
    setTimeout(function () {
      saveStatus.classList.remove('visible');
    }, 1500);
  }

  // -------------------------------------------------------
  // Statistics
  // -------------------------------------------------------

  function loadStats() {
    chrome.storage.local.get({ stats: {} }, function (result) {
      var stats = result.stats || {};
      var today = new Date().toISOString().slice(0, 10);

      // Today's stats
      var todayStats = stats[today] || { articlesRead: 0, totalMinutes: 0, totalCost: 0 };
      statArticlesToday.textContent = todayStats.articlesRead;
      statTimeToday.textContent = formatStatTime(todayStats.totalMinutes);
      statCostToday.textContent = formatStatCost(todayStats.totalCost);

      // This week's articles (last 7 days)
      var weekArticles = 0;
      var now = new Date();
      for (var i = 0; i < 7; i++) {
        var d = new Date(now);
        d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        if (stats[key]) {
          weekArticles += stats[key].articlesRead;
        }
      }
      statArticlesWeek.textContent = weekArticles;
    });
  }

  /**
   * Format minutes for stats display.
   */
  function formatStatTime(minutes) {
    if (!minutes || minutes < 1) return '0 min';
    var rounded = Math.round(minutes);
    if (rounded < 60) return rounded + ' min';
    var h = Math.floor(rounded / 60);
    var m = rounded % 60;
    if (m === 0) return h + ' hr';
    return h + 'h ' + m + 'm';
  }

  /**
   * Format cost for stats display.
   */
  function formatStatCost(cost) {
    if (!cost || cost < 0.01) return '$0';
    if (cost < 1) return '$' + cost.toFixed(2);
    return '$' + Math.round(cost);
  }
})();
