/**
 * Generate API Rate Limiter icons (16, 48, 128) as PNGs using Puppeteer.
 * Speedometer/gauge motif with red/orange colors.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const gaugeSize = Math.round(size * 0.55);
  const stroke = Math.max(2, Math.round(size * 0.06));
  const needleLen = Math.round(gaugeSize * 0.38);
  const cx = Math.round(size / 2);
  const cy = Math.round(size * 0.55);
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
    background: linear-gradient(135deg, #f38ba8 0%, #e53935 100%);
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  svg {
    width: ${gaugeSize}px;
    height: ${gaugeSize}px;
    margin-top: ${Math.round(size * -0.04)}px;
  }
</style></head>
<body>
  <div class="icon">
    <svg viewBox="0 0 100 100">
      <!-- Gauge arc background -->
      <path d="M 15 70 A 40 40 0 1 1 85 70" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="${stroke * 2}" stroke-linecap="round"/>
      <!-- Gauge arc colored segments: green -> yellow -> red -->
      <path d="M 15 70 A 40 40 0 0 1 35 25" fill="none" stroke="#a6e3a1" stroke-width="${stroke}" stroke-linecap="round"/>
      <path d="M 35 25 A 40 40 0 0 1 65 25" fill="none" stroke="#f9e2af" stroke-width="${stroke}" stroke-linecap="round"/>
      <path d="M 65 25 A 40 40 0 0 1 85 70" fill="none" stroke="#1e1e2e" stroke-width="${stroke}" stroke-linecap="round"/>
      <!-- Needle pointing to red zone (~75% through arc) -->
      <line x1="50" y1="60" x2="76" y2="32" stroke="#1e1e2e" stroke-width="${Math.max(2, Math.round(stroke * 0.8))}" stroke-linecap="round"/>
      <!-- Center dot -->
      <circle cx="50" cy="60" r="${Math.max(2, Math.round(stroke * 0.9))}" fill="#1e1e2e"/>
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
