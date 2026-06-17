/**
 * SEO Scanner — Background service worker
 *
 * This example wires the ExtKit Pro paywall layer to the SEO scanner's
 * Pro features (full report + export). Copy-paste this into your own
 * extension as a starting point.
 */

import {
  loadExtPaySdk,
  startExtPay,
  fetchUserStatus,
  openPaymentPage,
  openTrialPage,
} from '../lib/extpay.js';
import { writePaidCache, clearPaidCache } from '../lib/is-paid.js';

// importScripts is the legacy SDK loading mechanism. With "type":"module"
// in manifest.json, we use dynamic import instead.
let extpay = null;

(async function initExtPay() {
  try {
    // ExtensionPay's SDK lives at lib/extpay-sdk.js after vendoring (see lib/README)
    await import(chrome.runtime.getURL('lib/extpay-sdk.js'));
    extpay = loadExtPaySdk();
    startExtPay(extpay);
    // Refresh paid status every time the worker boots
    const status = await fetchUserStatus(extpay);
    await writePaidCache(status);
  } catch (err) {
    console.warn('[SEO Scanner] ExtensionPay init skipped:', err.message);
  }
})();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'extkit/refresh-paid-status') {
    fetchUserStatus(extpay).then(writePaidCache).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === 'extkit/open-payment') {
    openPaymentPage(extpay);
    return false;
  }
  if (msg?.type === 'extkit/open-trial') {
    openTrialPage(extpay);
    return false;
  }
  if (msg?.type === 'extkit/clear-cache') {
    clearPaidCache().then(() => sendResponse({ ok: true }));
    return true;
  }
});

// Daily cache cleanup
chrome.alarms.create('extkit-cleanup', { periodInMinutes: 60 * 24 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'extkit-cleanup') return;
  chrome.storage.local.get(null, (all) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const stale = [];
    Object.keys(all).forEach((k) => {
      if (k.startsWith('seo-scan:') && all[k]?.ts < cutoff) stale.push(k);
    });
    if (stale.length) chrome.storage.local.remove(stale);
  });
});
