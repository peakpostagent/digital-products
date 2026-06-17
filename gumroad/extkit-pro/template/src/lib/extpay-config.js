/**
 * ExtKit Pro — ExtensionPay configuration
 *
 * Edit the constants below to match your ExtensionPay product.
 *
 * Reference: https://extensionpay.com/docs
 *
 * Required setup (5 minutes):
 *  1. Create an ExtensionPay product at https://extensionpay.com/extensions
 *  2. Copy the "extension-id" (URL-safe slug) and paste it as EXTPAY_EXTENSION_ID
 *  3. Configure your Plans (monthly / yearly) on ExtensionPay
 *  4. Update PRICE_MONTHLY + PRICE_YEARLY below to match the displayed prices
 *  5. Leave PRO_ENABLED=false during CWS review; flip to true after approval
 */

// Your unique product ID at https://extensionpay.com/extensions/<id>
// Until this is set, the extension runs in free-only mode.
export const EXTPAY_EXTENSION_ID = 'your-extension-id-here';

// Master kill switch. Keep false during initial CWS submission so reviewers
// see a free experience; flip to true once your Plans are configured.
export const PRO_ENABLED = false;

// Trial length in days. ExtensionPay enforces the trial on their side; this
// constant is only used to render the CTA copy in the upgrade banner.
export const TRIAL_DAYS = 14;

// When false, the "Start free trial" CTA is hidden and only "Upgrade now"
// renders. ExtensionPay still enforces eligibility on their side, so this
// is purely a UI toggle.
export const TRIAL_ENABLED = true;

// Pricing displayed in the UI. Must match your ExtensionPay Plans exactly.
export const PRICE_MONTHLY = '$4.99/mo';
export const PRICE_YEARLY = '$39/yr';
export const YEARLY_DISCOUNT_PCT = 35;

// Optional analytics integration — leave empty if not used.
export const ANALYTICS_EVENT_PREFIX = 'extkit_pro';
