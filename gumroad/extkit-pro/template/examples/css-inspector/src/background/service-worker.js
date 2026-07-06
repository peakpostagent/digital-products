/**
 * CSS Inspector — Background service worker
 * Identical ExtKit Pro wiring as the seo-scanner example. See that
 * example's README for the walkthrough; this file exists so buyers see
 * the pattern repeated verbatim across different feature domains.
 */

import {
  loadExtPaySdk,
  startExtPay,
  fetchUserStatus,
  openPaymentPage,
  openTrialPage,
} from '../lib/extpay.js';
import { writePaidCache } from '../lib/is-paid.js';

let extpay = null;

(async function initExtPay() {
  try {
    await import(chrome.runtime.getURL('lib/extpay-sdk.js'));
    extpay = loadExtPaySdk();
    startExtPay(extpay);
    const status = await fetchUserStatus(extpay);
    await writePaidCache(status);
  } catch (err) {
    console.warn('[CSS Inspector] ExtensionPay init skipped:', err.message);
  }
})();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'extkit/refresh-paid-status') {
    fetchUserStatus(extpay).then(writePaidCache).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === 'extkit/open-payment') { openPaymentPage(extpay); return false; }
  if (msg?.type === 'extkit/open-trial') { openTrialPage(extpay); return false; }
});
