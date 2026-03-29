/**
 * Generate Service Worker Inspector icons (16, 48, 128) as PNGs using Puppeteer.
 * Blue/teal theme with a gear/cog motif.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);      // border radius
  const gearSize = Math.round(size * 0.65);
  const strokeW = Math.max(1, Math.round(size * 0.06));
  const center = size / 2;
  const outerR = gearSize / 2;
  const innerR = outerR * 0.55;
  const toothH = outerR * 0.25;
  const teeth = 8;

  // Build gear path with teeth
  let gearPath = '';
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 0.35) / teeth) * Math.PI * 2 - Math.PI / 2;
    const a3 = ((i + 0.65) / teeth) * Math.PI * 2 - Math.PI / 2;
    const a4 = ((i + 1) / teeth) * Math.PI * 2 - Math.PI / 2;

    const rOuter = outerR;
    const rInner = outerR - toothH;

    if (i === 0) {
      gearPath += 'M ' + (center + rOuter * Math.cos(a1)) + ' ' + (center + rOuter * Math.sin(a1)) + ' ';
    }
    gearPath += 'L ' + (center + rOuter * Math.cos(a2)) + ' ' + (center + rOuter * Math.sin(a2)) + ' ';
    gearPath += 'L ' + (center + rInner * Math.cos(a3)) + ' ' + (center + rInner * Math.sin(a3)) + ' ';
    gearPath += 'L ' + (center + rInner * Math.cos(a4)) + ' ' + (center + rInner * Math.sin(a4)) + ' ';
    if (i < teeth - 1) {
      const aNext = ((i + 1) / teeth) * Math.PI * 2 - Math.PI / 2;
      gearPath += 'L ' + (center + rOuter * Math.cos(aNext)) + ' ' + (center + rOuter * Math.sin(aNext)) + ' ';
    }
  }
  gearPath += 'Z';

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
    background: linear-gradient(135deg, #89dceb 0%, #0891b2 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  svg { position: absolute; top: 0; left: 0; }
</style></head>
<body><div class="icon">
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <path d="${gearPath}" fill="#1e1e2e" opacity="0.85"/>
    <circle cx="${center}" cy="${center}" r="${innerR * 0.5}" fill="#89dceb"/>
    <circle cx="${center}" cy="${center}" r="${innerR * 0.25}" fill="#1e1e2e" opacity="0.6"/>
  </svg>
</div></body></html>`;
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
