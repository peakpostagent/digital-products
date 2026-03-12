/**
 * Tab Brake — Popup script
 *
 * Renders current status, settings, stats, and a 7-day bar chart.
 * Uses TabBrake namespace from ../lib/limiter.js (loaded first in popup.html).
 */

(function () {
  'use strict';

  /* ---- DOM refs ---- */
  var statusText = document.getElementById('statusText');
  var progressBar = document.getElementById('progressBar');
  var maxTabsInput = document.getElementById('maxTabsInput');
  var btnMinus = document.getElementById('btnMinus');
  var btnPlus = document.getElementById('btnPlus');
  var toggleEnabled = document.getElementById('toggleEnabled');
  var toggleBadge = document.getElementById('toggleBadge');
  var avgToday = document.getElementById('avgToday');
  var blockedToday = document.getElementById('blockedToday');
  var overriddenToday = document.getElementById('overriddenToday');
  var chart = document.getElementById('chart');

  /* ---- State ---- */
  var currentMax = 8;
  var currentCount = 0;

  /* ---- Init ---- */
  loadSettings();

  /* ---- Load settings + data ---- */
  function loadSettings() {
    chrome.storage.local.get(
      ['maxTabs', 'enabled', 'showBadge', 'history'],
      function (data) {
        currentMax = typeof data.maxTabs === 'number' ? data.maxTabs : 8;
        maxTabsInput.value = currentMax;

        toggleEnabled.checked =
          data.enabled !== undefined ? data.enabled : true;
        toggleBadge.checked =
          data.showBadge !== undefined ? data.showBadge : true;

        var history = Array.isArray(data.history) ? data.history : [];

        // Get current tab count from the service worker
        chrome.runtime.sendMessage({ type: 'getTabCount' }, function (res) {
          currentCount = res && typeof res.count === 'number' ? res.count : 0;
          updateStatusDisplay();
        });

        updateTodayStats(history);
        renderChart(history);
      }
    );
  }

  /* ---- Status display ---- */
  function updateStatusDisplay() {
    statusText.textContent = TabBrake.formatTabCount(currentCount, currentMax);

    var pct = TabBrake.getUsagePercent(currentCount, currentMax);
    progressBar.style.width = pct + '%';

    // Color transitions: green -> yellow -> red
    if (pct < 50) {
      progressBar.style.background = '#4CAF50';
    } else if (pct < 80) {
      progressBar.style.background = '#FF9800';
    } else {
      progressBar.style.background = '#e53935';
    }
  }

  /* ---- Today stats ---- */
  function updateTodayStats(history) {
    var now = new Date();
    var startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    var todayEntries = history.filter(function (e) {
      return e && e.timestamp >= startOfDay;
    });

    var stats = TabBrake.getTabStats(todayEntries);
    avgToday.textContent = stats.avgTabs;
    blockedToday.textContent = stats.timesBlocked;
    overriddenToday.textContent = stats.timesOverridden;
  }

  /* ---- 7-day chart ---- */
  function renderChart(history) {
    chart.innerHTML = '';

    var dailyData = TabBrake.getDailyAverage(history, 7);

    if (dailyData.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'chart-empty';
      empty.textContent = 'No data yet — check back tomorrow.';
      chart.appendChild(empty);
      return;
    }

    // Find the max value for scaling
    var maxVal = 0;
    for (var i = 0; i < dailyData.length; i++) {
      if (dailyData[i].avgCount > maxVal) maxVal = dailyData[i].avgCount;
    }
    // Ensure limit line is visible even if all days are under limit
    if (currentMax > maxVal) maxVal = currentMax;

    // Limit line position (percentage from bottom)
    var limitPct = maxVal > 0 ? (currentMax / maxVal) * 100 : 100;
    if (limitPct > 100) limitPct = 100;

    var limitLine = document.createElement('div');
    limitLine.className = 'chart-limit-line';
    limitLine.style.bottom = limitPct + '%';
    chart.appendChild(limitLine);

    // Day abbreviations
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (var j = 0; j < dailyData.length; j++) {
      var d = dailyData[j];
      var heightPct = maxVal > 0 ? (d.avgCount / maxVal) * 100 : 0;
      var overLimit = d.avgCount > currentMax;

      var wrapper = document.createElement('div');
      wrapper.className = 'chart-bar-wrapper';

      var bar = document.createElement('div');
      bar.className = 'chart-bar ' + (overLimit ? 'over-limit' : 'under-limit');
      bar.style.height = heightPct + '%';
      bar.title = d.date + ': ' + d.avgCount + ' avg tabs';

      var label = document.createElement('div');
      label.className = 'chart-label';
      // Show abbreviated day name from the date string
      var parts = d.date.split('-');
      var dateObj = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      label.textContent = dayNames[dateObj.getDay()];

      wrapper.appendChild(bar);
      wrapper.appendChild(label);
      chart.appendChild(wrapper);
    }
  }

  /* ---- Stepper controls ---- */
  btnMinus.addEventListener('click', function () {
    var val = parseInt(maxTabsInput.value, 10) || 8;
    if (val > 1) {
      maxTabsInput.value = val - 1;
      saveMaxTabs(val - 1);
    }
  });

  btnPlus.addEventListener('click', function () {
    var val = parseInt(maxTabsInput.value, 10) || 8;
    if (val < 50) {
      maxTabsInput.value = val + 1;
      saveMaxTabs(val + 1);
    }
  });

  maxTabsInput.addEventListener('change', function () {
    var val = parseInt(maxTabsInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 50) val = 50;
    maxTabsInput.value = val;
    saveMaxTabs(val);
  });

  function saveMaxTabs(val) {
    currentMax = val;
    chrome.storage.local.set({ maxTabs: val });
    updateStatusDisplay();
    chrome.runtime.sendMessage({ type: 'updateBadge' });
  }

  /* ---- Toggle handlers ---- */
  toggleEnabled.addEventListener('change', function () {
    chrome.storage.local.set({ enabled: toggleEnabled.checked });
  });

  toggleBadge.addEventListener('change', function () {
    chrome.storage.local.set({ showBadge: toggleBadge.checked });
    chrome.runtime.sendMessage({ type: 'updateBadge' });
  });
})();
