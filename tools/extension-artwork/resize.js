// Post-process ComfyUI output and deploy to extension directories
// Usage: node resize.js [--extension name] [--dry-run]
//
// Requires: npm install sharp

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const COMFYUI_OUTPUT = 'C:\\Users\\colet\\Documents\\ComfyUI\\output\\extensions';
const EXTENSIONS_DIR = path.resolve(__dirname, '../../extensions');

const { extensions } = require('./prompts');

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const extFilter = args.find(a => a.startsWith('--extension='));
const filterName = extFilter ? extFilter.split('=')[1] : null;

// Find the generated image file (ComfyUI appends _00001 etc.)
function findImage(dir, prefix) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  // Match files like "ext-name-icon_00001_.png"
  const match = files
    .filter(f => f.startsWith(prefix) && f.endsWith('.png'))
    .sort()
    .pop(); // Take the latest if multiple
  return match ? path.join(dir, match) : null;
}

async function processExtension(ext) {
  console.log(`\n=== ${ext.name} ===`);
  const srcDir = path.join(COMFYUI_OUTPUT, ext.name);
  const extDir = path.join(EXTENSIONS_DIR, ext.name);

  if (!fs.existsSync(srcDir)) {
    console.log(`  SKIP: No output directory found at ${srcDir}`);
    return { processed: 0, skipped: 1 };
  }

  let processed = 0;
  let errors = 0;

  // --- Icons ---
  const iconSrc = findImage(srcDir, `${ext.name}-icon`);
  if (iconSrc) {
    const iconDir = path.join(extDir, 'src', 'icons');
    if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

    for (const size of [128, 48, 16]) {
      const dest = path.join(iconDir, `icon${size}.png`);
      if (dryRun) {
        console.log(`  [DRY RUN] ${iconSrc} -> ${dest} (${size}x${size})`);
      } else {
        try {
          await sharp(iconSrc)
            .resize(size, size, { fit: 'cover' })
            .png()
            .toFile(dest);
          console.log(`  Icon ${size}x${size}: OK`);
          processed++;
        } catch (err) {
          console.error(`  Icon ${size}x${size}: FAILED — ${err.message}`);
          errors++;
        }
      }
    }
  } else {
    console.log('  No icon source found');
  }

  // --- Screenshots ---
  const ssDir = path.join(extDir, 'store-listing', 'screenshots');
  if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

  for (let i = 1; i <= 4; i++) {
    const ssSrc = findImage(srcDir, `${ext.name}-screenshot-${i}`);
    if (ssSrc) {
      const dest = path.join(ssDir, `screenshot-${i}.png`);
      if (dryRun) {
        console.log(`  [DRY RUN] ${ssSrc} -> ${dest} (1280x800)`);
      } else {
        try {
          await sharp(ssSrc)
            .resize(1280, 800, { fit: 'cover' })
            .png()
            .toFile(dest);
          console.log(`  Screenshot ${i}: OK`);
          processed++;
        } catch (err) {
          console.error(`  Screenshot ${i}: FAILED — ${err.message}`);
          errors++;
        }
      }
    } else {
      console.log(`  No screenshot-${i} source found`);
    }
  }

  // --- Promo Small (440x280) ---
  const promoSrc = findImage(srcDir, `${ext.name}-promo-small`);
  if (promoSrc) {
    const dest = path.join(ssDir, 'promo-small.png');
    if (dryRun) {
      console.log(`  [DRY RUN] ${promoSrc} -> ${dest} (440x280)`);
    } else {
      try {
        await sharp(promoSrc)
          .resize(440, 280, { fit: 'cover' })
          .png()
          .toFile(dest);
        console.log('  Promo small: OK');
        processed++;
      } catch (err) {
        console.error(`  Promo small: FAILED — ${err.message}`);
        errors++;
      }
    }
  } else {
    console.log('  No promo-small source found');
  }

  // --- Marquee (1400x560) ---
  const marqueeSrc = findImage(srcDir, `${ext.name}-marquee`);
  if (marqueeSrc) {
    const dest = path.join(ssDir, 'marquee.png');
    if (dryRun) {
      console.log(`  [DRY RUN] ${marqueeSrc} -> ${dest} (1400x560)`);
    } else {
      try {
        await sharp(marqueeSrc)
          .resize(1400, 560, { fit: 'cover' })
          .png()
          .toFile(dest);
        console.log('  Marquee: OK');
        processed++;
      } catch (err) {
        console.error(`  Marquee: FAILED — ${err.message}`);
        errors++;
      }
    }
  } else {
    console.log('  No marquee source found');
  }

  return { processed, errors };
}

(async () => {
  console.log('Extension Artwork Resize & Deploy');
  console.log(`Source: ${COMFYUI_OUTPUT}`);
  console.log(`Target: ${EXTENSIONS_DIR}`);
  if (dryRun) console.log('MODE: DRY RUN (no files written)');

  // Check sharp is installed
  try {
    require.resolve('sharp');
  } catch {
    console.error('\nError: sharp is not installed. Run: npm install sharp');
    process.exit(1);
  }

  const toProcess = filterName
    ? extensions.filter(e => e.name === filterName)
    : extensions;

  if (toProcess.length === 0) {
    console.error(`No extension found matching: ${filterName}`);
    process.exit(1);
  }

  let totalProcessed = 0;
  let totalErrors = 0;

  for (const ext of toProcess) {
    const { processed, errors } = await processExtension(ext);
    totalProcessed += processed || 0;
    totalErrors += errors || 0;
  }

  console.log(`\n========================================`);
  console.log(`Done! Processed: ${totalProcessed} | Errors: ${totalErrors}`);

  if (!dryRun && totalProcessed > 0) {
    console.log('\nNext: Re-zip extensions that were updated.');
    console.log('You can re-zip individually or run a bulk zip script.');
  }
})();
