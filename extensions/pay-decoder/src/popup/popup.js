// popup.js — Pay Decoder popup logic
// Handles settings UI for work schedule and display preferences

document.addEventListener('DOMContentLoaded', () => {
  // ---- DOM Elements ----
  const showConversionsToggle = document.getElementById('show-conversions');
  const hoursPerWeekInput = document.getElementById('hours-per-week');
  const weeksPerYearInput = document.getElementById('weeks-per-year');
  const currencySelect = document.getElementById('currency-select');
  const saveBtn = document.getElementById('save-btn');
  const statusEl = document.getElementById('status');

  // ---- Load saved settings on open ----
  loadSettings();

  // ---- Event Listeners ----
  saveBtn.addEventListener('click', saveSettings);

  /**
   * Load settings from chrome.storage.local and populate the form
   */
  function loadSettings() {
    chrome.storage.local.get(
      ['hoursPerWeek', 'weeksPerYear', 'currency', 'showConversions'],
      (result) => {
        hoursPerWeekInput.value = result.hoursPerWeek || PayDecoder.DEFAULTS.hoursPerWeek;
        weeksPerYearInput.value = result.weeksPerYear || PayDecoder.DEFAULTS.weeksPerYear;
        currencySelect.value = result.currency || PayDecoder.DEFAULTS.currency;
        showConversionsToggle.checked = result.showConversions !== false; // default true
      }
    );
  }

  /**
   * Save settings to chrome.storage.local and notify content scripts
   */
  function saveSettings() {
    const hoursPerWeek = parseInt(hoursPerWeekInput.value, 10);
    const weeksPerYear = parseInt(weeksPerYearInput.value, 10);
    const currency = currencySelect.value;
    const showConversions = showConversionsToggle.checked;

    // ---- Validation ----
    if (!hoursPerWeek || hoursPerWeek < 1 || hoursPerWeek > 168) {
      showStatus('Hours per week must be between 1 and 168', 'error');
      return;
    }
    if (!weeksPerYear || weeksPerYear < 1 || weeksPerYear > 52) {
      showStatus('Weeks per year must be between 1 and 52', 'error');
      return;
    }

    const settingsObj = {
      hoursPerWeek: hoursPerWeek,
      weeksPerYear: weeksPerYear,
      currency: currency,
      showConversions: showConversions
    };

    chrome.storage.local.set(settingsObj, () => {
      showStatus('Settings saved!', 'success');

      // Notify all matching content script tabs to refresh
      notifyContentScripts();
    });
  }

  /**
   * Notify content scripts on active job board tabs that settings changed
   */
  function notifyContentScripts() {
    chrome.tabs.query({}, (tabs) => {
      const jobBoardPatterns = [
        'linkedin.com/job',
        'indeed.com',
        'glassdoor.com/job',
        'glassdoor.com/Job'
      ];

      for (const tab of tabs) {
        if (!tab.url) continue;
        const isJobBoard = jobBoardPatterns.some((pattern) => tab.url.includes(pattern));
        if (isJobBoard) {
          chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' }).catch(() => {
            // Tab might not have content script loaded yet — that's fine
          });
        }
      }
    });
  }

  /**
   * Show a brief status message to the user
   *
   * @param {string} message - Text to display
   * @param {string} type - 'success' or 'error'
   */
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
    statusEl.classList.remove('hidden');

    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 2500);
  }
});
