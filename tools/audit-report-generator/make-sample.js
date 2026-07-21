#!/usr/bin/env node
/**
 * make-sample.js — Renders a SAMPLE audit report for the Fiverr gig gallery.
 *
 * Uses a fictional local business with a realistic B-grade result (the most
 * relatable outcome for a prospective buyer: not perfect, not broken, with
 * clear actionable wins). Clearly watermarked SAMPLE. Standard demo-data
 * practice — no real company's issues are exposed in our marketing.
 *
 *   node make-sample.js   →   reports/SAMPLE-audit-report.html
 */

const fs = require('fs');
const path = require('path');
const { render } = require('./lib/report');

const g = (grade, score, findings) => ({ grade, score, findings });
const F = (severity, label, detail = '') => ({ severity, label, detail });

const sample = {
  url: 'https://northwind-coffee.example',
  finalUrl: 'https://www.northwind-coffee.example/',
  httpStatus: 200,
  overallScore: 74,
  overallGrade: 'B',
  scannedAt: new Date('2026-07-21T09:00:00Z').toISOString(),
  audits: [
    { key: 'security', name: 'Security Headers', ...g('C', 62, [
      F('crit', 'Content-Security-Policy: missing', "Add a policy starting with default-src 'self' to block injection attacks."),
      F('warn', 'Strict-Transport-Security: weak', 'Present but max-age is under 6 months — raise to 31536000.'),
      F('good', 'X-Content-Type-Options: set'),
      F('crit', 'X-Frame-Options: missing', 'Add DENY or SAMEORIGIN to prevent clickjacking of your booking page.'),
      F('good', 'Referrer-Policy: set'),
      F('warn', 'Permissions-Policy: missing', 'Restrict camera/microphone/geolocation access explicitly.'),
    ]) },
    { key: 'seo', name: 'SEO & Meta Tags', ...g('B', 78, [
      F('good', 'Title: "Northwind Coffee Co. — Fresh Roasted Daily"'),
      F('warn', 'Description 96 chars', 'A little short — aim for 120-158 characters to fill the search snippet.'),
      F('good', 'Canonical URL: set'),
      F('warn', 'Incomplete Open Graph tags', 'Add og:image so shared links show your storefront photo, not a blank box.'),
      F('good', 'Mobile viewport: set'),
    ]) },
    { key: 'crawl', name: 'Crawlability (robots + sitemap)', ...g('A', 90, [
      F('good', 'robots.txt present and permissive'),
      F('warn', 'Sitemap has only 4 URLs', 'Your menu and location pages aren\'t in the sitemap — add them so Google indexes them.'),
    ]) },
    { key: 'schema', name: 'Structured Data', ...g('D', 45, [
      F('crit', 'No LocalBusiness structured data', 'Add schema.org/CafeOrCoffeeShop markup so Google can show your hours, address, and star rating directly in search — huge for a local business.'),
    ]) },
    { key: 'alt', name: 'Image Accessibility', ...g('C', 64, [
      F('warn', '5 of 14 images missing an alt attribute', 'Your menu-item photos need alt text — for screen readers and Google Image search (where a lot of "coffee near me" traffic starts).'),
      F('warn', '2 images use a filename as alt', 'alt="IMG_4821.jpg" tells a screen-reader user nothing — describe the drink.'),
    ]) },
    { key: 'privacy', name: 'Privacy & Compliance', ...g('C', 55, [
      F('good', 'Trackers detected: Google Analytics / GTM, Meta (Facebook) Pixel'),
      F('crit', 'Trackers present but no consent banner detected', 'The Facebook Pixel fires before consent — a likely GDPR/PIPEDA issue if you get any EU or Canadian visitors. Add a consent banner.'),
    ]) },
    { key: 'http', name: 'HTTP & Performance Config', ...g('B', 80, [
      F('good', 'HTTPS enabled'),
      F('warn', 'Using gzip (Brotli would be better)', 'Brotli saves another 15-25% — one setting on most modern hosts.'),
      F('warn', 'HTTP/3 not advertised', 'Speeds up repeat visits on phones — relevant for a mobile-heavy local audience.'),
      F('good', 'Cache-Control: set'),
    ]) },
  ],
};

// Inject a clearly-visible SAMPLE watermark into the rendered HTML.
let html = render(sample, { client: 'Northwind Coffee Co. (SAMPLE)' });
html = html.replace('<body>', `<body>
  <div style="position:fixed;top:14px;right:14px;z-index:99;background:#F4B942;color:#134B57;
       font:700 12px/1 system-ui;letter-spacing:.1em;text-transform:uppercase;
       padding:7px 12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.15)">Sample Report</div>`);

const out = path.join(__dirname, 'reports', 'SAMPLE-audit-report.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf8');
console.log('Sample report →', path.relative(process.cwd(), out));
