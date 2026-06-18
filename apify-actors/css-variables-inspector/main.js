// CSS Variables Inspector — Apify Actor
//
// Takes a URL, navigates with Playwright (needs the real DOM for computed
// styles), extracts every CSS custom property (--var-name) defined or in
// use on the page, and returns them structured.
//
// Direct sibling of the CSS Variables Inspector Chrome extension (18 active
// users on CWS as of 2026-05-15). The extension does the same thing via
// DevTools API on a single page; this Actor automates it for batch use
// cases — design-system audits, brand-color extraction, theme migrations.
//
// Pricing model (set in actor.json):
//   Free tier: 50 pages/month
//   Paid:      $0.01 per page scanned

const { Actor } = require('apify');
const { chromium } = require('playwright');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};

  // Fall back to https://example.com so Apify's daily auto-test passes.
  const urls = Array.isArray(input.urls) && input.urls.length
    ? input.urls
    : input.url
      ? [input.url]
      : ['https://example.com'];

  const MAX_URLS_PER_RUN = 100; // Playwright is heavier than fetch — lower cap
  if (urls.length > MAX_URLS_PER_RUN) {
    console.warn(`Capping ${urls.length} URLs to first ${MAX_URLS_PER_RUN}`);
    urls.length = MAX_URLS_PER_RUN;
  }

  const browser = await chromium.launch({ headless: true });
  console.log(`Inspecting ${urls.length} URL(s)...`);

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[${i + 1}/${urls.length}] ${url}`);
      const result = await inspectOne(browser, url);
      await Actor.pushData(result);
    }
  } finally {
    await browser.close();
  }

  console.log(`Done.`);
});

async function inspectOne(browser, url) {
  let normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) return { url, error: 'Empty URL' };
  if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = 'https://' + normalizedUrl;

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; PeakPostCSSInspector/1.0; +https://peakpost.ca)',
  });
  const page = await context.newPage();

  try {
    const response = await page.goto(normalizedUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Extract CSS custom properties via DOM evaluation
    const data = await page.evaluate(() => {
      const result = {
        root: {},               // properties on :root (most common)
        byScope: {},            // properties on other selectors
        usedButNotDefined: [],  // var() references with no matching declaration
        totalDeclarations: 0,
      };

      // Walk all stylesheets to find :root and other-scope custom properties
      function processRules(rules, scopeSelector) {
        if (!rules) return;
        for (const rule of rules) {
          if (rule.type === CSSRule.STYLE_RULE) {
            const selector = scopeSelector || rule.selectorText;
            const style = rule.style;
            for (let i = 0; i < style.length; i++) {
              const prop = style[i];
              if (prop.startsWith('--')) {
                result.totalDeclarations++;
                const value = style.getPropertyValue(prop).trim();
                if (selector === ':root' || selector === 'html') {
                  result.root[prop] = value;
                } else {
                  if (!result.byScope[selector]) result.byScope[selector] = {};
                  result.byScope[selector][prop] = value;
                }
              }
            }
          } else if (rule.type === CSSRule.MEDIA_RULE || rule.type === CSSRule.SUPPORTS_RULE) {
            processRules(rule.cssRules, scopeSelector);
          }
        }
      }

      for (const sheet of document.styleSheets) {
        try {
          processRules(sheet.cssRules);
        } catch (_e) {
          // CORS-blocked stylesheet — skip
        }
      }

      // Find var() references in computed styles of elements
      const referenced = new Set();
      const allRules = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText) allRules.push(rule.cssText);
          }
        } catch (_e) { /* skip */ }
      }
      const varPattern = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
      for (const ruleText of allRules) {
        let m;
        while ((m = varPattern.exec(ruleText)) !== null) {
          referenced.add(m[1]);
        }
      }

      // Flag references with no definition
      for (const ref of referenced) {
        if (!(ref in result.root)) {
          let foundInScope = false;
          for (const scope in result.byScope) {
            if (ref in result.byScope[scope]) {
              foundInScope = true;
              break;
            }
          }
          if (!foundInScope) {
            result.usedButNotDefined.push(ref);
          }
        }
      }

      return result;
    });

    return {
      url: response ? response.url() : normalizedUrl,
      finalUrl: response ? response.url() : normalizedUrl,
      httpStatus: response ? response.status() : null,
      totalDeclarations: data.totalDeclarations,
      rootCount: Object.keys(data.root).length,
      otherScopeCount: Object.keys(data.byScope).length,
      usedButNotDefinedCount: data.usedButNotDefined.length,
      root: data.root,
      byScope: data.byScope,
      usedButNotDefined: data.usedButNotDefined,
      scannedAt: new Date().toISOString(),
      scannerVersion: '1.0.0',
    };
  } catch (err) {
    return {
      url: normalizedUrl,
      error: 'Inspect failed: ' + (err.message || String(err)),
      scannedAt: new Date().toISOString(),
    };
  } finally {
    await page.close();
    await context.close();
  }
}
