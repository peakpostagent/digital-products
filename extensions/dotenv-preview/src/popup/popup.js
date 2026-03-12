// popup.js -- DotEnv Preview popup settings logic
// Handles loading and saving user preferences

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---- DOM Elements ----
  const autoFormatToggle = document.getElementById('auto-format');
  const maskSensitiveToggle = document.getElementById('mask-sensitive');
  const groupByPrefixToggle = document.getElementById('group-by-prefix');
  const showLineNumbersToggle = document.getElementById('show-line-numbers');
  const themeSelect = document.getElementById('theme-select');
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
      ['autoFormat', 'maskSensitive', 'groupByPrefix', 'showLineNumbers', 'theme'],
      (result) => {
        autoFormatToggle.checked = result.autoFormat !== false;      // default true
        maskSensitiveToggle.checked = result.maskSensitive !== false; // default true
        groupByPrefixToggle.checked = result.groupByPrefix !== false; // default true
        showLineNumbersToggle.checked = result.showLineNumbers !== false; // default true
        themeSelect.value = result.theme || 'auto';
      }
    );
  }

  /**
   * Save settings to chrome.storage.local and notify content scripts
   */
  function saveSettings() {
    const settingsObj = {
      autoFormat: autoFormatToggle.checked,
      maskSensitive: maskSensitiveToggle.checked,
      groupByPrefix: groupByPrefixToggle.checked,
      showLineNumbers: showLineNumbersToggle.checked,
      theme: themeSelect.value
    };

    chrome.storage.local.set(settingsObj, () => {
      showStatus('Settings saved!', 'success');
      notifyContentScripts();
    });
  }

  /**
   * Notify content scripts on matching tabs that settings changed
   */
  function notifyContentScripts() {
    chrome.tabs.query({}, (tabs) => {
      const patterns = [
        'github.com',
        'raw.githubusercontent.com',
        'gitlab.com',
        'bitbucket.org'
      ];

      for (const tab of tabs) {
        if (!tab.url) continue;
        const matches = patterns.some((pattern) => tab.url.includes(pattern));
        if (matches) {
          chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' }).catch(() => {
            // Tab might not have content script loaded -- that's fine
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
