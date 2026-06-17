/**
 * PWA Audit — Apify Actor
 *
 * Checks if a URL meets Progressive Web App installability criteria.
 * Validates the Web App Manifest, service worker registration, HTTPS,
 * icon sizes, and required manifest fields. Returns a checklist + grade.
 */

import { Actor } from 'apify';
import { chromium } from 'playwright';

// --- Constants must be declared BEFORE the top-level await that uses them.
// In ES modules, `const` lives in the temporal dead zone until evaluated. ---

/**
 * PWA installability criteria — adapted from Chrome's installability requirements.
 * https://web.dev/articles/install-criteria
 */
const CHECKS = [
  { key: 'https', name: 'HTTPS or localhost', severity: 'critical', weight: 15 },
  { key: 'manifestPresent', name: 'Web App Manifest linked', severity: 'critical', weight: 15 },
  { key: 'manifestValid', name: 'Manifest parses as valid JSON', severity: 'critical', weight: 10 },
  { key: 'hasName', name: 'Manifest has `name`', severity: 'critical', weight: 5 },
  { key: 'hasShortName', name: 'Manifest has `short_name`', severity: 'important', weight: 3 },
  { key: 'hasStartUrl', name: 'Manifest has `start_url`', severity: 'critical', weight: 5 },
  { key: 'hasDisplay', name: 'Manifest `display` is standalone / fullscreen / minimal-ui', severity: 'critical', weight: 8 },
  { key: 'hasIcon192', name: 'Has a 192×192 (or larger) icon', severity: 'critical', weight: 8 },
  { key: 'hasIcon512', name: 'Has a 512×512 (or larger) icon', severity: 'critical', weight: 8 },
  { key: 'hasMaskableIcon', name: 'Has at least one maskable icon', severity: 'important', weight: 5 },
  { key: 'hasThemeColor', name: 'Manifest has `theme_color`', severity: 'important', weight: 4 },
  { key: 'hasBackgroundColor', name: 'Manifest has `background_color`', severity: 'important', weight: 4 },
  { key: 'serviceWorkerRegistered', name: 'Service worker is registered', severity: 'critical', weight: 10 },
];

const SEVERITY_MULT = { critical: 1.5, important: 1.0, optional: 0.6 };

// --- Boot ---
await Actor.init();

const input = (await Actor.getInput()) || {};
const urls = Array.isArray(input.urls) && input.urls.length
  ? input.urls.slice(0, 1000)
  : input.url
    ? [input.url]
    : null;

if (!urls) {
  await Actor.fail('Input must include `url` (string) or `urls` (array).');
}

const browser = await chromium.launch({
  args: ['--disable-blink-features=AutomationControlled'],
});

try {
  for (const targetUrl of urls) {
    const result = await auditPwa(browser, targetUrl);
    await Actor.pushData(result);
  }
} finally {
  await browser.close();
}

await Actor.exit();

async function auditPwa(browser, targetUrl) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (compatible; Apify-PWAAudit/1.0; +https://apify.com)',
  });
  const page = await context.newPage();

  const checks = {};
  let manifest = null;
  let manifestUrl = null;
  let manifestError = null;
  let serviceWorker = null;

  try {
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // HTTPS check (also localhost is fine)
    const finalUrl = new URL(page.url());
    checks.https =
      finalUrl.protocol === 'https:' ||
      finalUrl.hostname === 'localhost' ||
      finalUrl.hostname === '127.0.0.1';

    // Find manifest link
    const manifestHref = await page.evaluate(() => {
      const el = document.querySelector('link[rel="manifest"]');
      return el ? el.href : null;
    });
    checks.manifestPresent = !!manifestHref;
    manifestUrl = manifestHref;

    if (manifestHref) {
      try {
        const manifestResp = await page.goto(manifestHref, { waitUntil: 'load', timeout: 10000 });
        const text = await manifestResp.text();
        try {
          manifest = JSON.parse(text);
          checks.manifestValid = true;
        } catch (e) {
          manifestError = 'JSON parse error: ' + e.message;
          checks.manifestValid = false;
        }
      } catch (e) {
        manifestError = 'Manifest fetch failed: ' + e.message;
        checks.manifestValid = false;
      }

      if (manifest) {
        checks.hasName = !!(manifest.name && manifest.name.trim());
        checks.hasShortName = !!(manifest.short_name && manifest.short_name.trim());
        checks.hasStartUrl = !!(manifest.start_url);
        const validDisplay = ['standalone', 'fullscreen', 'minimal-ui'];
        checks.hasDisplay = !!(manifest.display && validDisplay.includes(manifest.display));
        checks.hasThemeColor = !!manifest.theme_color;
        checks.hasBackgroundColor = !!manifest.background_color;
        const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
        checks.hasIcon192 = icons.some((ic) => maxSize(ic.sizes) >= 192);
        checks.hasIcon512 = icons.some((ic) => maxSize(ic.sizes) >= 512);
        checks.hasMaskableIcon = icons.some(
          (ic) => typeof ic.purpose === 'string' && ic.purpose.split(/\s+/).includes('maskable')
        );
      } else {
        checks.hasName = false;
        checks.hasShortName = false;
        checks.hasStartUrl = false;
        checks.hasDisplay = false;
        checks.hasThemeColor = false;
        checks.hasBackgroundColor = false;
        checks.hasIcon192 = false;
        checks.hasIcon512 = false;
        checks.hasMaskableIcon = false;
      }
    } else {
      checks.manifestValid = false;
      checks.hasName = false;
      checks.hasShortName = false;
      checks.hasStartUrl = false;
      checks.hasDisplay = false;
      checks.hasThemeColor = false;
      checks.hasBackgroundColor = false;
      checks.hasIcon192 = false;
      checks.hasIcon512 = false;
      checks.hasMaskableIcon = false;
    }

    // Service worker registration check — re-navigate to the original URL
    if (page.url() !== targetUrl) {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    serviceWorker = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        return {
          supported: true,
          registrationCount: regs.length,
          scopes: regs.map((r) => r.scope),
          active: regs.some((r) => r.active),
        };
      } catch (e) {
        return { supported: true, error: e.message };
      }
    });
    checks.serviceWorkerRegistered = !!(serviceWorker && serviceWorker.registrationCount > 0);

    // --- Grade ---
    let maxScore = 0;
    let score = 0;
    const checklist = [];
    for (const check of CHECKS) {
      const mult = SEVERITY_MULT[check.severity];
      const w = check.weight * mult;
      maxScore += w;
      const passed = !!checks[check.key];
      if (passed) score += w;
      checklist.push({
        check: check.name,
        passed,
        severity: check.severity,
        weight: check.weight,
      });
    }
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    let grade;
    if (pct >= 95) grade = 'A+';
    else if (pct >= 85) grade = 'A';
    else if (pct >= 70) grade = 'B';
    else if (pct >= 55) grade = 'C';
    else if (pct >= 40) grade = 'D';
    else grade = 'F';

    const isInstallable =
      checks.https &&
      checks.manifestValid &&
      checks.hasName &&
      checks.hasStartUrl &&
      checks.hasDisplay &&
      checks.hasIcon192 &&
      checks.hasIcon512 &&
      checks.serviceWorkerRegistered;

    return {
      url: targetUrl,
      finalUrl: page.url(),
      httpStatus: response?.status() ?? null,
      grade,
      percentage: Math.round(pct),
      isInstallable,
      manifestUrl,
      manifest,
      manifestError,
      serviceWorker,
      checklist,
      scannedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url: targetUrl,
      error: err.message,
      scannedAt: new Date().toISOString(),
    };
  } finally {
    await context.close();
  }
}

function maxSize(sizesAttr) {
  if (!sizesAttr) return 0;
  if (sizesAttr === 'any') return 99999;
  const sizes = sizesAttr.split(/\s+/);
  let max = 0;
  for (const s of sizes) {
    const match = s.match(/(\d+)x(\d+)/i);
    if (match) {
      const n = Math.min(parseInt(match[1], 10), parseInt(match[2], 10));
      if (n > max) max = n;
    }
  }
  return max;
}
