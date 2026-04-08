/**
 * Render all marketing HTML files to PNG images using Puppeteer.
 * Usage: node screenshot.js
 *
 * Outputs PNG files to the parent directory (project-estimator/).
 * Uses 2x device scale factor for crisp retina-quality images.
 */

const puppeteer = require('puppeteer');
const path = require('path');

const pages = [
  { file: 'cover.html',                  output: 'cover.png',                  width: 1280, height: 720 },
  { file: 'preview-dashboard.html',      output: 'preview-dashboard.png',      width: 1280, height: 720 },
  { file: 'preview-tabs.html',           output: 'preview-tabs.png',           width: 1280, height: 720 },
  { file: 'preview-whats-included.html', output: 'preview-whats-included.png', width: 1280, height: 720 },
  { file: 'thumbnail.html',              output: 'thumbnail.png',              width: 600,  height: 600 },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const page of pages) {
    const tab = await browser.newPage();

    await tab.setViewport({
      width: page.width,
      height: page.height,
      deviceScaleFactor: 2,
    });

    const filePath = path.join(__dirname, page.file);
    await tab.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // Wait for fonts to load
    await tab.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 500));

    const outputPath = path.join(__dirname, '..', page.output);
    await tab.screenshot({ path: outputPath, type: 'png' });

    console.log(`Saved: ${page.output} (${page.width}x${page.height})`);
    await tab.close();
  }

  await browser.close();
  console.log('\nAll screenshots generated successfully.');
})();
