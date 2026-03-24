/**
 * Generate Console Catcher icons (16, 48, 128) as PNGs using Puppeteer.
 * Orange/amber theme with a terminal/console ">" prompt motif.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);      // border radius
  const fontSize = Math.round(size * 0.55);
  const offset = Math.round(size * 0.08);  // left offset for ">"
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
    padding-left: ${offset}px;
  }
  .prompt {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: ${fontSize}px;
    font-weight: 900;
    color: #1e1e2e;
    line-height: 1;
    text-shadow: 0 ${Math.max(1, Math.round(size * 0.015))}px 0 rgba(0,0,0,0.15);
  }
</style></head>
<body><div class="icon"><span class="prompt">&gt;_</span></div></body></html>`;
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
