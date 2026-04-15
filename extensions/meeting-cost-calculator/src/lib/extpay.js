// extpay.js — ExtensionPay integration wrapper for Meeting Cost Calculator
// Loaded in the service worker to manage subscription state.
//
// This is a lightweight shim around the official ExtensionPay SDK.
// The real SDK (extpay.js) must be loaded alongside this file — see INSTALL.md
// for the exact drop-in steps from https://extensionpay.com/docs.
//
// Design notes:
// - We DO NOT bundle the ExtensionPay SDK directly; the launcher step copies it
//   into src/lib/extpay-sdk.js so the maintainer can audit the vendored version.
// - All billing, refunds, and subscription lifecycle are handled by ExtensionPay.
// - If ExtensionPay is not configured (no extensionId), isPaid() returns false
//   and the extension runs as pure free tier. This keeps the free experience
//   intact for existing users.

// The ExtensionPay extension ID — set this to match the name you register on
// https://extensionpay.com. Until this is configured (see INSTALL.md), Pro
// features stay locked for everyone.
const EXTPAY_EXTENSION_ID = 'meeting-cost-calculator';

// Feature flag — while false, the whole Pro surface is hidden (useful during
// review, A/B testing, or if ExtensionPay is down). Launch checklist flips
// this to true once the ExtensionPay product is approved.
const PRO_ENABLED = true;

// Trial length (days) for new installs. ExtensionPay tracks trial state per
// user; we just surface the number in the UI.
const TRIAL_DAYS = 14;

/**
 * Lazily load the official ExtensionPay SDK if it exists.
 * Returns null if the SDK file isn't present — callers should gracefully fall
 * back to the free tier in that case.
 */
function loadExtPaySdk() {
  try {
    // ExtensionPay exposes itself as a global `ExtPay` when imported via
    // importScripts in the service worker.
    if (typeof ExtPay === 'function') {
      return ExtPay(EXTPAY_EXTENSION_ID);
    }
  } catch (err) {
    console.warn('[MCC Pro] ExtensionPay SDK not available:', err);
  }
  return null;
}

/**
 * Initialise the ExtensionPay polling/listener. Safe to call more than once.
 * @param {object} extpay — The ExtPay instance (or null if unavailable)
 */
function startExtPay(extpay) {
  if (!extpay || typeof extpay.startBackground !== 'function') return;
  try {
    extpay.startBackground();
  } catch (err) {
    console.warn('[MCC Pro] Failed to start ExtensionPay background:', err);
  }
}

/**
 * Get the current subscription status from ExtensionPay.
 * @param {object} extpay — ExtPay instance
 * @returns {Promise<{paid: boolean, trialStartedAt: number|null, subscriptionStatus: string}>}
 */
async function fetchUserStatus(extpay) {
  if (!extpay || typeof extpay.getUser !== 'function') {
    return { paid: false, trialStartedAt: null, subscriptionStatus: 'free' };
  }
  try {
    const user = await extpay.getUser();
    return {
      paid: Boolean(user && user.paid),
      trialStartedAt: user && user.trialStartedAt
        ? new Date(user.trialStartedAt).getTime()
        : null,
      subscriptionStatus: user && user.subscriptionStatus
        ? user.subscriptionStatus
        : (user && user.paid ? 'active' : 'free')
    };
  } catch (err) {
    console.warn('[MCC Pro] Unable to fetch ExtensionPay user:', err);
    return { paid: false, trialStartedAt: null, subscriptionStatus: 'unknown' };
  }
}

/**
 * Open the ExtensionPay-hosted payment page.
 * Called from the popup's "Upgrade to Pro" CTA.
 */
function openPaymentPage(extpay) {
  if (!extpay || typeof extpay.openPaymentPage !== 'function') {
    // Fallback: open the marketing page so the user still has a path forward.
    chrome.tabs.create({ url: 'https://extensionpay.com/extension/' + EXTPAY_EXTENSION_ID });
    return;
  }
  extpay.openPaymentPage();
}

/**
 * Open the hosted trial page (ExtensionPay handles the trial token).
 */
function openTrialPage(extpay) {
  if (!extpay || typeof extpay.openTrialPage !== 'function') return;
  extpay.openTrialPage(TRIAL_DAYS + '-day');
}

// Expose for service worker (importScripts) and tests
self.MccPro = {
  EXTPAY_EXTENSION_ID,
  PRO_ENABLED,
  TRIAL_DAYS,
  loadExtPaySdk,
  startExtPay,
  fetchUserStatus,
  openPaymentPage,
  openTrialPage
};
