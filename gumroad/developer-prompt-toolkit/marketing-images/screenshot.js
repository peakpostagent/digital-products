const puppeteer = require('puppeteer');
const path = require('path');

const pages = [
  { file: 'cover.html', output: 'cover-image.png', width: 1280, height: 720 },
  { file: 'preview-categories.html', output: 'preview-categories.png', width: 1280, height: 720 },
  { file: 'preview-before-after.html', output: 'preview-before-after.png', width: 1280, height: 720 },
  { file: 'preview-whats-included.html', output: 'preview-whats-included.png', width: 1280, height: 720 },
  { file: 'social-banner.html', output: 'social-banner.png', width: 1200, height: 630 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const page of pages) {
    const p = await browser.newPage();
    await p.setViewport({ width: page.width, height: page.height, deviceScaleFactor: 2 });
    const filePath = 'file:///' + path.join(__dirname, page.file).replace(/\\/g, '/');
    await p.goto(filePath, { waitUntil: 'networkidle2', timeout: 15000 });
    // Wait for fonts to load
    await p.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 1000));

    const outputPath = path.join(__dirname, '..', page.output);
    await p.screenshot({ path: outputPath, type: 'png' });
    console.log('Saved: ' + page.output + ' (' + page.width + 'x' + page.height + ' @2x)');
    await p.close();
  }

  await browser.close();
  console.log('Done - all marketing images saved');
})();
