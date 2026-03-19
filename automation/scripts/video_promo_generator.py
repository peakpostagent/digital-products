"""
Extension Promo Video Generator
================================
Uses Ollama (Qwen3 14B) for creative prompt generation,
and ComfyUI (Flux + Wan 2.2) for image-to-video creation.

Pipeline:
  1. Ollama generates a creative image prompt for the extension
  2. Flux generates a high-quality source image via ComfyUI API
  3. Ollama generates a motion/animation prompt
  4. Wan 2.2 I2V (two-stage) creates a 5-second video from the image

Requirements:
  - ComfyUI running on http://127.0.0.1:8000
  - Ollama running on http://localhost:11434 with qwen3:14b
  - pip install websocket-client

Usage:
  python video_promo_generator.py --extension "Pay Decoder"
  python video_promo_generator.py --all
  python video_promo_generator.py --extension "Pay Decoder" --skip-ollama --image-prompt "your prompt"
"""

import json
import uuid
import time
import os
import sys
import random
import argparse
import urllib.request
import urllib.parse

# Try to import websocket, give helpful error if missing
try:
    import websocket
except ImportError:
    print("ERROR: websocket-client not installed. Run: pip install websocket-client")
    sys.exit(1)


# ============================================
# Configuration
# ============================================
COMFYUI_SERVER = "127.0.0.1:8000"
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen3:14b"

# Output directory for generated videos
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                          "extensions", "_promo_videos")

# Image resolution (matches Wan 2.2 I2V defaults)
IMG_WIDTH = 832
IMG_HEIGHT = 480

# Video settings
VIDEO_FRAMES = 81    # 81 frames at 16fps = ~5 seconds
VIDEO_FPS = 16
SAMPLING_STEPS = 40  # Total steps for I2V (split between stages)
STAGE1_END = 28      # Stage 1 runs steps 0-28
CFG_SCALE = 6.0

# Extension metadata for prompt generation
EXTENSIONS = {
    "Pay Decoder": {
        "color": "#2e7d32",
        "concept": "salary conversion, job listings, money, hourly rates",
        "description": "Converts job salaries between hourly, monthly, biweekly, and annual formats",
        "audience": "job seekers, freelancers, recruiters"
    },
    "Job Match Score": {
        "color": "#1976d2",
        "concept": "resume matching, job search, keyword analysis, career",
        "description": "Analyzes LinkedIn job listings and shows resume match score",
        "audience": "job seekers, career changers"
    },
    "Meeting Cost Calculator": {
        "color": "#ff6f00",
        "concept": "meetings, time management, calendar, productivity, money",
        "description": "Shows the dollar cost of meetings based on attendee salaries",
        "audience": "managers, knowledge workers"
    },
    "DotEnv Preview": {
        "color": "#f57c00",
        "concept": "code, developer tools, environment variables, GitHub",
        "description": "Formats and syntax-highlights .env files on GitHub",
        "audience": "developers, DevOps engineers"
    },
    "Review Clock": {
        "color": "#5c6bc0",
        "concept": "code review, GitHub, pull requests, timer, productivity",
        "description": "Tracks time spent reviewing GitHub pull requests",
        "audience": "developers, engineering managers"
    },
    "Read Cost": {
        "color": "#00897b",
        "concept": "reading, articles, time management, knowledge work",
        "description": "Shows the dollar cost of reading articles based on hourly rate",
        "audience": "knowledge workers, consultants"
    },
    "Tab Brake": {
        "color": "#e53935",
        "concept": "tab management, focus, digital minimalism, productivity",
        "description": "Sets a tab limit and blocks new tabs when you hit the cap",
        "audience": "knowledge workers, students, anyone"
    }
}


# ============================================
# Ollama Integration
# ============================================
def ask_ollama(prompt, temperature=0.7):
    """Send a prompt to Ollama and return the response text."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 300
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(OLLAMA_URL, data=data,
                                headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            return result.get("response", "").strip()
    except Exception as e:
        print(f"  [WARN] Ollama error: {e}")
        return None


def generate_image_prompt(extension_name):
    """Use Ollama to create a creative Flux image prompt for the extension."""
    ext = EXTENSIONS[extension_name]
    prompt = f"""You are a creative director generating image prompts for AI image generation (Flux model).

Create a single, vivid image prompt for a promotional image for a Chrome browser extension called "{extension_name}".

Extension description: {ext['description']}
Target audience: {ext['audience']}
Visual concepts: {ext['concept']}
Brand color: {ext['color']}

Requirements:
- The image should be a clean, modern, professional tech/productivity scene
- Do NOT include any text, words, logos, or UI elements in the prompt
- Focus on a visual metaphor that represents the extension's purpose
- Use professional photography style with soft lighting
- Include the brand color subtly in the scene
- Keep it simple and elegant - fewer elements is better
- The scene should feel aspirational and modern

Respond with ONLY the image prompt, nothing else. No quotes, no explanation, just the prompt."""

    print(f"  Generating image prompt with Ollama...")
    response = ask_ollama(prompt, temperature=0.8)
    if response:
        # Clean up - remove any thinking tags or extra content
        if "</think>" in response:
            response = response.split("</think>")[-1].strip()
        # Remove quotes if present
        response = response.strip('"').strip("'")
        return response
    else:
        # Fallback prompt if Ollama fails
        return f"professional modern workspace desk, laptop computer screen, {ext['concept']}, soft warm lighting, shallow depth of field, clean minimalist photography, {ext['color']} accent color objects"


def generate_motion_prompt(extension_name, image_prompt):
    """Use Ollama to create a motion/animation prompt for the I2V model."""
    ext = EXTENSIONS[extension_name]
    prompt = f"""You are creating a motion description for an AI video generator (Wan 2.2 Image-to-Video model).

The source image shows: {image_prompt}

Create a short motion description that will bring this image to life with subtle, professional movement.

Requirements:
- Describe gentle, subtle motion only (slight camera movement, soft lighting changes, small ambient movement)
- Keep it SHORT - maximum 2 sentences
- Do NOT describe drastic changes, new objects appearing, or scene changes
- Good examples: "gentle camera dolly forward with soft bokeh shift", "subtle light rays moving across the scene"
- The motion should feel professional and polished, like a high-end product video

Respond with ONLY the motion prompt, nothing else."""

    print(f"  Generating motion prompt with Ollama...")
    response = ask_ollama(prompt, temperature=0.6)
    if response:
        if "</think>" in response:
            response = response.split("</think>")[-1].strip()
        response = response.strip('"').strip("'")
        return response
    else:
        return "gentle slow camera dolly forward, soft ambient light shifting, subtle depth of field change, professional cinematic movement"


# ============================================
# ComfyUI API Functions
# ============================================
def queue_prompt(prompt_data, client_id):
    """Queue a prompt on ComfyUI and return the prompt_id."""
    prompt_id = str(uuid.uuid4())
    payload = {
        "prompt": prompt_data,
        "client_id": client_id,
        "prompt_id": prompt_id
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"http://{COMFYUI_SERVER}/api/prompt",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return result.get("prompt_id", prompt_id)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  [ERROR] ComfyUI API error: {e.code}")
        print(f"  {error_body[:500]}")
        return None


def wait_for_completion(ws, prompt_id):
    """Wait for a ComfyUI prompt to finish via WebSocket."""
    start_time = time.time()
    last_progress = ""
    while True:
        try:
            out = ws.recv()
            if isinstance(out, str):
                msg = json.loads(out)
                msg_type = msg.get("type", "")
                msg_data = msg.get("data", {})

                if msg_type == "progress":
                    value = msg_data.get("value", 0)
                    max_val = msg_data.get("max", 0)
                    if max_val > 0:
                        pct = int((value / max_val) * 100)
                        progress_str = f"\r  Progress: {pct}% ({value}/{max_val})"
                        if progress_str != last_progress:
                            print(progress_str, end="", flush=True)
                            last_progress = progress_str

                elif msg_type == "executing":
                    node = msg_data.get("node")
                    if node is None and msg_data.get("prompt_id") == prompt_id:
                        elapsed = time.time() - start_time
                        print(f"\n  Completed in {elapsed:.0f}s")
                        return True

                elif msg_type == "execution_error":
                    print(f"\n  [ERROR] Execution failed: {json.dumps(msg_data)[:300]}")
                    return False

            # Binary data = preview frames, skip
        except websocket.WebSocketTimeoutException:
            elapsed = time.time() - start_time
            if elapsed > 3600:  # 60 minute timeout
                print("\n  [ERROR] Timeout after 20 minutes")
                return False


def get_history(prompt_id):
    """Get execution history for a prompt."""
    url = f"http://{COMFYUI_SERVER}/api/history/{prompt_id}"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())


def upload_image(filepath):
    """Upload an image to ComfyUI's input directory."""
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        image_data = f.read()

    # Build multipart form data manually
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex[:16]}"
    body = b""
    body += f"--{boundary}\r\n".encode()
    body += f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'.encode()
    body += b"Content-Type: image/png\r\n\r\n"
    body += image_data
    body += f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        f"http://{COMFYUI_SERVER}/api/upload/image",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        return result.get("name", filename)


def download_file(filename, subfolder, folder_type, save_path):
    """Download a file from ComfyUI output."""
    params = urllib.parse.urlencode({
        "filename": filename,
        "subfolder": subfolder,
        "type": folder_type
    })
    url = f"http://{COMFYUI_SERVER}/api/view?{params}"
    with urllib.request.urlopen(url) as resp:
        with open(save_path, "wb") as f:
            f.write(resp.read())


# ============================================
# Flux Image Generation (API Prompt)
# ============================================
def build_flux_prompt(text_prompt, negative_prompt="", seed=None, width=832, height=480):
    """Build a ComfyUI API prompt for Flux image generation (no LoRA)."""
    if seed is None:
        seed = random.randint(0, 2**32 - 1)

    return {
        # Node 1: Load Flux model
        "1": {
            "class_type": "UNETLoader",
            "inputs": {
                "unet_name": "flux1-dev-fp8.safetensors",
                "weight_dtype": "fp8_e4m3fn"
            }
        },
        # Node 2: Load dual CLIP encoders
        "2": {
            "class_type": "DualCLIPLoader",
            "inputs": {
                "clip_name1": "clip_l.safetensors",
                "clip_name2": "t5xxl_fp8_e4m3fn.safetensors",
                "type": "flux"
            }
        },
        # Node 3: Load VAE
        "3": {
            "class_type": "VAELoader",
            "inputs": {
                "vae_name": "ae.safetensors"
            }
        },
        # Node 5: Positive prompt
        "5": {
            "class_type": "CLIPTextEncodeFlux",
            "inputs": {
                "clip": ["2", 0],
                "clip_l": text_prompt[:77],   # CLIP-L has ~77 token limit
                "t5xxl": text_prompt,          # T5 handles the full prompt
                "guidance": 3.5
            }
        },
        # Node 6: Negative prompt (empty for Flux - uses cfg 1.0)
        "6": {
            "class_type": "CLIPTextEncodeFlux",
            "inputs": {
                "clip": ["2", 0],
                "clip_l": negative_prompt,
                "t5xxl": negative_prompt,
                "guidance": 3.5
            }
        },
        # Node 7: Empty latent image
        "7": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            }
        },
        # Node 8: KSampler
        "8": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["1", 0],
                "positive": ["5", 0],
                "negative": ["6", 0],
                "latent_image": ["7", 0],
                "seed": seed,
                "steps": 30,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0
            }
        },
        # Node 9: VAE Decode
        "9": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["8", 0],
                "vae": ["3", 0]
            }
        },
        # Node 10: Save Image
        "10": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["9", 0],
                "filename_prefix": "promo/source_img"
            }
        }
    }


# ============================================
# Wan 2.2 Image-to-Video (API Prompt)
# ============================================
def build_i2v_prompt(image_filename, motion_prompt, negative_prompt="",
                     seed=None, width=832, height=480, length=81):
    """Build a ComfyUI API prompt for Wan 2.2 two-stage I2V."""
    if seed is None:
        seed = random.randint(0, 2**32 - 1)

    if not negative_prompt:
        negative_prompt = "blurry, distorted, deformed, low quality, watermark, text, logo, ugly, glitch, artifacts"

    return {
        # ---- Model Loading ----
        # Node 1: Stage 1 model (high noise)
        "1": {
            "class_type": "UNETLoader",
            "inputs": {
                "unet_name": "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors",
                "weight_dtype": "fp8_e4m3fn"
            }
        },
        # Node 15: Stage 2 model (low noise)
        "15": {
            "class_type": "UNETLoader",
            "inputs": {
                "unet_name": "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors",
                "weight_dtype": "fp8_e4m3fn"
            }
        },
        # Node 2: Apply shift to Stage 2 model
        "2": {
            "class_type": "ModelSamplingSD3",
            "inputs": {
                "model": ["15", 0],
                "shift": 8.0
            }
        },
        # ---- Text Encoding ----
        # Node 3: CLIP text encoder (UMT5)
        "3": {
            "class_type": "CLIPLoader",
            "inputs": {
                "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
                "type": "wan"
            }
        },
        # Node 4: Positive prompt
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["3", 0],
                "text": motion_prompt
            }
        },
        # Node 5: Negative prompt
        "5": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["3", 0],
                "text": negative_prompt
            }
        },
        # ---- Image/Vision Loading ----
        # Node 6: Video VAE
        "6": {
            "class_type": "VAELoader",
            "inputs": {
                "vae_name": "wan_2.1_vae.safetensors"
            }
        },
        # Node 7: CLIP Vision encoder
        "7": {
            "class_type": "CLIPVisionLoader",
            "inputs": {
                "clip_name": "clip_vision_h.safetensors"
            }
        },
        # Node 12: Load source image
        "12": {
            "class_type": "LoadImage",
            "inputs": {
                "image": image_filename
            }
        },
        # Node 8: Encode image with CLIP Vision
        "8": {
            "class_type": "CLIPVisionEncode",
            "inputs": {
                "clip_vision": ["7", 0],
                "image": ["12", 0],
                "crop": "none"
            }
        },
        # ---- I2V Conditioning ----
        # Node 9: WanImageToVideo conditioning
        "9": {
            "class_type": "WanImageToVideo",
            "inputs": {
                "positive": ["4", 0],
                "negative": ["5", 0],
                "vae": ["6", 0],
                "width": width,
                "height": height,
                "length": length,
                "batch_size": 1,
                "clip_vision_output": ["8", 0],
                "start_image": ["12", 0]
            }
        },
        # ---- Two-Stage Sampling ----
        # Node 10: Stage 1 (high noise, steps 0-28)
        "10": {
            "class_type": "KSamplerAdvanced",
            "inputs": {
                "model": ["1", 0],
                "add_noise": "enable",
                "noise_seed": seed,
                "steps": SAMPLING_STEPS,
                "cfg": CFG_SCALE,
                "sampler_name": "euler",
                "scheduler": "normal",
                "positive": ["9", 0],
                "negative": ["9", 1],
                "latent_image": ["9", 2],
                "start_at_step": 0,
                "end_at_step": STAGE1_END,
                "return_with_leftover_noise": "enable"
            }
        },
        # Node 16: Stage 2 (low noise, steps 28-40)
        "16": {
            "class_type": "KSamplerAdvanced",
            "inputs": {
                "model": ["2", 0],
                "add_noise": "disable",
                "noise_seed": seed,
                "steps": SAMPLING_STEPS,
                "cfg": CFG_SCALE,
                "sampler_name": "euler",
                "scheduler": "normal",
                "positive": ["9", 0],
                "negative": ["9", 1],
                "latent_image": ["10", 0],
                "start_at_step": STAGE1_END,
                "end_at_step": SAMPLING_STEPS,
                "return_with_leftover_noise": "disable"
            }
        },
        # ---- Output ----
        # Node 11: VAE Decode (latent to frames)
        "11": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["16", 0],
                "vae": ["6", 0]
            }
        },
        # Node 13: Create video from frames
        "13": {
            "class_type": "CreateVideo",
            "inputs": {
                "images": ["11", 0],
                "fps": float(VIDEO_FPS)
            }
        },
        # Node 14: Save video
        "14": {
            "class_type": "SaveVideo",
            "inputs": {
                "video": ["13", 0],
                "filename_prefix": "video/promo",
                "format": "auto",
                "codec": "auto"
            }
        }
    }


# ============================================
# Main Pipeline
# ============================================
def generate_promo_video(extension_name, image_prompt=None, motion_prompt=None, seed=None):
    """Generate a complete promo video for an extension.

    Steps:
      1. Generate creative prompts with Ollama (if not provided)
      2. Generate source image with Flux
      3. Upload source image to ComfyUI
      4. Generate video with Wan 2.2 I2V
      5. Save video to output directory
    """
    print(f"\n{'='*60}")
    print(f"  Generating promo video for: {extension_name}")
    print(f"{'='*60}")

    if extension_name not in EXTENSIONS:
        print(f"  [ERROR] Unknown extension: {extension_name}")
        print(f"  Available: {', '.join(EXTENSIONS.keys())}")
        return False

    ext = EXTENSIONS[extension_name]
    safe_name = extension_name.lower().replace(" ", "-")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if seed is None:
        seed = random.randint(0, 2**32 - 1)

    # ---- Step 1: Generate prompts with Ollama ----
    if not image_prompt:
        image_prompt = generate_image_prompt(extension_name)
    print(f"\n  Image prompt: {image_prompt[:100]}...")

    if not motion_prompt:
        motion_prompt = generate_motion_prompt(extension_name, image_prompt)
    print(f"  Motion prompt: {motion_prompt[:100]}...")

    # Save prompts for reference
    prompts_file = os.path.join(OUTPUT_DIR, f"{safe_name}_prompts.json")
    with open(prompts_file, "w") as f:
        json.dump({
            "extension": extension_name,
            "image_prompt": image_prompt,
            "motion_prompt": motion_prompt,
            "seed": seed
        }, f, indent=2)
    print(f"  Saved prompts to {prompts_file}")

    # ---- Step 2: Connect WebSocket ----
    client_id = str(uuid.uuid4())
    ws = websocket.WebSocket()
    ws.settimeout(120)  # 2 minute timeout per recv (I2V steps take ~60s each)
    try:
        ws.connect(f"ws://{COMFYUI_SERVER}/ws?clientId={client_id}")
        print(f"  Connected to ComfyUI WebSocket")
    except Exception as e:
        print(f"  [ERROR] Cannot connect to ComfyUI: {e}")
        print(f"  Make sure ComfyUI is running on {COMFYUI_SERVER}")
        return False

    # ---- Step 3: Generate source image with Flux ----
    print(f"\n  Step 1/2: Generating source image with Flux...")
    flux_prompt = build_flux_prompt(
        text_prompt=image_prompt,
        seed=seed,
        width=IMG_WIDTH,
        height=IMG_HEIGHT
    )

    prompt_id = queue_prompt(flux_prompt, client_id)
    if not prompt_id:
        ws.close()
        return False

    success = wait_for_completion(ws, prompt_id)
    if not success:
        ws.close()
        return False

    # Get the generated image filename from history
    history = get_history(prompt_id)
    if prompt_id not in history:
        print("  [ERROR] Could not find prompt in history")
        ws.close()
        return False

    image_output = history[prompt_id]["outputs"].get("10", {})
    if "images" not in image_output or not image_output["images"]:
        print("  [ERROR] No image was generated")
        ws.close()
        return False

    gen_image = image_output["images"][0]
    gen_filename = gen_image["filename"]
    gen_subfolder = gen_image.get("subfolder", "")
    print(f"  Source image generated: {gen_filename}")

    # Download the source image to our output dir too
    source_img_path = os.path.join(OUTPUT_DIR, f"{safe_name}_source.png")
    download_file(gen_filename, gen_subfolder, "output", source_img_path)
    print(f"  Saved source image to {source_img_path}")

    # ---- Step 4: Upload image to ComfyUI input directory ----
    print(f"\n  Uploading source image to ComfyUI input...")
    uploaded_name = upload_image(source_img_path)
    print(f"  Uploaded as: {uploaded_name}")

    # ---- Step 5: Generate video with Wan 2.2 I2V ----
    print(f"\n  Step 2/2: Generating video with Wan 2.2 I2V (this takes 5-15 minutes)...")
    i2v_prompt = build_i2v_prompt(
        image_filename=uploaded_name,
        motion_prompt=motion_prompt,
        seed=seed,
        width=IMG_WIDTH,
        height=IMG_HEIGHT,
        length=VIDEO_FRAMES
    )

    # Update the save prefix with extension name
    i2v_prompt["14"]["inputs"]["filename_prefix"] = f"video/promo_{safe_name}"

    prompt_id = queue_prompt(i2v_prompt, client_id)
    if not prompt_id:
        ws.close()
        return False

    success = wait_for_completion(ws, prompt_id)
    if not success:
        ws.close()
        return False

    # Get the video from history
    history = get_history(prompt_id)
    if prompt_id not in history:
        print("  [ERROR] Could not find prompt in history")
        ws.close()
        return False

    # Look for video output in SaveVideo node (node 14)
    video_output = history[prompt_id]["outputs"].get("14", {})

    # SaveVideo outputs video files under 'images' key (with 'animated' boolean flag)
    video_files = (video_output.get("images") or
                   video_output.get("videos") or
                   video_output.get("gifs") or [])
    if not video_files:
        print(f"  [ERROR] No video output found. Available outputs: {list(history[prompt_id]['outputs'].keys())}")
        # Try to find video in any output node
        for nid, nout in history[prompt_id]["outputs"].items():
            print(f"    Node {nid}: {list(nout.keys())}")
        ws.close()
        return False

    video_file = video_files[0]
    video_filename = video_file["filename"]
    video_subfolder = video_file.get("subfolder", "")
    print(f"  Video generated: {video_filename}")

    # Download to output directory
    final_path = os.path.join(OUTPUT_DIR, f"{safe_name}_promo.mp4")
    download_file(video_filename, video_subfolder, "output", final_path)
    print(f"  Saved video to {final_path}")

    ws.close()
    print(f"\n  [DONE] Video saved to: {final_path}")
    return True


# ============================================
# CLI Entry Point
# ============================================
def main():
    parser = argparse.ArgumentParser(description="Generate promo videos for Chrome extensions")
    parser.add_argument("--extension", "-e", type=str, help="Extension name to generate video for")
    parser.add_argument("--all", action="store_true", help="Generate videos for all extensions")
    parser.add_argument("--list", action="store_true", help="List available extensions")
    parser.add_argument("--image-prompt", type=str, help="Custom image prompt (skips Ollama)")
    parser.add_argument("--motion-prompt", type=str, help="Custom motion prompt (skips Ollama)")
    parser.add_argument("--seed", type=int, help="Random seed for reproducibility")
    parser.add_argument("--test", action="store_true", help="Test mode: generate image only, skip video")
    args = parser.parse_args()

    if args.list:
        print("\nAvailable extensions:")
        for name, info in EXTENSIONS.items():
            print(f"  - {name}: {info['description']}")
        return

    if not args.extension and not args.all:
        parser.print_help()
        print("\n\nExample usage:")
        print('  python video_promo_generator.py --extension "Pay Decoder"')
        print('  python video_promo_generator.py --all')
        print('  python video_promo_generator.py --list')
        return

    # Check services are running
    print("Checking services...")
    try:
        with urllib.request.urlopen(f"http://{COMFYUI_SERVER}/api/system_stats", timeout=5) as r:
            print(f"  ComfyUI: OK (port {COMFYUI_SERVER.split(':')[1]})")
    except Exception:
        print(f"  [ERROR] ComfyUI not reachable at {COMFYUI_SERVER}")
        return

    try:
        with urllib.request.urlopen("http://localhost:11434/api/tags", timeout=5) as r:
            print(f"  Ollama: OK")
    except Exception:
        print(f"  [WARN] Ollama not reachable - will use fallback prompts")

    if args.all:
        results = {}
        for name in EXTENSIONS:
            success = generate_promo_video(name, seed=args.seed)
            results[name] = success
        print(f"\n{'='*60}")
        print("  Results:")
        for name, ok in results.items():
            status = "[OK]" if ok else "[FAIL]"
            print(f"    {status} {name}")
    else:
        generate_promo_video(
            args.extension,
            image_prompt=args.image_prompt,
            motion_prompt=args.motion_prompt,
            seed=args.seed
        )


if __name__ == "__main__":
    main()
