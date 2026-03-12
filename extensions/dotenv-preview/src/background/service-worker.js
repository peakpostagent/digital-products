// service-worker.js -- Background service worker for DotEnv Preview
// Handles extension install and provides default settings

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      autoFormat: true,
      maskSensitive: true,
      groupByPrefix: true,
      showLineNumbers: true,
      theme: 'auto'
    });
  }
});
