const puppeteer = require('puppeteer');
const path = require('path');

const pages = [
  { file: 'screenshot-1.html', output: 'screenshot-1.png', width: 1280, height: 800 },
  { file: 'screenshot-2.html', output: 'screenshot-2.png', width: 1280, height: 800 },
  { file: 'promo-small.html',  output: 'promo-small.png',  width: 440,  height: 280 },
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
    await tab.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 500));

    const outputPath = path.join(__dirname, page.output);
    await tab.screenshot({ path: outputPath, type: 'png' });
    console.log(`Saved: ${page.output} (${page.width}x${page.height})`);
    await tab.close();
  }

  await browser.close();
  console.log('\nAll screenshots generated.');
})();
