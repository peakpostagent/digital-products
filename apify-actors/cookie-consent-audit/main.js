/**
 * Cookie Consent Banner Audit — Apify Actor
 *
 * Detects whether a URL has a cookie consent banner, classifies it
 * (CMP vendor, popup style, blocking vs non-blocking), and flags GDPR
 * compliance concerns.
 *
 * Detects 18 major CMP vendors via well-known script hosts and DOM
 * markers (OneTrust, Cookiebot, TrustArc, Iubenda, Quantcast Choice, etc.)
 *
 * Useful for: GDPR/CCPA compliance audits, lead-gen for privacy consultants,
 * competitive analysis of how peer sites handle consent.
 */

const { Actor } = require('apify');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};
  const urls = Array.isArray(input.urls) && input.urls.length
    ? input.urls
    : input.url
      ? [input.url]
      : ['https://example.com'];

  for (const targetUrl of urls.slice(0, 1000)) {
    const result = await auditConsent(targetUrl);
    await Actor.pushData(result);
  }
});

const CMP_VENDORS = [
  { name: 'OneTrust', scriptHosts: ['cdn.cookielaw.org', 'optanon.blob.core.windows.net'], domMarkers: ['#onetrust-consent-sdk', 'class="ot-sdk-row"'] },
  { name: 'Cookiebot', scriptHosts: ['consent.cookiebot.com'], domMarkers: ['#CybotCookiebotDialog', 'cookieconsent'] },
  { name: 'TrustArc', scriptHosts: ['consent.trustarc.com', 'truste.com'], domMarkers: ['truste-banner', 'truste_box_overlay'] },
  { name: 'Iubenda', scriptHosts: ['cdn.iubenda.com'], domMarkers: ['iubenda-cs-container'] },
  { name: 'Quantcast Choice', scriptHosts: ['quantcast.mgr.consensu.org'], domMarkers: ['#qc-cmp-ui-container', 'qc-cmp2-ui'] },
  { name: 'Usercentrics', scriptHosts: ['usercentrics.eu', 'app.usercentrics.eu'], domMarkers: ['usercentrics-root'] },
  { name: 'Didomi', scriptHosts: ['sdk.privacy-center.org', 'didomi.io'], domMarkers: ['#didomi-host'] },
  { name: 'CookieYes', scriptHosts: ['cookieyes.com'], domMarkers: ['cookie-law-info', '#cookie-law-info-bar'] },
  { name: 'Termly', scriptHosts: ['app.termly.io'], domMarkers: ['termly-code-snippet-support'] },
  { name: 'CookieScript', scriptHosts: ['cookie-script.com'], domMarkers: ['cookiescript_injected', 'cookiescript_wrapper'] },
  { name: 'PrivacyTools (Klaro)', scriptHosts: ['privacytools.io'], domMarkers: ['klaro-cookie-notice'] },
  { name: 'Osano', scriptHosts: ['cmp.osano.com'], domMarkers: ['osano-cm-window'] },
  { name: 'Civic Cookie Control', scriptHosts: ['cc.cdn.civiccomputing.com'], domMarkers: ['#ccc-overlay', 'ccc-content'] },
  { name: 'Cookiepro by OneTrust', scriptHosts: ['cookiepro.com'], domMarkers: ['#onetrust-banner-sdk'] },
  { name: 'Sourcepoint', scriptHosts: ['cdn.privacy-mgmt.com', 'sourcepoint.com'], domMarkers: ['_sp_'] },
  { name: 'tarteaucitron', scriptHosts: ['tarteaucitron.io'], domMarkers: ['#tarteaucitronAlertBig'] },
  { name: 'GDPR by WP (WP plugin)', scriptHosts: ['gdpr-cookie-compliance'], domMarkers: ['moove_gdpr_cookie_info_bar'] },
  { name: 'Custom / Unknown', scriptHosts: [], domMarkers: ['class="cookie-banner"', 'id="cookie-banner"', 'id="cookieConsent"', 'id="cookieNotice"'] },
];

async function auditConsent(targetUrl) {
  let response, html;
  try {
    response = await fetch(targetUrl, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; Apify-CookieConsentAudit/1.0)',
        // EU IP hint via Accept-Language doesn't change server-side response
        // for most CMPs, but it's worth advertising EU preference
        'accept-language': 'en-GB,en;q=0.9,fr;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
    });
    html = await response.text();
  } catch (err) {
    return { url: targetUrl, error: err.message, scannedAt: new Date().toISOString() };
  }

  const detectedCmps = [];
  for (const v of CMP_VENDORS) {
    const evidence = [];
    for (const host of v.scriptHosts || []) {
      if (html.includes(host)) evidence.push({ type: 'script-host', match: host });
    }
    for (const marker of v.domMarkers || []) {
      if (html.includes(marker)) evidence.push({ type: 'dom-marker', match: marker });
    }
    if (evidence.length > 0) {
      detectedCmps.push({ vendor: v.name, evidence });
    }
  }

  // GDPR signals — set-cookie headers + meta tags
  const setCookie = response.headers.get('set-cookie') || '';
  const cookiesBeforeConsent = setCookie.split(',').filter((c) => c.includes('=')).length;
  const hasGdprConsent = /tcfv2|euconsent-v2/i.test(setCookie);

  // Sniff for advertising trackers in raw HTML (light overlap with tracking-pixel-detector)
  const adTrackersInHtml = [];
  if (html.includes('connect.facebook.net')) adTrackersInHtml.push('Facebook Pixel');
  if (html.includes('googletagmanager.com')) adTrackersInHtml.push('Google Tag Manager');
  if (html.includes('analytics.tiktok.com')) adTrackersInHtml.push('TikTok Pixel');

  // Score + flags
  const issues = [];
  let score = 100;

  if (detectedCmps.length === 0 && adTrackersInHtml.length > 0) {
    issues.push('Trackers detected but no consent banner found — likely GDPR non-compliant');
    score -= 40;
  } else if (detectedCmps.length === 0) {
    issues.push('No cookie consent banner detected');
    score -= 15;
  }
  if (cookiesBeforeConsent > 3) {
    issues.push(`${cookiesBeforeConsent} cookies set BEFORE user could consent — strict GDPR violation`);
    score -= 30;
  }
  if (detectedCmps.length > 0 && !hasGdprConsent) {
    issues.push('CMP detected but no TCF v2 consent string — may be non-compliant in EU');
    score -= 10;
  }

  let grade;
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    url: targetUrl,
    finalUrl: response.url,
    httpStatus: response.status,
    grade,
    score: Math.max(0, score),
    cmpDetected: detectedCmps.length > 0,
    cmps: detectedCmps,
    trackersFoundInHtml: adTrackersInHtml,
    cookiesSetBeforeConsent: cookiesBeforeConsent,
    hasTcfConsent: hasGdprConsent,
    issues,
    scannedAt: new Date().toISOString(),
  };
}
