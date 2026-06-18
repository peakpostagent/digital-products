/**
 * Color Contrast Auditor — Apify Actor
 *
 * Audits a webpage for WCAG 2.2 color contrast compliance.
 * Returns a structured report of every text element with foreground/background colors,
 * computed contrast ratio, and AA/AAA pass/fail flags.
 *
 * Port of the Color Contrast Checker Chrome extension to a programmatic API.
 */

import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const input = (await Actor.getInput()) || {};

// Accept either { url } or { urls: [...] }. Falls back to https://example.com
// so Apify's daily auto-test passes when no input is supplied.
const urls = Array.isArray(input.urls) && input.urls.length
  ? input.urls.slice(0, 1000)
  : input.url
    ? [input.url]
    : ['https://example.com'];

const browser = await chromium.launch({
  args: ['--disable-blink-features=AutomationControlled'],
});

try {
  for (const targetUrl of urls) {
    const result = await auditUrl(browser, targetUrl);
    await Actor.pushData(result);
  }
} finally {
  await browser.close();
}

await Actor.exit();

/**
 * Audit a single URL for color contrast and return a structured report.
 */
async function auditUrl(browser, targetUrl) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (compatible; Apify-ColorContrastAuditor/1.0; +https://apify.com)',
  });
  const page = await context.newPage();

  try {
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const audit = await page.evaluate(() => {
      // --- WCAG helpers (run in page context) ---
      function parseColor(s) {
        if (!s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') {
          return { r: 0, g: 0, b: 0, a: 0 };
        }
        const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s]+([\d.]+))?/i);
        if (!m) return null;
        return {
          r: parseFloat(m[1]),
          g: parseFloat(m[2]),
          b: parseFloat(m[3]),
          a: m[4] != null ? parseFloat(m[4]) : 1,
        };
      }
      function blend(fg, bg) {
        const a = fg.a;
        return {
          r: fg.r * a + bg.r * (1 - a),
          g: fg.g * a + bg.g * (1 - a),
          b: fg.b * a + bg.b * (1 - a),
          a: 1,
        };
      }
      function relLum(c) {
        const v = [c.r, c.g, c.b].map((ch) => {
          const x = ch / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
      }
      function contrast(a, b) {
        const la = relLum(a);
        const lb = relLum(b);
        const [hi, lo] = la > lb ? [la, lb] : [lb, la];
        return (hi + 0.05) / (lo + 0.05);
      }
      function resolveBg(el) {
        let cur = el;
        let acc = { r: 0, g: 0, b: 0, a: 0 };
        while (cur && cur !== document.documentElement) {
          const cs = getComputedStyle(cur);
          const c = parseColor(cs.backgroundColor);
          if (c && c.a > 0) {
            acc = acc.a === 0 ? c : blend(acc, c);
            if (acc.a >= 0.99) return acc;
          }
          cur = cur.parentElement;
        }
        // Fallback to body or white
        const body = parseColor(getComputedStyle(document.body).backgroundColor);
        if (body && body.a > 0) return acc.a === 0 ? body : blend(acc, body);
        return { r: 255, g: 255, b: 255, a: 1 };
      }
      function selector(el) {
        if (el.id) return '#' + el.id;
        const tag = el.tagName.toLowerCase();
        const cls = el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
          : '';
        return tag + cls;
      }
      function rgbToHex(c) {
        const h = (n) => Math.round(n).toString(16).padStart(2, '0');
        return ('#' + h(c.r) + h(c.g) + h(c.b)).toUpperCase();
      }

      // --- Walk all text-bearing elements ---
      const all = document.querySelectorAll('body *');
      const elements = [];
      const seenSelectors = new Set();

      for (const el of all) {
        if (!el.offsetParent && el !== document.body) continue;
        const text = (el.textContent || '').trim();
        if (!text || text.length < 2) continue;
        // Only direct text nodes (not aggregated descendant text)
        const hasOwnText = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 1
        );
        if (!hasOwnText) continue;

        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;

        const fg = parseColor(cs.color);
        if (!fg) continue;
        const bg = resolveBg(el);
        const effFg = fg.a < 1 ? blend(fg, bg) : fg;
        const ratio = contrast(effFg, bg);
        const fontSize = parseFloat(cs.fontSize);
        const fontWeight = parseInt(cs.fontWeight, 10) || 400;
        // WCAG "large text" = 18pt (24px) regular OR 14pt (18.66px) bold
        const isLarge =
          fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

        const aaThreshold = isLarge ? 3.0 : 4.5;
        const aaaThreshold = isLarge ? 4.5 : 7.0;
        const passAA = ratio >= aaThreshold;
        const passAAA = ratio >= aaaThreshold;

        const sel = selector(el);
        if (seenSelectors.has(sel) && elements.length > 500) continue;
        seenSelectors.add(sel);

        elements.push({
          selector: sel,
          textPreview: text.slice(0, 80),
          fgHex: rgbToHex(effFg),
          bgHex: rgbToHex(bg),
          fontSizePx: Math.round(fontSize * 10) / 10,
          fontWeight,
          isLargeText: isLarge,
          contrastRatio: Math.round(ratio * 100) / 100,
          aaThreshold,
          aaaThreshold,
          passAA,
          passAAA,
        });
      }

      const total = elements.length;
      const failAA = elements.filter((e) => !e.passAA).length;
      const failAAA = elements.filter((e) => !e.passAAA).length;
      const worst = [...elements]
        .sort((a, b) => a.contrastRatio - b.contrastRatio)
        .slice(0, 25);

      return {
        title: document.title,
        elementsChecked: total,
        failAA,
        failAAA,
        passRateAA: total > 0 ? Math.round(((total - failAA) / total) * 1000) / 10 : 100,
        passRateAAA: total > 0 ? Math.round(((total - failAAA) / total) * 1000) / 10 : 100,
        worstOffenders: worst,
        allElements: elements,
      };
    });

    // --- Grade summary ---
    let grade;
    if (audit.passRateAA >= 100) grade = 'A+';
    else if (audit.passRateAA >= 95) grade = 'A';
    else if (audit.passRateAA >= 85) grade = 'B';
    else if (audit.passRateAA >= 70) grade = 'C';
    else if (audit.passRateAA >= 50) grade = 'D';
    else grade = 'F';

    return {
      url: targetUrl,
      finalUrl: page.url(),
      httpStatus: response?.status() ?? null,
      title: audit.title,
      grade,
      passRateAA: audit.passRateAA,
      passRateAAA: audit.passRateAAA,
      elementsChecked: audit.elementsChecked,
      failAA: audit.failAA,
      failAAA: audit.failAAA,
      worstOffenders: audit.worstOffenders,
      // Detailed list capped at 500 — full audits will be a Pro feature
      allElements: audit.allElements.slice(0, 500),
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
