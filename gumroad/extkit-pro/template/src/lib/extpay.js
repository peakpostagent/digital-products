/**
 * ExtKit Pro — Generic ExtensionPay wrapper
 *
 * Loaded in the service worker. Wraps the vendored ExtensionPay SDK
 * (lib/extpay-sdk.js) with safer null-checks and a uniform API surface.
 *
 * Extracted from Meeting Cost Calculator Pro (the kit author's flagship
 * paid extension) and de-coupled for reuse. Do not edit the function names
 * — popup.js and background/service-worker.js depend on them.
 *
 * Design notes:
 *  - We DO NOT bundle the ExtensionPay SDK directly; the kit ships it as
 *    a vendored file (lib/extpay-sdk.js) so you can audit upstream changes.
 *  - If ExtensionPay is not configured (PRO_ENABLED=false or no extension
 *    ID), isPaid() returns false and the extension runs as pure free tier.
 *  - All console messages are prefixed with [ExtKit Pro] so users can
 *    filter them in DevTools.
 */

import {
  EXTPAY_EXTENSION_ID,
  PRO_ENABLED,
  TRIAL_DAYS,
  TRIAL_ENABLED,
  PRICE_MONTHLY,
  PRICE_YEARLY,
  YEARLY_DISCOUNT_PCT,
} from './extpay-config.js';

/**
 * Lazily load the official ExtensionPay SDK if it has been imported.
 * Returns null if the SDK file isn't present — callers should gracefully
 * fall back to the free tier in that case.
 */
export function loadExtPaySdk() {
  try {
    if (!PRO_ENABLED) return null;
    if (typeof ExtPay === 'function') {
      return ExtPay(EXTPAY_EXTENSION_ID);
    }
  } catch (err) {
    console.warn('[ExtKit Pro] ExtensionPay SDK not available:', err);
  }
  return null;
}

/**
 * Start the ExtensionPay background polling/listener. Safe to call
 * multiple times — the SDK guards against double-start internally.
 */
export function startExtPay(extpay) {
  if (!extpay || typeof extpay.startBackground !== 'function') return;
  try {
    extpay.startBackground();
  } catch (err) {
    console.warn('[ExtKit Pro] Failed to start ExtensionPay background:', err);
  }
}

/**
 * Get the current subscription status from ExtensionPay.
 * @returns {Promise<{paid: boolean, trialStartedAt: number|null, subscriptionStatus: string}>}
 */
export async function fetchUserStatus(extpay) {
  if (!extpay || typeof extpay.getUser !== 'function') {
    return { paid: false, trialStartedAt: null, subscriptionStatus: 'free' };
  }
  try {
    const user = await extpay.getUser();
    return {
      paid: Boolean(user && user.paid),
      trialStartedAt:
        user && user.trialStartedAt
          ? new Date(user.trialStartedAt).getTime()
          : null,
      subscriptionStatus:
        user && user.subscriptionStatus
          ? user.subscriptionStatus
          : user && user.paid
            ? 'active'
            : 'free',
    };
  } catch (err) {
    console.warn('[ExtKit Pro] Unable to fetch ExtensionPay user:', err);
    return { paid: false, trialStartedAt: null, subscriptionStatus: 'unknown' };
  }
}

/**
 * Open the ExtensionPay-hosted payment page.
 * Called from the popup's "Upgrade to Pro" CTA.
 */
export function openPaymentPage(extpay) {
  if (!extpay || typeof extpay.openPaymentPage !== 'function') {
    chrome.tabs.create({
      url: 'https://extensionpay.com/extension/' + EXTPAY_EXTENSION_ID,
    });
    return;
  }
  extpay.openPaymentPage();
}

/**
 * Open the hosted trial page.
 */
export function openTrialPage(extpay) {
  if (!extpay || typeof extpay.openTrialPage !== 'function') return;
  extpay.openTrialPage(TRIAL_DAYS + '-day');
}

export const config = {
  EXTPAY_EXTENSION_ID,
  PRO_ENABLED,
  TRIAL_DAYS,
  TRIAL_ENABLED,
  PRICE_MONTHLY,
  PRICE_YEARLY,
  YEARLY_DISCOUNT_PCT,
};
