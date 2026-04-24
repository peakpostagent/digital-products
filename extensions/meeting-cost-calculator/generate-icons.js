#!/usr/bin/env node
// generate-icons.js — Build icon16/48/128 PNGs from a single SVG source.
//
// Design: full-bleed rounded square in the Meeting Cost Calculator brand
// orange gradient, with a bold dollar sign and a thin clock-hand accent
// ($ = cost, clock = meeting time). Fills the entire 128×128 frame — no
// "icon floating in empty space" padding that CWS reviewers dislike.
//
// Requires sharp (already in repo-root node_modules).
//
// Usage:
//   node generate-icons.js
//
// Writes:
//   src/icons/icon16.png
//   src/icons/icon48.png
//   src/icons/icon128.png

const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '..', '..', 'node_modules', 'sharp'));

const OUT_DIR = path.resolve(__dirname, 'src', 'icons');

// Brand colors — orange gradient matches the paywall banner's
// #e8710a accent and the action-oriented feel of the extension.
const COLOR_TOP = '#f59e0b';    // amber 500
const COLOR_BOTTOM = '#ea580c'; // orange 600
const COLOR_STROKE = '#9a3412'; // orange 900 (subtle outer rim for sharpness at small sizes)

// SVG source — everything is percentage / viewBox-based so it scales cleanly
// to 16, 48, or 128 px. The viewBox is 128×128 to match CWS's canonical size.
function buildSvg(size) {
  // Stroke width scales down for tiny icons so the outline doesn't dominate.
  const strokeW = size >= 48 ? 3 : 2;
  // Corner radius proportional so it reads as a rounded square at all sizes.
  const corner = 22;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${COLOR_TOP}"/>
      <stop offset="100%" stop-color="${COLOR_BOTTOM}"/>
    </linearGradient>
    <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Full-bleed rounded square background -->
  <rect x="0" y="0" width="128" height="128" rx="${corner}" ry="${corner}"
        fill="url(#bg)"
        stroke="${COLOR_STROKE}" stroke-width="${strokeW}"
        stroke-opacity="0.5"/>

  <!-- Clock-face subtle ring — thin, white, low opacity. Hints at "time" -->
  <circle cx="64" cy="64" r="44"
          fill="none"
          stroke="#ffffff" stroke-width="3"
          stroke-opacity="0.28"/>

  <!-- 12 o'clock tick -->
  <line x1="64" y1="20" x2="64" y2="28"
        stroke="#ffffff" stroke-width="3"
        stroke-opacity="0.5" stroke-linecap="round"/>

  <!-- Big dollar sign — the primary signal, fills most of the frame -->
  <text x="64" y="94"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="86"
        font-weight="900"
        fill="#ffffff"
        filter="url(#dropshadow)">$</text>
</svg>`;
}

async function renderOne(size) {
  const svg = buildSvg(size);
  const outPath = path.join(OUT_DIR, `icon${size}.png`);
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  const bytes = fs.statSync(outPath).size;
  console.log(`  wrote ${outPath}  (${size}×${size}, ${bytes} bytes)`);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  console.log('Generating MCC icons from SVG source...');
  for (const size of [16, 48, 128]) {
    await renderOne(size);
  }
  console.log('Done. Rebuild the zip via build-zip.ps1 to bundle the new icons.');
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
