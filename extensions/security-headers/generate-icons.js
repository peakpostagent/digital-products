/**
 * Generate Security Headers icons (16, 48, 128) as PNGs using Puppeteer.
 * Shield motif with green gradient.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const shieldSize = Math.round(size * 0.6);
  const stroke = Math.max(1, Math.round(size * 0.04));
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
    background: linear-gradient(135deg, #a6e3a1 0%, #40a02b 100%);
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  svg {
    width: ${shieldSize}px;
    height: ${shieldSize}px;
  }
</style></head>
<body>
  <div class="icon">
    <svg viewBox="0 0 100 100">
      <!-- Shield shape -->
      <path d="M50 8 L85 25 L85 55 Q85 80 50 95 Q15 80 15 55 L15 25 Z"
            fill="rgba(0,0,0,0.2)" stroke="none"/>
      <path d="M50 12 L80 27 L80 53 Q80 76 50 90 Q20 76 20 53 L20 27 Z"
            fill="#1e1e2e" stroke="rgba(255,255,255,0.15)" stroke-width="${stroke}"/>
      <!-- Checkmark -->
      <path d="M36 52 L46 62 L66 38"
            fill="none" stroke="#a6e3a1" stroke-width="${Math.max(3, Math.round(size * 0.06))}"
            stroke-linecap="round" stroke-linejoin="round"/>
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
