/**
 * screenshot.js — Puppeteer script to render marketing HTML files as images
 *
 * Usage:
 *   npm install puppeteer
 *   node screenshot.js
 *
 * Outputs PNG files in the same directory as the HTML sources.
 */

const puppeteer = require('puppeteer');
const path = require('path');

/* Define each page to screenshot with its viewport dimensions */
const pages = [
  { file: 'cover.html',              output: 'cover.png',              width: 1280, height: 720  },
  { file: 'preview-comparison.html',  output: 'preview-comparison.png',  width: 1280, height: 720  },
  { file: 'preview-guide.html',       output: 'preview-guide.png',       width: 1280, height: 720  },
  { file: 'preview-quiz.html',        output: 'preview-quiz.png',        width: 1280, height: 720  },
  { file: 'thumbnail.html',           output: 'thumbnail.png',           width: 1200, height: 1200 },
  { file: 'social-banner.html',       output: 'social-banner.png',       width: 1200, height: 630  },
];

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (var i = 0; i < pages.length; i++) {
    var page = await browser.newPage();
    var config = pages[i];

    /* Set viewport to match the design dimensions */
    await page.setViewport({
      width: config.width,
      height: config.height,
      deviceScaleFactor: 2, /* 2x for retina-quality output */
    });

    /* Load the HTML file */
    var filePath = path.resolve(__dirname, config.file);
    await page.goto('file://' + filePath, { waitUntil: 'networkidle0' });

    /* Wait for fonts to load */
    await page.evaluateHandle('document.fonts.ready');

    /* Small delay to ensure rendering is complete */
    await new Promise(function (resolve) { setTimeout(resolve, 500); });

    /* Take screenshot */
    var outputPath = path.resolve(__dirname, config.output);
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: config.width,
        height: config.height,
      },
    });

    console.log('Saved: ' + config.output + ' (' + config.width + 'x' + config.height + ')');
    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured successfully.');
}

captureScreenshots().catch(function (err) {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
