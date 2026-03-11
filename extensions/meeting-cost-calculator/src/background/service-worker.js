// service-worker.js — Background service worker for Meeting Cost Calculator
// Handles extension install and provides default settings

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      yourRate: 50,
      defaultRate: 50,
      currency: 'USD',
      rateType: 'hourly'
    });
  }
});
