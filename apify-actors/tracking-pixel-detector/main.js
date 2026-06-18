/**
 * Tracking Pixel Detector — Apify Actor
 *
 * Scans a URL for analytics + advertising trackers. Detects 25+ common
 * trackers via script-src URLs, inline script patterns, and meta tags.
 * Returns a per-tracker report + a GDPR/CCPA compliance hint.
 *
 * Use cases: privacy audits, GDPR compliance triage, competitive analysis,
 * "who's tracking me?" research.
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
    const result = await detectTrackers(targetUrl);
    await Actor.pushData(result);
  }
});

// Detector definitions — each has matchers for script-src URLs + inline JS
const TRACKERS = [
  // --- Analytics ---
  { name: 'Google Analytics 4', category: 'analytics', vendor: 'Google',
    scriptHosts: ['googletagmanager.com/gtag/js'], inlinePatterns: [/gtag\s*\(/, /window\.dataLayer\s*=/] },
  { name: 'Google Tag Manager', category: 'tag-manager', vendor: 'Google',
    scriptHosts: ['googletagmanager.com/gtm.js'], inlinePatterns: [/GTM-[A-Z0-9]+/] },
  { name: 'Google Analytics (Universal)', category: 'analytics', vendor: 'Google',
    scriptHosts: ['google-analytics.com/analytics.js', 'google-analytics.com/ga.js'], inlinePatterns: [/_gaq\.push/, /ga\(['"]send['"]/] },
  { name: 'Plausible', category: 'analytics', vendor: 'Plausible',
    scriptHosts: ['plausible.io/js/script.js', 'plausible.io/js/plausible.js'] },
  { name: 'Fathom Analytics', category: 'analytics', vendor: 'Fathom',
    scriptHosts: ['cdn.usefathom.com/script.js'] },
  { name: 'Simple Analytics', category: 'analytics', vendor: 'Simple Analytics',
    scriptHosts: ['scripts.simpleanalyticscdn.com'] },
  { name: 'Matomo / Piwik', category: 'analytics', vendor: 'Matomo',
    scriptHosts: ['matomo.cloud', 'piwik.pro'], inlinePatterns: [/_paq\.push/] },
  { name: 'PostHog', category: 'analytics', vendor: 'PostHog',
    scriptHosts: ['posthog.com/static/array.js', 'us.i.posthog.com'], inlinePatterns: [/posthog\.init/] },
  { name: 'Amplitude', category: 'analytics', vendor: 'Amplitude',
    scriptHosts: ['cdn.amplitude.com'], inlinePatterns: [/amplitude\.getInstance/] },
  { name: 'Mixpanel', category: 'analytics', vendor: 'Mixpanel',
    scriptHosts: ['cdn.mxpnl.com'], inlinePatterns: [/mixpanel\.track/] },
  { name: 'Heap Analytics', category: 'analytics', vendor: 'Heap',
    scriptHosts: ['cdn.heapanalytics.com'] },
  { name: 'Segment', category: 'analytics', vendor: 'Segment',
    scriptHosts: ['cdn.segment.com'], inlinePatterns: [/analytics\.load/, /analytics\.track/] },

  // --- Session replay + heatmaps ---
  { name: 'Hotjar', category: 'session-replay', vendor: 'Hotjar',
    scriptHosts: ['static.hotjar.com', 'script.hotjar.com'], inlinePatterns: [/hjBootstrap/, /\(h\)\.hj/] },
  { name: 'Microsoft Clarity', category: 'session-replay', vendor: 'Microsoft',
    scriptHosts: ['clarity.ms/tag/'], inlinePatterns: [/clarity\(['"]start['"]/] },
  { name: 'FullStory', category: 'session-replay', vendor: 'FullStory',
    scriptHosts: ['edge.fullstory.com', 'fullstory.com/s/fs.js'] },
  { name: 'LogRocket', category: 'session-replay', vendor: 'LogRocket',
    scriptHosts: ['cdn.lr-in-prod.com', 'cdn.logrocket.io'] },

  // --- Advertising ---
  { name: 'Facebook Pixel', category: 'advertising', vendor: 'Meta',
    scriptHosts: ['connect.facebook.net/en_US/fbevents.js', 'connect.facebook.net'], inlinePatterns: [/fbq\s*\(/, /facebook\.com\/tr/] },
  { name: 'TikTok Pixel', category: 'advertising', vendor: 'TikTok',
    scriptHosts: ['analytics.tiktok.com'], inlinePatterns: [/ttq\.track/, /ttq\.load/] },
  { name: 'LinkedIn Insight', category: 'advertising', vendor: 'LinkedIn',
    scriptHosts: ['snap.licdn.com/li.lms-analytics/insight.min.js'], inlinePatterns: [/_linkedin_partner_id/] },
  { name: 'Twitter/X Pixel', category: 'advertising', vendor: 'X',
    scriptHosts: ['static.ads-twitter.com/uwt.js'], inlinePatterns: [/twq\(/] },
  { name: 'Pinterest Tag', category: 'advertising', vendor: 'Pinterest',
    scriptHosts: ['s.pinimg.com/ct/core.js'], inlinePatterns: [/pintrk\(/] },
  { name: 'Google Ads / DoubleClick', category: 'advertising', vendor: 'Google',
    scriptHosts: ['googleadservices.com', 'doubleclick.net'] },
  { name: 'Reddit Pixel', category: 'advertising', vendor: 'Reddit',
    scriptHosts: ['www.redditstatic.com/ads/pixel.js'], inlinePatterns: [/rdt\(/] },

  // --- Chat / support widgets ---
  { name: 'Intercom', category: 'chat', vendor: 'Intercom',
    scriptHosts: ['widget.intercom.io', 'js.intercomcdn.com'], inlinePatterns: [/Intercom\(['"]/] },
  { name: 'Drift', category: 'chat', vendor: 'Drift',
    scriptHosts: ['js.driftt.com'] },
  { name: 'HubSpot', category: 'marketing-automation', vendor: 'HubSpot',
    scriptHosts: ['js.hs-scripts.com', 'js.hsforms.net'] },
  { name: 'Tawk.to', category: 'chat', vendor: 'Tawk',
    scriptHosts: ['embed.tawk.to'] },
];

async function detectTrackers(targetUrl) {
  let response, html;
  try {
    response = await fetch(targetUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Apify-TrackingPixelDetector/1.0)' },
      signal: AbortSignal.timeout(20000),
    });
    html = await response.text();
  } catch (err) {
    return { url: targetUrl, error: err.message, scannedAt: new Date().toISOString() };
  }

  const detected = [];
  for (const tracker of TRACKERS) {
    const evidence = [];
    if (tracker.scriptHosts) {
      for (const host of tracker.scriptHosts) {
        if (html.includes(host)) evidence.push({ type: 'script-src', match: host });
      }
    }
    if (tracker.inlinePatterns) {
      for (const re of tracker.inlinePatterns) {
        if (re.test(html)) evidence.push({ type: 'inline-pattern', match: re.toString() });
      }
    }
    if (evidence.length > 0) {
      detected.push({
        name: tracker.name,
        category: tracker.category,
        vendor: tracker.vendor,
        evidence,
      });
    }
  }

  const byCategory = {};
  for (const t of detected) {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  }

  const hasAdvertising = detected.some((t) => t.category === 'advertising');
  const hasSessionReplay = detected.some((t) => t.category === 'session-replay');
  const trackerCount = detected.length;

  const complianceFlags = [];
  if (hasAdvertising) complianceFlags.push('Advertising trackers detected — GDPR consent required in EU');
  if (hasSessionReplay) complianceFlags.push('Session-replay tools detected — CCPA + GDPR-sensitive data exposure risk');
  if (trackerCount >= 10) complianceFlags.push(`${trackerCount} trackers detected — high cookie-banner complexity`);

  return {
    url: targetUrl,
    finalUrl: response?.url || targetUrl,
    httpStatus: response?.status ?? null,
    trackerCount,
    detected,
    byCategory,
    complianceFlags,
    scannedAt: new Date().toISOString(),
  };
}
