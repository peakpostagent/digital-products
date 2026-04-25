#!/usr/bin/env node
// generate-icons.js — Etsy SEO Tag Generator branded icon set.
//
// Design: full-bleed teal-to-blue gradient (signals optimization/growth,
// deliberately NOT Etsy-orange to avoid trademark confusion). A simple
// price-tag glyph with an upward arrow is the primary symbol — reads as
// "tag SEO" at any size.

const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '..', '..', 'node_modules', 'sharp'));

const OUT_DIR = path.resolve(__dirname, 'src', 'icons');

const COLOR_TOP = '#14b8a6';     // teal 500
const COLOR_BOTTOM = '#0891b2';  // cyan 600
const COLOR_STROKE = '#0e7490';  // cyan 700

function buildSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${COLOR_TOP}"/>
      <stop offset="100%" stop-color="${COLOR_BOTTOM}"/>
    </linearGradient>
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="2" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Full-bleed background -->
  <rect x="0" y="0" width="128" height="128" rx="22" ry="22"
        fill="url(#bg)"
        stroke="${COLOR_STROKE}" stroke-width="3" stroke-opacity="0.5"/>

  <!-- Price-tag shape (white) -->
  <g filter="url(#ds)">
    <path d="M 36 30 L 76 30 L 102 56 L 72 86 L 32 86 L 32 38 Z"
          fill="#ffffff"
          stroke="${COLOR_STROKE}" stroke-width="2"
          stroke-linejoin="round"/>
    <!-- Tag-hole circle -->
    <circle cx="46" cy="46" r="6" fill="${COLOR_BOTTOM}"/>
  </g>

  <!-- Upward arrow inside the tag — signals "improve / grow" -->
  <g stroke="${COLOR_BOTTOM}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M 56 76 L 70 60 L 84 76"/>
    <line x1="70" y1="60" x2="70" y2="80"/>
  </g>
</svg>`;
}

async function renderOne(size) {
  const outPath = path.join(OUT_DIR, `icon${size}.png`);
  await sharp(Buffer.from(buildSvg()))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`  wrote ${outPath} (${size}×${size}, ${fs.statSync(outPath).size} bytes)`);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Generating Etsy SEO Tag Generator icons...');
  for (const size of [16, 48, 128]) {
    await renderOne(size);
  }
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
