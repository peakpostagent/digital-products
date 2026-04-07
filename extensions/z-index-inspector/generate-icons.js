/**
 * Generate Z-Index Inspector icons (16, 48, 128) as PNGs using Puppeteer.
 * Blue gradient theme with layers/stacking motif.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const layerW = Math.round(size * 0.52);
  const layerH = Math.round(size * 0.14);
  const gap = Math.round(size * 0.04);
  const borderW = Math.max(1, Math.round(size * 0.03));
  const fontSize = Math.max(4, Math.round(size * 0.1));
  const layerRadius = Math.round(size * 0.05);

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
    background: linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1d4ed8 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: ${gap}px;
    position: relative;
  }
  .layer {
    width: ${layerW}px; height: ${layerH}px;
    border: ${borderW}px solid rgba(255,255,255,0.9);
    border-radius: ${layerRadius}px;
    background: rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: flex-end;
    padding-right: ${Math.round(size * 0.04)}px;
  }
  .layer:nth-child(1) {
    background: rgba(255,255,255,0.25);
    transform: scale(0.85);
  }
  .layer:nth-child(2) {
    background: rgba(255,255,255,0.18);
    transform: scale(0.92);
  }
  .layer:nth-child(3) {
    background: rgba(255,255,255,0.12);
  }
  .z-label {
    font-family: monospace;
    font-size: ${fontSize}px;
    font-weight: 900;
    color: rgba(255,255,255,0.9);
    line-height: 1;
  }
</style></head>
<body>
  <div class="icon">
    <div class="layer"><span class="z-label">${size >= 48 ? '3' : ''}</span></div>
    <div class="layer"><span class="z-label">${size >= 48 ? '2' : ''}</span></div>
    <div class="layer"><span class="z-label">${size >= 48 ? '1' : ''}</span></div>
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
