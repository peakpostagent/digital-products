/**
 * AI Sidebar — Background service worker
 *
 * ExtKit Pro wiring + side-panel open-on-click. This example adds one
 * new pattern on top of seo-scanner / css-inspector: METERED free tier
 * (10 messages/day) enforced here in the worker, not in the UI, so it
 * can't be bypassed by editing popup state.
 */

import {
  loadExtPaySdk,
  startExtPay,
  fetchUserStatus,
  openPaymentPage,
  openTrialPage,
} from '../lib/extpay.js';
import { writePaidCache, readPaidCache } from '../lib/is-paid.js';

const FREE_MESSAGES_PER_DAY = 10;

let extpay = null;

(async function initExtPay() {
  try {
    await import(chrome.runtime.getURL('lib/extpay-sdk.js'));
    extpay = loadExtPaySdk();
    startExtPay(extpay);
    const status = await fetchUserStatus(extpay);
    await writePaidCache(status);
  } catch (err) {
    console.warn('[AI Sidebar] ExtensionPay init skipped:', err.message);
  }
})();

// Open side panel when the toolbar icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'extkit/refresh-paid-status') {
    fetchUserStatus(extpay).then(writePaidCache).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === 'extkit/open-payment') { openPaymentPage(extpay); return false; }
  if (msg?.type === 'extkit/open-trial') { openTrialPage(extpay); return false; }

  // --- Metered usage: the panel asks permission BEFORE each message ---
  if (msg?.type === 'ai-sidebar/consume-message-credit') {
    (async () => {
      const cached = await readPaidCache();
      if (cached?.paid) {
        sendResponse({ allowed: true, remaining: Infinity });
        return;
      }
      const todayKey = 'ai-sidebar:msgs:' + new Date().toISOString().slice(0, 10);
      const store = await chrome.storage.local.get([todayKey]);
      const used = store[todayKey] || 0;
      if (used >= FREE_MESSAGES_PER_DAY) {
        sendResponse({ allowed: false, remaining: 0, limit: FREE_MESSAGES_PER_DAY });
        return;
      }
      await chrome.storage.local.set({ [todayKey]: used + 1 });
      sendResponse({ allowed: true, remaining: FREE_MESSAGES_PER_DAY - used - 1, limit: FREE_MESSAGES_PER_DAY });
    })();
    return true;
  }
});

// Clean up old daily counters
chrome.alarms.create('ai-sidebar-cleanup', { periodInMinutes: 60 * 24 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'ai-sidebar-cleanup') return;
  chrome.storage.local.get(null, (all) => {
    const today = new Date().toISOString().slice(0, 10);
    const stale = Object.keys(all).filter((k) => k.startsWith('ai-sidebar:msgs:') && !k.endsWith(today));
    if (stale.length) chrome.storage.local.remove(stale);
  });
});
