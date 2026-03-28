const puppeteer = require('puppeteer');
const path = require('path');

const BRANDING_DIR = __dirname;

const pages = [
  { file: 'strategy-a-banner.html', output: 'strategy-a-banner.png', width: 1280, height: 640 },
  { file: 'strategy-a-avatar.html', output: 'strategy-a-avatar.png', width: 400, height: 400 },
  { file: 'strategy-b-banner.html', output: 'strategy-b-banner.png', width: 1280, height: 640 },
  { file: 'strategy-b-avatar.html', output: 'strategy-b-avatar.png', width: 400, height: 400 },
  { file: 'strategy-c-banner.html', output: 'strategy-c-banner.png', width: 1280, height: 640 },
  { file: 'strategy-c-avatar.html', output: 'strategy-c-avatar.png', width: 400, height: 400 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const page of pages) {
    const tab = await browser.newPage();
    await tab.setViewport({
      width: page.width,
      height: page.height,
      deviceScaleFactor: 1,
    });

    const filePath = 'file:///' + path.join(BRANDING_DIR, page.file).replace(/\\/g, '/');
    await tab.goto(filePath, { waitUntil: 'networkidle0' });

    const outputPath = path.join(BRANDING_DIR, page.output);
    await tab.screenshot({ path: outputPath, type: 'png' });

    console.log(`Rendered: ${page.output} (${page.width}x${page.height})`);
    await tab.close();
  }

  await browser.close();
  console.log('\nAll 6 images rendered successfully.');
})();
