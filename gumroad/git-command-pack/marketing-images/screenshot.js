/**
 * Render all marketing HTML files to PNG (and the cheat sheet to PDF) using Puppeteer.
 * Usage: node screenshot.js
 *
 * PNG outputs go to the parent directory (git-command-pack/).
 * The PDF cheat sheet goes into package/ so it ships with the bundle.
 */

const puppeteer = require('puppeteer');
const path = require('path');

const pages = [
  { file: 'cover.html',                  output: 'cover.png',                  width: 1280, height: 720 },
  { file: 'thumbnail.html',              output: 'thumbnail.png',              width: 600,  height: 600 },
  { file: 'preview-whats-included.html', output: 'preview-whats-included.png', width: 1280, height: 720 },
  { file: 'preview-cheatsheet.html',     output: 'preview-cheatsheet.png',     width: 1280, height: 720 },
  { file: 'preview-aliases.html',        output: 'preview-aliases.png',        width: 1280, height: 720 },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. Render PNG marketing images
  for (const page of pages) {
    const tab = await browser.newPage();
    await tab.setViewport({
      width: page.width,
      height: page.height,
      deviceScaleFactor: 2,
    });

    const filePath = path.join(__dirname, page.file);
    await tab.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
    await tab.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 500));

    const outputPath = path.join(__dirname, '..', page.output);
    await tab.screenshot({ path: outputPath, type: 'png' });

    console.log(`Saved PNG: ${page.output} (${page.width}x${page.height})`);
    await tab.close();
  }

  // 2. Render the cheat sheet as a PDF for the product bundle
  const pdfTab = await browser.newPage();
  const cheatSheetPath = path.join(__dirname, '..', 'package', 'Git-Cheat-Sheet.html');
  await pdfTab.goto(`file://${cheatSheetPath}`, { waitUntil: 'networkidle0' });
  await pdfTab.evaluate(() => document.fonts.ready);
  await new Promise(resolve => setTimeout(resolve, 500));

  const pdfOutputPath = path.join(__dirname, '..', 'package', 'Git-Cheat-Sheet.pdf');
  await pdfTab.pdf({
    path: pdfOutputPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' },
  });
  console.log(`Saved PDF: package/Git-Cheat-Sheet.pdf`);
  await pdfTab.close();

  await browser.close();
  console.log('\nAll assets generated successfully.');
})();
