/**
 * generate-icons.mjs
 * Generates icon PNGs (16, 48, 128) for CSS Variables Inspector
 * using Puppeteer to render SVG-based HTML.
 * Purple/violet theme with var() motif.
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizes = [16, 48, 128];

function getIconHTML(size) {
  const fontSize = Math.round(size * 0.35);
  const smallFont = Math.round(size * 0.14);
  const borderRadius = Math.round(size * 0.18);
  const borderWidth = Math.max(1, Math.round(size * 0.02));

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${size}px; height: ${size}px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
  }
  .icon {
    width: ${size}px; height: ${size}px;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6d28d9 100%);
    border-radius: ${borderRadius}px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: ${Math.max(1, Math.round(size * 0.02))}px;
    position: relative;
    box-shadow: inset 0 ${borderWidth}px ${borderWidth * 2}px rgba(255,255,255,0.2);
  }
  .braces {
    font-family: 'Segoe UI', 'SF Mono', monospace;
    font-size: ${fontSize}px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    letter-spacing: ${Math.max(0, Math.round(size * 0.01))}px;
    text-shadow: 0 ${borderWidth}px ${borderWidth * 2}px rgba(0,0,0,0.3);
  }
  .label {
    font-family: 'Segoe UI', sans-serif;
    font-size: ${smallFont}px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: ${Math.max(0, Math.round(size * 0.01))}px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    display: ${size < 32 ? 'none' : 'block'};
  }
</style>
</head>
<body>
  <div class="icon">
    <div class="braces">--</div>
    <div class="label">var</div>
  </div>
</body></html>`;
}

async function generateIcons() {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const size of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(getIconHTML(size), { waitUntil: 'load' });

    const outputPath = path.join(__dirname, 'src', 'icons', `icon${size}.png`);
    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: true
    });
    console.log(`Generated ${outputPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All icons generated.');
}

generateIcons().catch(console.error);
