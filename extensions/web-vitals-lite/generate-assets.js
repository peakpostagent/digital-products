/**
 * Generates icons and store listing screenshots for Web Vitals Lite.
 * Run with: node generate-assets.js
 * Requires: puppeteer (npm install puppeteer)
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, 'src');
const SCREENSHOTS = path.join(__dirname, 'store-listing', 'screenshots');

async function renderHTML(htmlPath, outputPath, width, height) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();
  console.log('Created:', outputPath);
}

/* ── Icon HTML generator ─────────────────────────────────────── */

function createIconHTML(size) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin:0; padding:0; }
  body { width:${size}px; height:${size}px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:transparent; }
  .icon {
    width:${size}px; height:${size}px; border-radius:${Math.round(size * 0.22)}px;
    background: linear-gradient(135deg, #0cce6b 0%, #89b4fa 100%);
    display:flex; align-items:center; justify-content:center;
    position:relative; overflow:hidden;
  }
  /* Gauge arc */
  .gauge {
    width:${Math.round(size * 0.6)}px; height:${Math.round(size * 0.6)}px;
    border:${Math.max(2, Math.round(size * 0.06))}px solid rgba(255,255,255,0.9);
    border-bottom-color: transparent;
    border-radius:50%;
    transform: rotate(-45deg);
  }
  /* Needle */
  .needle {
    position:absolute;
    width:${Math.max(2, Math.round(size * 0.04))}px;
    height:${Math.round(size * 0.28)}px;
    background:#fff;
    border-radius:${Math.max(1, Math.round(size * 0.02))}px;
    top:${Math.round(size * 0.18)}px;
    left:50%;
    transform-origin: bottom center;
    transform: translateX(-50%) rotate(-30deg);
  }
  .center-dot {
    position:absolute;
    width:${Math.max(3, Math.round(size * 0.1))}px;
    height:${Math.max(3, Math.round(size * 0.1))}px;
    background:#fff;
    border-radius:50%;
    top:${Math.round(size * 0.45)}px;
    left:50%;
    transform:translateX(-50%);
  }
</style></head>
<body>
  <div class="icon">
    <div class="gauge"></div>
    <div class="needle"></div>
    <div class="center-dot"></div>
  </div>
</body></html>`;
}

/* ── Main ────────────────────────────────────────────────────── */

async function main() {
  // Ensure directories exist
  fs.mkdirSync(path.join(SRC, 'icons'), { recursive: true });
  fs.mkdirSync(SCREENSHOTS, { recursive: true });

  // Generate icons
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    const htmlPath = path.join(SRC, 'icons', `icon${size}.html`);
    const pngPath = path.join(SRC, 'icons', `icon${size}.png`);
    fs.writeFileSync(htmlPath, createIconHTML(size));
    await renderHTML(htmlPath, pngPath, size, size);
    fs.unlinkSync(htmlPath); // clean up temp HTML
  }

  // Generate screenshots from existing HTML files
  const screenshotFiles = [
    { file: 'screenshot-1.html', w: 1280, h: 800 },
    { file: 'screenshot-2.html', w: 1280, h: 800 },
    { file: 'screenshot-3.html', w: 1280, h: 800 },
    { file: 'screenshot-4.html', w: 1280, h: 800 },
    { file: 'promo-small.html',  w: 440,  h: 280 },
    { file: 'marquee.html',      w: 1400, h: 560 },
  ];

  for (const s of screenshotFiles) {
    const htmlPath = path.join(SCREENSHOTS, s.file);
    const pngPath = htmlPath.replace('.html', '.png');
    if (fs.existsSync(htmlPath)) {
      await renderHTML(htmlPath, pngPath, s.w, s.h);
    } else {
      console.warn('Missing:', htmlPath);
    }
  }

  console.log('Done! All assets generated.');
}

main().catch(console.error);
