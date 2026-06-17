/**
 * SEO Scanner — Content script
 *
 * Runs on every HTTP/HTTPS page. Responds to a popup-initiated
 * `extkit/seo-scan` message with the audit result.
 *
 * Inline import-via-dynamic-import pattern: content scripts can't use ES
 * modules natively, so we use chrome.runtime.getURL + dynamic import.
 */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg?.type !== 'extkit/seo-scan') return;
  (async () => {
    try {
      const mod = await import(chrome.runtime.getURL('lib/scanner.js'));
      const result = mod.scanPage(document);
      sendResponse({ ok: true, result, url: location.href, title: document.title });
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
  })();
  return true; // async
});
