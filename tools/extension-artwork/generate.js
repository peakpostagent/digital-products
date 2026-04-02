// Queue all extension artwork to ComfyUI API (JuggernautXL v9)
// Usage: node generate.js [--icons-only] [--extension name]

const { extensions } = require('./prompts');

const COMFYUI = 'http://127.0.0.1:8000/prompt';
const MODEL = 'juggernautXL_v9.safetensors';

// SDXL settings for JuggernautXL
const STEPS = 35;
const CFG = 7;
const SAMPLER = 'dpmpp_2m';
const SCHEDULER = 'karras';

// Parse CLI args
const args = process.argv.slice(2);
const iconsOnly = args.includes('--icons-only');
const screenshotsOnly = args.includes('--screenshots-only');
const extFilter = args.find(a => a.startsWith('--extension='));
const filterName = extFilter ? extFilter.split('=')[1] : null;

const NEG_PROMPT = 'blurry, low quality, watermark, text, logo, words, letters, writing, label, caption, title, heading, deformed, ugly, bad anatomy, poorly drawn, worst quality, jpeg artifacts, noisy, grainy, oversaturated';

// Build an SDXL-compatible ComfyUI workflow
function buildWorkflow(prompt, width, height, seed, filenamePrefix) {
  return {
    prompt: {
      // Load SDXL checkpoint
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: MODEL }
      },
      // Positive prompt
      '6': {
        class_type: 'CLIPTextEncode',
        inputs: { text: prompt, clip: ['4', 1] }
      },
      // Negative prompt
      '7': {
        class_type: 'CLIPTextEncode',
        inputs: { text: NEG_PROMPT, clip: ['4', 1] }
      },
      // Latent image at target dimensions
      '5': {
        class_type: 'EmptyLatentImage',
        inputs: { width, height, batch_size: 1 }
      },
      // KSampler with Flux settings
      '3': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps: STEPS,
          cfg: CFG,
          sampler_name: SAMPLER,
          scheduler: SCHEDULER,
          denoise: 1,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0]
        }
      },
      // Decode latent to image
      '8': {
        class_type: 'VAEDecode',
        inputs: { samples: ['3', 0], vae: ['4', 2] }
      },
      // Save image
      '9': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: filenamePrefix,
          images: ['8', 0]
        }
      }
    }
  };
}

async function queueImage(prompt, width, height, seed, filenamePrefix) {
  const workflow = buildWorkflow(prompt, width, height, seed, filenamePrefix);

  try {
    const res = await fetch(COMFYUI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  FAILED: ${filenamePrefix} — ${res.status} ${errText.substring(0, 200)}`);
      return false;
    }

    const data = await res.json();
    console.log(`  Queued: ${filenamePrefix} (${width}x${height}) -> ${data.prompt_id.substring(0, 12)}...`);
    return true;
  } catch (err) {
    console.error(`  ERROR: ${filenamePrefix} — ${err.message}`);
    return false;
  }
}

async function generateExtension(ext) {
  console.log(`\n=== ${ext.name} ===`);

  let queued = 0;
  let failed = 0;

  // Icon — 1024x1024 (will be resized to 128, 48, 16 later)
  if (!screenshotsOnly) {
    const ok = await queueImage(ext.icon, 1024, 1024, 42, `extensions/${ext.name}/${ext.name}-icon`);
    ok ? queued++ : failed++;
  }

  if (!iconsOnly) {
    // Screenshots — 1280x800
    for (let i = 0; i < ext.screenshots.length; i++) {
      const ok = await queueImage(ext.screenshots[i], 1280, 800, 100 + i, `extensions/${ext.name}/${ext.name}-screenshot-${i + 1}`);
      ok ? queued++ : failed++;
    }

    // Promo small — generate at 880x560, resize to 440x280 later
    const promoOk = await queueImage(ext.promo, 880, 560, 200, `extensions/${ext.name}/${ext.name}-promo-small`);
    promoOk ? queued++ : failed++;

    // Marquee — generate at 1408x576 (closest to 1400x560 divisible by 64)
    const marqueeOk = await queueImage(ext.marquee, 1408, 576, 300, `extensions/${ext.name}/${ext.name}-marquee`);
    marqueeOk ? queued++ : failed++;
  }

  return { queued, failed };
}

(async () => {
  console.log('Extension Artwork Generator — ComfyUI + JuggernautXL v9');
  console.log(`Endpoint: ${COMFYUI}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Mode: ${iconsOnly ? 'Icons only' : screenshotsOnly ? 'Screenshots only' : 'All artwork'}`);
  if (filterName) console.log(`Filter: ${filterName}`);
  console.log('');

  // Test connection
  try {
    const test = await fetch('http://127.0.0.1:8000/system_stats');
    if (!test.ok) throw new Error(`Status ${test.status}`);
    console.log('ComfyUI connection OK');
  } catch (err) {
    console.error(`Cannot connect to ComfyUI at http://127.0.0.1:8000 — ${err.message}`);
    console.error('Make sure ComfyUI is running.');
    process.exit(1);
  }

  const toProcess = filterName
    ? extensions.filter(e => e.name === filterName)
    : extensions;

  if (toProcess.length === 0) {
    console.error(`No extension found matching: ${filterName}`);
    console.error('Available:', extensions.map(e => e.name).join(', '));
    process.exit(1);
  }

  let totalQueued = 0;
  let totalFailed = 0;

  for (const ext of toProcess) {
    const { queued, failed } = await generateExtension(ext);
    totalQueued += queued;
    totalFailed += failed;
  }

  console.log(`\n========================================`);
  console.log(`Done! Queued: ${totalQueued} | Failed: ${totalFailed}`);
  console.log(`Total images: ${totalQueued + totalFailed}`);
  console.log(`\nImages will be saved to ComfyUI's output/extensions/ directory.`);
  console.log(`Run resize.js after all images are generated to deploy them.`);
})();
