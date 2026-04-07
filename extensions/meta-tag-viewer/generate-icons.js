/**
 * Generate Meta Tag Viewer icons (16, 48, 128) as PNGs using Puppeteer.
 * Tag/label theme with green gradient.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const sizes = [16, 48, 128];

const iconHtml = (size) => {
  const r = Math.round(size * 0.18);
  const center = size / 2;
  const pad = Math.round(size * 0.12);
  const tagW = size - pad * 2;
  const tagH = Math.round(tagW * 0.7);
  const tagX = pad;
  const tagY = Math.round((size - tagH) / 2);
  const strokeW = Math.max(1, Math.round(size * 0.04));
  const cornerR = Math.round(size * 0.08);

  /* Tag shape: rectangle with a folded corner */
  const foldSize = Math.round(tagW * 0.22);

  /* Angle bracket < > inside the tag */
  const bracketSize = Math.round(tagH * 0.35);
  const bracketStroke = Math.max(1, Math.round(size * 0.06));
  const bCenterY = tagY + tagH / 2;
  const bLeftX = tagX + tagW * 0.25;
  const bRightX = tagX + tagW * 0.75;

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
  }
  svg { position: absolute; top: 0; left: 0; }
</style></head>
<body><div class="icon">
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <!-- Tag body -->
    <rect x="${tagX}" y="${tagY}" width="${tagW}" height="${tagH}"
          rx="${cornerR}" ry="${cornerR}"
          fill="#1e1e2e" opacity="0.85"/>
    <!-- Folded corner -->
    <path d="M ${tagX + tagW - foldSize} ${tagY}
             L ${tagX + tagW} ${tagY + foldSize}
             L ${tagX + tagW - foldSize} ${tagY + foldSize} Z"
          fill="#a6e3a1" opacity="0.5"/>
    <!-- Left angle bracket < -->
    <polyline points="${bLeftX + bracketSize * 0.4},${bCenterY - bracketSize * 0.5}
                      ${bLeftX - bracketSize * 0.1},${bCenterY}
                      ${bLeftX + bracketSize * 0.4},${bCenterY + bracketSize * 0.5}"
              fill="none" stroke="#a6e3a1" stroke-width="${bracketStroke}"
              stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Right angle bracket > -->
    <polyline points="${bRightX - bracketSize * 0.4},${bCenterY - bracketSize * 0.5}
                      ${bRightX + bracketSize * 0.1},${bCenterY}
                      ${bRightX - bracketSize * 0.4},${bCenterY + bracketSize * 0.5}"
              fill="none" stroke="#a6e3a1" stroke-width="${bracketStroke}"
              stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Slash / between brackets -->
    <line x1="${center - bracketSize * 0.15}" y1="${bCenterY + bracketSize * 0.35}"
          x2="${center + bracketSize * 0.15}" y2="${bCenterY - bracketSize * 0.35}"
          stroke="#a6e3a1" stroke-width="${bracketStroke}"
          stroke-linecap="round" opacity="0.7"/>
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
