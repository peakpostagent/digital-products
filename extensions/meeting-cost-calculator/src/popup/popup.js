// popup.js — Meeting Cost Calculator popup logic
// Handles settings UI and displays meeting cost when on Google Calendar

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
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('calendar.google.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' });
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
      if (!tab.url || !tab.url.includes('calendar.google.com')) {
        // Not on Google Calendar — hide meeting section
        currentMeetingSection.classList.add('hidden');
        return;
      }

      // Show meeting section
      currentMeetingSection.classList.remove('hidden');

      // Ask content script for meeting data
      chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_DATA' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          meetingInfoEl.innerHTML = '<p class="meeting-label">Refresh the Google Calendar page to connect.</p>';
          return;
        }

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
    html += '<div class="meeting-cost-display">' + MeetingCost.formatCost(data.totalCost, currencySelect.value) + '</div>';

    // Progress bar (for live meetings)
    if (isLive && data.progress) {
      const pct = Math.round(data.progress.progress * 100);
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      html += '<div class="meeting-detail"><span>Elapsed</span><span class="meeting-detail-value">' +
        MeetingCost.formatDuration(data.progress.elapsedMinutes) + ' / ' +
        MeetingCost.formatDuration(data.durationMinutes) + '</span></div>';
    }

    // Details
    html += '<div class="meeting-detail"><span>Duration</span><span class="meeting-detail-value">' +
      MeetingCost.formatDuration(data.durationMinutes) + '</span></div>';
    html += '<div class="meeting-detail"><span>Attendees</span><span class="meeting-detail-value">' +
      data.attendeeCount + '</span></div>';
    html += '<div class="meeting-detail"><span>Cost/person</span><span class="meeting-detail-value">' +
      MeetingCost.formatCost(data.costPerPerson, currencySelect.value) + '</span></div>';
    html += '<div class="meeting-detail"><span>Cost/minute</span><span class="meeting-detail-value">' +
      MeetingCost.formatCost(data.costPerMinute, currencySelect.value) + '</span></div>';

    meetingInfoEl.innerHTML = html;
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
