/**
 * Generate Shadow DOM Debugger icons (16, 48, 128) as PNGs using Puppeteer.
 * Purple theme with a shadow/layers motif.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const mainSize = Math.round(size * 0.45);
  const shadowSize = Math.round(size * 0.35);
  const offset = Math.round(size * 0.12);
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
    background: linear-gradient(135deg, #c084fc 0%, #7c3aed 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .shadow-box {
    width: ${shadowSize}px; height: ${shadowSize}px;
    border: ${Math.max(1, Math.round(size * 0.04))}px solid rgba(255,255,255,0.3);
    border-radius: ${Math.round(size * 0.06)}px;
    position: absolute;
    top: ${Math.round(size * 0.18)}px;
    left: ${Math.round(size * 0.18)}px;
  }
  .main-box {
    width: ${mainSize}px; height: ${mainSize}px;
    border: ${Math.max(2, Math.round(size * 0.05))}px solid #fff;
    border-radius: ${Math.round(size * 0.08)}px;
    position: absolute;
    bottom: ${Math.round(size * 0.18)}px;
    right: ${Math.round(size * 0.18)}px;
    background: rgba(255,255,255,0.1);
  }
</style></head>
<body><div class="icon"><div class="shadow-box"></div><div class="main-box"></div></div></body></html>`;
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
