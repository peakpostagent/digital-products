/**
 * Generate Regex Tester icons (16, 48, 128) as PNGs using Puppeteer.
 * Regex motif with orange-red gradient.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.32);
  const slashSize = Math.round(size * 0.28);
  return `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body {
    width: ${size}px; height: ${size}px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
  }
  .icon {
    width: ${size}px; height: ${size}px;
    border-radius: ${r}px;
    background: linear-gradient(135deg, #fab387 0%, #e64553 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .text {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: ${fontSize}px;
    font-weight: 900;
    color: #1e1e2e;
    text-align: center;
    line-height: 1;
    letter-spacing: ${size >= 48 ? '-1px' : '0'};
  }
  .slash {
    font-size: ${slashSize}px;
    opacity: 0.6;
  }
  .dot {
    font-size: ${Math.round(fontSize * 0.7)}px;
  }
  .star {
    font-size: ${Math.round(fontSize * 0.85)}px;
  }
</style></head>
<body>
  <div class="icon">
    <div class="text"><span class="slash">/</span><span class="dot">.</span><span class="star">*</span><span class="slash">/</span></div>
  </div>
</body></html>`;
};

(async () => {
  const browser = await puppeteer.launch();
  for (const size of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(iconHtml(size));
    const outPath = path.join(__dirname, 'src', 'icons', `icon${size}.png`);
    await page.screenshot({ path: outPath, omitBackground: true });
    await page.close();
    console.log(`Created ${outPath}`);
  }
  await browser.close();
})();
