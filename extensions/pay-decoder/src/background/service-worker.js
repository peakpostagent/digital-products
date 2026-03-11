// service-worker.js — Background service worker for Pay Decoder
// Handles extension install and provides default settings

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      hoursPerWeek: 40,
      weeksPerYear: 52,
      currency: 'USD',
      showConversions: true
    });
  }
});
