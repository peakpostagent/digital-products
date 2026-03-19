const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 600, height: 600, deviceScaleFactor: 2 });
  const filePath = 'file:///' + path.join(__dirname, 'thumbnail.html').replace(/\\/g, '/');
  await p.goto(filePath, { waitUntil: 'networkidle2', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));
  await p.screenshot({ path: path.join(__dirname, '..', 'thumbnail.png'), type: 'png' });
  console.log('Saved: thumbnail.png (600x600 @2x)');
  await browser.close();
})();
