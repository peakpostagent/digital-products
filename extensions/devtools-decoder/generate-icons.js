/**
 * Generate DevTools Decoder icons (16, 48, 128) as PNGs using Puppeteer.
 * Decoder/code theme with teal gradient.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const innerSize = Math.round(size * 0.55);
  const stroke = Math.max(1.5, Math.round(size * 0.04));
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
    background: linear-gradient(135deg, #94e2d5 0%, #14b8a6 50%, #0d9488 100%);
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  svg {
    width: ${innerSize}px;
    height: ${innerSize}px;
  }
</style></head>
<body>
  <div class="icon">
    <svg viewBox="0 0 100 100">
      <!-- Left brace { -->
      <path d="M 30 20 C 20 20, 18 30, 18 38 L 18 44 C 18 48, 12 50, 12 50 C 12 50, 18 52, 18 56 L 18 62 C 18 70, 20 80, 30 80"
            fill="none" stroke="#1e1e2e" stroke-width="${stroke * 2.5}" stroke-linecap="round"/>
      <!-- Right brace } -->
      <path d="M 70 20 C 80 20, 82 30, 82 38 L 82 44 C 82 48, 88 50, 88 50 C 88 50, 82 52, 82 56 L 82 62 C 82 70, 80 80, 70 80"
            fill="none" stroke="#1e1e2e" stroke-width="${stroke * 2.5}" stroke-linecap="round"/>
      <!-- Slash / in the middle -->
      <line x1="56" y1="30" x2="44" y2="70"
            stroke="#1e1e2e" stroke-width="${stroke * 2.2}" stroke-linecap="round"/>
    </svg>
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
