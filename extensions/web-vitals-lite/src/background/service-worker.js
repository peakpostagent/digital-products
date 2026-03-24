/**
 * Web Vitals Lite — Background service worker
 * Relays vitals data between content scripts and the popup.
 * Stores the latest metrics per tab so the popup can display them on open.
 */

/* ── Per-tab metrics cache ──────────────────────────────────── */

var tabMetrics = {};

/* ── Message handler ────────────────────────────────────────── */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  // Content script reports updated vitals
  if (msg.type === 'vitals-update' && sender.tab) {
    tabMetrics[sender.tab.id] = {
      metrics: msg.metrics,
      url: msg.url
    };
    return;
  }

  // Popup requests current vitals for the active tab
  if (msg.type === 'get-tab-metrics') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length === 0) {
        sendResponse({ metrics: null });
        return;
      }
      var tabId = tabs[0].id;
      var data = tabMetrics[tabId] || null;
      sendResponse({ data: data });

      // Also ask the content script to send fresh data
      chrome.tabs.sendMessage(tabId, { type: 'get-metrics' }).catch(function () {
        // Tab might not have content script loaded; ignore
      });
    });
    return true; // async sendResponse
  }

  // Popup toggles badge visibility
  if (msg.type === 'toggle-badge') {
    chrome.storage.local.set({ badgeVisible: msg.visible });
    // Broadcast to all tabs
    chrome.tabs.query({}, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        chrome.tabs.sendMessage(tabs[i].id, {
          type: 'toggle-badge',
          visible: msg.visible
        }).catch(function () { /* ignore tabs without content script */ });
      }
    });
    return;
  }
});

/* ── Clean up when tabs close ────────────────────────────────── */

chrome.tabs.onRemoved.addListener(function (tabId) {
  delete tabMetrics[tabId];
});
