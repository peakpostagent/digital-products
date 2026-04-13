// popup.js — Meeting Cost Calculator popup logic
// Handles settings UI, meeting cost display, weekly dashboard, and ratings

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const currencySelect = document.getElementById('currency-select');
  const btnHourly = document.getElementById('btn-hourly');
  const btnAnnual = document.getElementById('btn-annual');
  const yourRateInput = document.getElementById('your-rate');
  const defaultRateInput = document.getElementById('default-rate');
  const yourRateLabel = document.getElementById('your-rate-label');
  const defaultRateLabel = document.getElementById('default-rate-label');
  const saveBtn = document.getElementById('save-btn');
  const statusEl = document.getElementById('status');
  const currentMeetingSection = document.getElementById('current-meeting');
  const meetingInfoEl = document.getElementById('meeting-info');
  const weeklyDashboard = document.getElementById('weekly-dashboard');

  let currentRateType = 'hourly';

  // Load saved settings
  loadSettings();

  // Toggle between hourly and annual
  btnHourly.addEventListener('click', () => switchRateType('hourly'));
  btnAnnual.addEventListener('click', () => switchRateType('annual'));

  // Save button
  saveBtn.addEventListener('click', saveSettings);

  /**
   * Switch between hourly and annual rate input mode
   */
  function switchRateType(type) {
    currentRateType = type;
    const symbol = getCurrencySymbol();

    if (type === 'hourly') {
      btnHourly.classList.add('active');
      btnAnnual.classList.remove('active');
      yourRateLabel.textContent = 'Your rate (' + symbol + '/hr)';
      defaultRateLabel.textContent = 'Default attendee rate (' + symbol + '/hr)';
    } else {
      btnAnnual.classList.add('active');
      btnHourly.classList.remove('active');
      yourRateLabel.textContent = 'Your annual salary (' + symbol + '/yr)';
      defaultRateLabel.textContent = 'Default attendee salary (' + symbol + '/yr)';
    }
  }

  /**
   * Get currency symbol for the selected currency
   */
  function getCurrencySymbol() {
    const symbols = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', CAD: 'C$', AUD: 'A$', JPY: '\u00A5', INR: '\u20B9' };
    return symbols[currencySelect.value] || '$';
  }

  /**
   * Update labels when currency changes
   */
  currencySelect.addEventListener('change', () => {
    switchRateType(currentRateType);
  });

  /**
   * Load settings from chrome.storage.local
   */
  function loadSettings() {
    chrome.storage.local.get(
      ['yourRate', 'defaultRate', 'currency', 'rateType'],
      (result) => {
        const yourRate = result.yourRate || MeetingCost.DEFAULTS.yourRate;
        const defaultRate = result.defaultRate || MeetingCost.DEFAULTS.defaultRate;
        const currency = result.currency || MeetingCost.DEFAULTS.currency;
        const rateType = result.rateType || MeetingCost.DEFAULTS.rateType;

        currencySelect.value = currency;
        currentRateType = rateType;
        switchRateType(rateType);

        if (rateType === 'annual') {
          // Convert stored hourly back to annual for display
          yourRateInput.value = Math.round(yourRate * 2080);
          defaultRateInput.value = Math.round(defaultRate * 2080);
        } else {
          yourRateInput.value = yourRate;
          defaultRateInput.value = defaultRate;
        }

        // Try to get current meeting info from active tab
        fetchCurrentMeeting();

        // Load weekly dashboard
        loadWeeklyDashboard();
      }
    );
  }

  /**
   * Save settings to chrome.storage.local
   */
  function saveSettings() {
    let yourRate = parseFloat(yourRateInput.value) || 0;
    let defaultRate = parseFloat(defaultRateInput.value) || 0;

    // Validate
    if (yourRate < 0 || defaultRate < 0) {
      showStatus('Rates must be positive numbers', 'error');
      return;
    }

    // Convert annual to hourly for storage
    if (currentRateType === 'annual') {
      yourRate = MeetingCost.annualToHourly(yourRate);
      defaultRate = MeetingCost.annualToHourly(defaultRate);
    }

    const settings = {
      yourRate: Math.round(yourRate * 100) / 100,
      defaultRate: Math.round(defaultRate * 100) / 100,
      currency: currencySelect.value,
      rateType: currentRateType
    };

    chrome.storage.local.set(settings, () => {
      showStatus('Settings saved!', 'success');

      // Notify content script to update
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' }, () => {
            if (chrome.runtime.lastError) { /* tab doesn't have content script */ }
          });
        }
      });
    });
  }

  /**
   * Show a status message briefly
   */
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
    statusEl.classList.remove('hidden');

    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 2500);
  }

  /**
   * Fetch meeting data from the active tab's content script
   */
  function fetchCurrentMeeting() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      const tab = tabs[0];

      chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_DATA' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          currentMeetingSection.classList.add('hidden');
          return;
        }

        // Show meeting section
        currentMeetingSection.classList.remove('hidden');

        if (!response.hasMeeting) {
          meetingInfoEl.innerHTML = '<p class="meeting-label">Click on a calendar event to see its cost.</p>';
          return;
        }

        displayMeetingCost(response);
      });
    });
  }

  /**
   * Display meeting cost data in the popup
   */
  function displayMeetingCost(data) {
    const symbol = getCurrencySymbol();
    const isLive = data.progress && data.progress.isActive;

    let html = '';

    // Live badge
    if (isLive) {
      html += '<span class="live-badge">Live</span> ';
    }

    // Meeting title
    html += '<div style="font-weight:600; margin: 6px 0;">' + escapeHtml(data.title || 'Meeting') + '</div>';

    // Total cost
    html += '<div class="meeting-cost-display">' + escapeHtml(MeetingCost.formatCost(data.totalCost, currencySelect.value)) + '</div>';

    // Annual cost for recurring meetings
    if (data.annualCost && data.recurrenceFrequency) {
      html += '<div class="annual-cost-line">' +
        '&#x1F501; ~' + escapeHtml(MeetingCost.formatCost(data.annualCost, currencySelect.value)) +
        '/year (' + escapeHtml(data.recurrenceFrequency) + ')</div>';
    }

    // Progress bar (for live meetings)
    if (isLive && data.progress) {
      const pct = Math.round(data.progress.progress * 100);
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      html += '<div class="meeting-detail"><span>Elapsed</span><span class="meeting-detail-value">' +
        escapeHtml(MeetingCost.formatDuration(data.progress.elapsedMinutes)) + ' / ' +
        escapeHtml(MeetingCost.formatDuration(data.durationMinutes)) + '</span></div>';
    }

    // Details
    html += '<div class="meeting-detail"><span>Duration</span><span class="meeting-detail-value">' +
      escapeHtml(MeetingCost.formatDuration(data.durationMinutes)) + '</span></div>';
    html += '<div class="meeting-detail"><span>Attendees</span><span class="meeting-detail-value">' +
      escapeHtml(String(data.attendeeCount)) + '</span></div>';
    html += '<div class="meeting-detail"><span>Cost/person</span><span class="meeting-detail-value">' +
      escapeHtml(MeetingCost.formatCost(data.costPerPerson, currencySelect.value)) + '</span></div>';
    html += '<div class="meeting-detail"><span>Cost/minute</span><span class="meeting-detail-value">' +
      escapeHtml(MeetingCost.formatCost(data.costPerMinute, currencySelect.value)) + '</span></div>';

    // Manual recurring toggle (when recurrence not auto-detected)
    if (!data.recurrenceFrequency) {
      html += buildRecurringToggle(data);
    }

    meetingInfoEl.innerHTML = html;

    // Attach recurring toggle event handlers
    if (!data.recurrenceFrequency) {
      attachRecurringToggleHandlers(data);
    }
  }

  /**
   * Build the manual recurring meeting toggle HTML
   * @param {object} data - Meeting data
   * @returns {string} - HTML string
   */
  function buildRecurringToggle(data) {
    return '<div class="recurring-toggle">' +
      '<div class="recurring-row">' +
        '<input type="checkbox" id="recurring-check" class="recurring-checkbox">' +
        '<label for="recurring-check" style="cursor:pointer;">Recurring?</label>' +
        '<select id="recurring-freq" class="recurring-select" disabled>' +
          '<option value="weekly">Weekly</option>' +
          '<option value="biweekly">Biweekly</option>' +
          '<option value="monthly">Monthly</option>' +
          '<option value="daily">Daily</option>' +
        '</select>' +
      '</div>' +
      '<div id="manual-annual-cost" class="annual-cost-line hidden"></div>' +
    '</div>';
  }

  /**
   * Attach event handlers for the manual recurring toggle
   * @param {object} data - Meeting data
   */
  function attachRecurringToggleHandlers(data) {
    const checkbox = document.getElementById('recurring-check');
    const freqSelect = document.getElementById('recurring-freq');
    const annualEl = document.getElementById('manual-annual-cost');

    if (!checkbox || !freqSelect || !annualEl) return;

    checkbox.addEventListener('change', () => {
      freqSelect.disabled = !checkbox.checked;
      updateManualAnnualCost(data, checkbox.checked, freqSelect.value, annualEl);
    });

    freqSelect.addEventListener('change', () => {
      updateManualAnnualCost(data, checkbox.checked, freqSelect.value, annualEl);
    });
  }

  /**
   * Update the manual annual cost display
   */
  function updateManualAnnualCost(data, isRecurring, frequency, el) {
    if (!isRecurring) {
      el.classList.add('hidden');
      return;
    }

    const annualCost = MeetingCost.calculateAnnualCost(data.totalCost, frequency);
    if (annualCost > 0) {
      el.innerHTML = '&#x1F501; ~' +
        escapeHtml(MeetingCost.formatCost(annualCost, currencySelect.value)) +
        '/year (' + escapeHtml(frequency) + ')';
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  /**
   * Load and display the weekly dashboard
   */
  function loadWeeklyDashboard() {
    // Get weekly stats from service worker
    chrome.runtime.sendMessage({ type: 'GET_WEEKLY_STATS' }, (stats) => {
      if (chrome.runtime.lastError || !stats) {
        weeklyDashboard.classList.add('hidden');
        return;
      }

      const current = stats.currentWeek;

      // Only show dashboard if there's data
      if (current.totalMeetings === 0) {
        weeklyDashboard.classList.add('hidden');
        return;
      }

      weeklyDashboard.classList.remove('hidden');
      const symbol = getCurrencySymbol();

      // Summary grid
      document.getElementById('dash-total-meetings').textContent = current.totalMeetings;
      document.getElementById('dash-total-cost').textContent =
        MeetingCost.formatCost(current.totalCost, currencySelect.value);
      document.getElementById('dash-avg-cost').textContent =
        MeetingCost.formatCost(current.avgCost, currencySelect.value);

      // Extra stats
      let extraHtml = '';

      // Most expensive meeting
      if (current.mostExpensive) {
        extraHtml += '<div class="dash-stat-row">' +
          '<span>Most Expensive</span>' +
          '<span class="dash-stat-value">' +
            escapeHtml(truncateTitle(current.mostExpensive.title, 18)) + ' ' +
            escapeHtml(MeetingCost.formatCost(current.mostExpensive.cost, currencySelect.value)) +
          '</span></div>';
      }

      // Week comparison
      const prev = stats.prevWeek;
      if (prev.totalMeetings > 0) {
        const diff = current.totalCost - prev.totalCost;
        const pctChange = prev.totalCost > 0
          ? Math.round((diff / prev.totalCost) * 100)
          : 0;

        let compClass = 'comparison-neutral';
        let compText = 'Same as last week';

        if (pctChange > 0) {
          compClass = 'comparison-up';
          compText = '\u2191 ' + pctChange + '% vs last week';
        } else if (pctChange < 0) {
          compClass = 'comparison-down';
          compText = '\u2193 ' + Math.abs(pctChange) + '% vs last week';
        }

        extraHtml += '<div class="dash-stat-row">' +
          '<span>Trend</span>' +
          '<span class="' + compClass + '">' + escapeHtml(compText) + '</span></div>';
      }

      document.getElementById('dash-extra-stats').innerHTML = extraHtml;

      // Meeting Efficiency Score
      displayEfficiency(current);

      // Load chart data
      loadChartData();
    });
  }

  /**
   * Display the Meeting Efficiency Score
   * @param {object} weekStats - Current week stats
   */
  function displayEfficiency(weekStats) {
    const effSection = document.getElementById('dash-efficiency');
    const effFill = document.getElementById('dash-efficiency-fill');
    const effValue = document.getElementById('dash-efficiency-value');
    const effDetail = document.getElementById('dash-efficiency-detail');

    if (weekStats.ratedCount === 0) {
      effSection.classList.add('hidden');
      return;
    }

    effSection.classList.remove('hidden');
    const pct = weekStats.valuablePercent;

    effFill.style.width = pct + '%';
    effFill.className = 'efficiency-fill';
    if (pct < 40) {
      effFill.classList.add('low');
    } else if (pct < 70) {
      effFill.classList.add('medium');
    }

    effValue.textContent = pct + '%';
    effDetail.textContent = weekStats.ratedCount + ' of ' +
      weekStats.totalMeetings + ' meetings rated, ' +
      pct + '% rated valuable';
  }

  /**
   * Load and render the 4-week bar chart
   */
  function loadChartData() {
    chrome.runtime.sendMessage({ type: 'GET_CHART_DATA' }, (chartData) => {
      if (chrome.runtime.lastError || !chartData || !chartData.length) return;

      const chartEl = document.getElementById('dash-chart');
      if (!chartEl) return;

      // Find max cost for scaling
      const maxCost = Math.max(...chartData.map((d) => d.totalCost), 1);

      let chartHtml = '';
      chartData.forEach((week, i) => {
        const heightPct = maxCost > 0 ? (week.totalCost / maxCost) * 100 : 0;
        const isCurrentWeek = i === chartData.length - 1;
        const barClass = isCurrentWeek ? 'chart-bar current' : 'chart-bar';

        // Format week label (e.g., "W15")
        const weekLabel = week.weekKey.split('-')[1] || week.weekKey;

        chartHtml += '<div class="chart-bar-group">' +
          '<div class="chart-bar-value">' +
            escapeHtml(MeetingCost.formatCost(week.totalCost, currencySelect.value)) +
          '</div>' +
          '<div class="' + barClass + '" style="height:' + Math.max(heightPct, 5) + '%"></div>' +
          '<div class="chart-bar-label">' + escapeHtml(weekLabel) + '</div>' +
        '</div>';
      });

      chartEl.innerHTML = chartHtml;
    });
  }

  /**
   * Truncate a title to maxLen characters
   * @param {string} title
   * @param {number} maxLen
   * @returns {string}
   */
  function truncateTitle(title, maxLen) {
    if (!title) return '';
    if (title.length <= maxLen) return title;
    return title.substring(0, maxLen - 1) + '\u2026';
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
