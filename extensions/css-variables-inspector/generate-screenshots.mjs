/**
 * generate-screenshots.mjs
 * Renders screenshot HTML files to PNG using Puppeteer.
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'store-listing', 'screenshots');

const pages = [
  { file: 'screenshot-1.html', output: 'screenshot-1.png', width: 1280, height: 800 },
  { file: 'screenshot-2.html', output: 'screenshot-2.png', width: 1280, height: 800 },
  { file: 'screenshot-3.html', output: 'screenshot-3.png', width: 1280, height: 800 },
  { file: 'screenshot-4.html', output: 'screenshot-4.png', width: 1280, height: 800 },
  { file: 'promo-small.html', output: 'promo-small.png', width: 440, height: 280 },
  { file: 'marquee.html', output: 'marquee.png', width: 1400, height: 560 },
];

async function generate() {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const item of pages) {
    const page = await browser.newPage();
    await page.setViewport({
      width: item.width,
      height: item.height,
      deviceScaleFactor: 1
    });

    const filePath = 'file:///' + path.join(screenshotsDir, item.file).replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 15000 });

    /* Wait for fonts to load */
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    const outputPath = path.join(screenshotsDir, item.output);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`Generated ${item.output}`);
    await page.close();
  }

  await browser.close();
  console.log('All screenshots generated.');
}

generate().catch(console.error);
