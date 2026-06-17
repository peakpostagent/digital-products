/**
 * Web Vitals Reporter — Apify Actor
 *
 * Measures Core Web Vitals (LCP, CLS, INP, FCP, TTFB) for a URL using Playwright.
 * Returns Google's pass/needs-improvement/poor classification for each metric
 * plus an overall Web Vitals letter grade.
 */

import { Actor } from 'apify';
import { chromium } from 'playwright';

// Constants must be declared before any top-level await that uses them.

// --- Google's Web Vitals thresholds (2026) ---
// https://web.dev/articles/vitals#core-web-vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function classify(metric, value) {
  if (value == null) return 'unknown';
  const t = THRESHOLDS[metric];
  if (!t) return 'unknown';
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
}

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
    const result = await measureVitals(browser, targetUrl);
    await Actor.pushData(result);
  }
} finally {
  await browser.close();
}

await Actor.exit();

async function measureVitals(browser, targetUrl) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (compatible; Apify-WebVitalsReporter/1.0; +https://apify.com)',
  });
  const page = await context.newPage();

  try {
    // Capture TTFB from the navigation timing
    const startTime = Date.now();
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Inject the web-vitals library before paint events stabilize
    // We use the official Google web-vitals UMD bundle from a CDN inline.
    await page.addScriptTag({
      url: 'https://unpkg.com/web-vitals@4.2.4/dist/web-vitals.iife.js',
    }).catch(() => {});

    // Set up collection
    await page.evaluate(() => {
      window.__vitals = {};
      if (window.webVitals) {
        window.webVitals.onLCP((m) => { window.__vitals.LCP = m.value; });
        window.webVitals.onCLS((m) => { window.__vitals.CLS = m.value; });
        window.webVitals.onINP((m) => { window.__vitals.INP = m.value; });
        window.webVitals.onFCP((m) => { window.__vitals.FCP = m.value; });
        window.webVitals.onTTFB((m) => { window.__vitals.TTFB = m.value; });
      }
    });

    // Trigger interaction so INP gets measured
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.mouse.move(100, 100);
    await page.mouse.move(300, 300, { steps: 5 });
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    // Force flush of pending CLS/INP measurements
    await page.evaluate(() => {
      if (document.hidden === false) {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }).catch(() => {});
    await page.waitForTimeout(500);

    const vitals = await page.evaluate(() => window.__vitals || {});

    // Fallback TTFB from navigation timing API
    const navTiming = await page.evaluate(() => {
      const t = performance.getEntriesByType('navigation')[0];
      if (!t) return null;
      return {
        ttfb: t.responseStart - t.requestStart,
        domContentLoaded: t.domContentLoadedEventEnd,
        loadComplete: t.loadEventEnd,
        transferSize: t.transferSize,
      };
    });

    if (vitals.TTFB == null && navTiming) vitals.TTFB = navTiming.ttfb;

    // --- Grade ---
    const metricStatuses = {
      LCP: classify('LCP', vitals.LCP),
      CLS: classify('CLS', vitals.CLS),
      INP: classify('INP', vitals.INP),
      FCP: classify('FCP', vitals.FCP),
      TTFB: classify('TTFB', vitals.TTFB),
    };

    // Core: LCP, CLS, INP — weight 2 each. Others: weight 1.
    const weights = { LCP: 2, CLS: 2, INP: 2, FCP: 1, TTFB: 1 };
    let maxScore = 0;
    let score = 0;
    for (const [m, w] of Object.entries(weights)) {
      const s = metricStatuses[m];
      if (s === 'unknown') continue;
      maxScore += w;
      if (s === 'good') score += w;
      else if (s === 'needs-improvement') score += w * 0.5;
    }
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    let grade;
    if (pct >= 95) grade = 'A+';
    else if (pct >= 85) grade = 'A';
    else if (pct >= 70) grade = 'B';
    else if (pct >= 55) grade = 'C';
    else if (pct >= 40) grade = 'D';
    else grade = 'F';

    return {
      url: targetUrl,
      finalUrl: page.url(),
      httpStatus: response?.status() ?? null,
      grade,
      percentage: Math.round(pct),
      lcp: vitals.LCP != null ? Math.round(vitals.LCP) : null,
      lcpStatus: metricStatuses.LCP,
      cls: vitals.CLS != null ? Math.round(vitals.CLS * 1000) / 1000 : null,
      clsStatus: metricStatuses.CLS,
      inp: vitals.INP != null ? Math.round(vitals.INP) : null,
      inpStatus: metricStatuses.INP,
      fcp: vitals.FCP != null ? Math.round(vitals.FCP) : null,
      fcpStatus: metricStatuses.FCP,
      ttfb: vitals.TTFB != null ? Math.round(vitals.TTFB) : null,
      ttfbStatus: metricStatuses.TTFB,
      navTiming,
      measuredAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      url: targetUrl,
      error: err.message,
      measuredAt: new Date().toISOString(),
    };
  } finally {
    await context.close();
  }
}
