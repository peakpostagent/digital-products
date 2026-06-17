/**
 * ExtKit Pro — Paywall modal logic
 *
 * Import + call setupPaywall() from your popup.js. The function wires the
 * dialog buttons to send a message to the service worker, which calls
 * ExtensionPay's openPaymentPage / openTrialPage.
 *
 * Pricing is sourced from extpay-config.js so changes propagate.
 *
 * @example
 *   import { setupPaywall, showPaywall } from './paywall.js';
 *   setupPaywall();
 *   gatedButton.addEventListener('click', async () => {
 *     if (!(await isPaid())) return showPaywall();
 *     // ...feature code
 *   });
 */

import { config } from '../lib/extpay.js';

let dialogEl = null;

/**
 * Wire up the dialog. Call once per popup load.
 */
export function setupPaywall() {
  dialogEl = document.getElementById('extkit-paywall');
  if (!dialogEl) {
    console.warn('[ExtKit Pro] Paywall dialog not found in DOM — did you include paywall.html?');
    return;
  }

  // Sync prices from config so the kit can be customized in one place.
  const monthlyEl = document.getElementById('extkit-paywall-monthly-price');
  const yearlyEl = document.getElementById('extkit-paywall-yearly-price');
  const savingsEl = document.getElementById('extkit-paywall-yearly-savings');
  if (monthlyEl) monthlyEl.textContent = config.PRICE_MONTHLY;
  if (yearlyEl) yearlyEl.textContent = config.PRICE_YEARLY;
  if (savingsEl) savingsEl.textContent = 'Save ' + config.YEARLY_DISCOUNT_PCT + '%';

  // Hide trial CTA when not enabled
  const trialBtn = document.getElementById('extkit-paywall-trial');
  if (trialBtn && !config.TRIAL_ENABLED) trialBtn.style.display = 'none';

  document.getElementById('extkit-paywall-close')
    ?.addEventListener('click', hidePaywall);
  document.getElementById('extkit-paywall-upgrade')
    ?.addEventListener('click', () => sendMessage('extkit/open-payment'));
  trialBtn?.addEventListener('click', () => sendMessage('extkit/open-trial'));

  // Click outside dialog closes it
  dialogEl.addEventListener('click', (e) => {
    if (e.target === dialogEl) hidePaywall();
  });
}

export function showPaywall() {
  if (!dialogEl) setupPaywall();
  if (!dialogEl) return;
  if (typeof dialogEl.showModal === 'function') {
    dialogEl.showModal();
  } else {
    dialogEl.setAttribute('open', '');
  }
}

export function hidePaywall() {
  if (!dialogEl) return;
  if (typeof dialogEl.close === 'function') {
    dialogEl.close();
  } else {
    dialogEl.removeAttribute('open');
  }
}

function sendMessage(type) {
  try {
    chrome.runtime.sendMessage({ type });
  } catch (err) {
    console.warn('[ExtKit Pro] Paywall message failed:', err);
  }
  hidePaywall();
}
