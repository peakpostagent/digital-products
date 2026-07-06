/**
 * CSS Inspector — Content script
 *
 * Scans the page's stylesheets for CSS custom properties (--variables).
 * Free tier: :root declarations only. Pro tier: all scopes + orphaned
 * var() references (the popup decides which slice to request).
 */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg?.type !== 'extkit/css-scan') return;
  try {
    const root = {};
    const byScope = {};
    const used = new Set();

    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules; // cross-origin sheets throw — skip them
      } catch (_) {
        continue;
      }
      if (!rules) continue;
      for (const rule of rules) {
        if (!rule.style) continue;
        const selector = rule.selectorText || '';
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith('--')) {
            const value = rule.style.getPropertyValue(prop).trim();
            if (selector === ':root' || selector === 'html') {
              root[prop] = value;
            } else {
              (byScope[selector] = byScope[selector] || {})[prop] = value;
            }
          }
          const v = rule.style.getPropertyValue(prop);
          const re = /var\(\s*(--[\w-]+)/g;
          let m;
          while ((m = re.exec(v)) !== null) used.add(m[1]);
        }
      }
    }

    const declared = new Set([
      ...Object.keys(root),
      ...Object.values(byScope).flatMap((o) => Object.keys(o)),
    ]);
    const orphans = [...used].filter((u) => !declared.has(u));

    sendResponse({
      ok: true,
      url: location.href,
      root,
      byScope,          // Pro-gated in popup
      orphans,          // Pro-gated in popup
      counts: {
        root: Object.keys(root).length,
        scopes: Object.keys(byScope).length,
        orphans: orphans.length,
      },
    });
  } catch (err) {
    sendResponse({ ok: false, error: err.message });
  }
  return true;
});
