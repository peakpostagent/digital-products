// service-worker.js — MV3 background service worker

// Handle extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First install: could open a welcome page in the future
    console.log('Job Match Score installed');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE' && sender.tab) {
    const score = message.score;
    const text = score > 0 ? score.toString() : '';

    let color;
    if (score >= 70) color = '#22c55e';
    else if (score >= 40) color = '#eab308';
    else color = '#ef4444';

    chrome.action.setBadgeText({ text, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color, tabId: sender.tab.id });
  }
});
