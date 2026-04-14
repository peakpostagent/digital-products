/**
 * Render store listing screenshots from HTML files using Puppeteer.
 * Each HTML file specifies its own viewport size via meta viewport.
 *
 * Puppeteer is installed at the project root (../../node_modules/puppeteer).
 */
const path = require('path');
const fs = require('fs');

// Puppeteer lives at the repo root, not in this extension's node_modules.
const puppeteer = require(path.join(__dirname, '..', '..', 'node_modules', 'puppeteer'));

const screenshotsDir = path.join(__dirname, 'store-listing', 'screenshots');

const files = [
  { html: 'screenshot-1.html', png: 'screenshot-1.png', width: 1280, height: 800 },
  { html: 'screenshot-2.html', png: 'screenshot-2.png', width: 1280, height: 800 },
  { html: 'screenshot-3.html', png: 'screenshot-3.png', width: 1280, height: 800 },
  { html: 'screenshot-4.html', png: 'screenshot-4.png', width: 1280, height: 800 },
  { html: 'promo-small.html',  png: 'promo-small.png',  width: 440,  height: 280 },
  { html: 'marquee.html',      png: 'marquee.png',      width: 1400, height: 560 },
];

(async () => {
  const browser = await puppeteer.launch();

  for (const file of files) {
    const page = await browser.newPage();
    await page.setViewport({
      width: file.width,
      height: file.height,
      deviceScaleFactor: 1
    });

    const htmlPath = path.join(screenshotsDir, file.html);
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait for fonts (Inter from Google Fonts) to load.
    await new Promise(r => setTimeout(r, 1800));

    const outPath = path.join(screenshotsDir, file.png);
    await page.screenshot({ path: outPath });
    await page.close();
    console.log(`Created ${file.png} (${file.width}x${file.height})`);
  }

  await browser.close();
})();
