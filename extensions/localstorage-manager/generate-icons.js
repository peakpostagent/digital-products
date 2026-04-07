/**
 * Generate LocalStorage Manager icons (16, 48, 128) as PNGs using Puppeteer.
 * Storage/database theme with amber gradient.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const barW = Math.round(size * 0.55);
  const barH = Math.max(2, Math.round(size * 0.08));
  const gap = Math.max(1, Math.round(size * 0.06));
  const pad = Math.round(size * 0.22);
  const cylH = Math.round(size * 0.56);
  const cylW = Math.round(size * 0.6);
  const cylTop = Math.round(cylH * 0.22);

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
    background: linear-gradient(135deg, #fab387 0%, #e5772e 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  /* Simplified database cylinder icon */
  .db {
    width: ${cylW}px;
    height: ${cylH}px;
    position: relative;
  }
  .db-top {
    width: ${cylW}px;
    height: ${cylTop}px;
    background: #1e1e2e;
    border-radius: 50%;
    position: absolute;
    top: 0;
    z-index: 3;
  }
  .db-body {
    width: ${cylW}px;
    height: ${cylH - Math.round(cylTop/2)}px;
    background: #1e1e2e;
    border-radius: 0 0 ${Math.round(cylW*0.5)}px ${Math.round(cylW*0.5)}px / 0 0 ${cylTop}px ${cylTop}px;
    position: absolute;
    top: ${Math.round(cylTop/2)}px;
    z-index: 1;
  }
  .db-line {
    position: absolute;
    width: ${cylW}px;
    height: ${Math.max(1, Math.round(cylTop * 0.5))}px;
    border-bottom: ${Math.max(1, Math.round(size * 0.015))}px solid rgba(250,179,135,0.5);
    z-index: 2;
  }
  .db-line:nth-child(3) { top: ${Math.round(cylH * 0.35)}px; }
  .db-line:nth-child(4) { top: ${Math.round(cylH * 0.55)}px; }
</style></head>
<body>
  <div class="icon">
    <div class="db">
      <div class="db-top"></div>
      <div class="db-body"></div>
      <div class="db-line"></div>
      <div class="db-line"></div>
    </div>
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
