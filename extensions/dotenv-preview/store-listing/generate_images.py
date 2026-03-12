"""Generate Chrome Web Store promotional images for DotEnv Preview."""

from PIL import Image, ImageDraw, ImageFont
import os

base = os.path.join(os.path.dirname(__file__), 'screenshots')
os.makedirs(base, exist_ok=True)

def get_font(size):
    for path in ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf']:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue
    return ImageFont.load_default()

def get_bold_font(size):
    for path in ['C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf']:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue
    return get_font(size)

def get_mono_font(size):
    for path in ['C:/Windows/Fonts/consola.ttf', 'C:/Windows/Fonts/cour.ttf']:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue
    return get_font(size)


# ============================================
# Screenshot 1: Formatted env file on GitHub
# ============================================
img1 = Image.new('RGB', (1280, 800), '#0d1117')
draw1 = ImageDraw.Draw(img1)

# GitHub dark header
draw1.rectangle([0, 0, 1280, 48], fill='#161b22')
draw1.text((20, 12), 'GitHub', fill='#f0f6fc', font=get_bold_font(20))
draw1.text((100, 16), 'my-project / .env.example', fill='#8b949e', font=get_font(14))

# File path breadcrumb
draw1.rectangle([0, 48, 1280, 80], fill='#161b22')
draw1.text((20, 54), 'my-project', fill='#58a6ff', font=get_font(14))
draw1.text((110, 54), '/', fill='#8b949e', font=get_font(14))
draw1.text((125, 54), '.env.example', fill='#f0f6fc', font=get_bold_font(14))

# DotEnv Preview toolbar
draw1.rounded_rectangle([20, 92, 1260, 132], radius=8, fill='#1c2128', outline='#f57c00', width=2)
draw1.text((36, 100), 'DotEnv Preview', fill='#f57c00', font=get_bold_font(14))
draw1.rounded_rectangle([180, 98, 250, 124], radius=4, fill='#f57c00')
draw1.text((190, 102), '14 vars', fill='#ffffff', font=get_font(12))
# Toggle buttons
draw1.rounded_rectangle([1050, 98, 1130, 124], radius=4, fill='#f57c00')
draw1.text((1058, 102), 'Formatted', fill='#ffffff', font=get_font(12))
draw1.rounded_rectangle([1140, 98, 1190, 124], radius=4, outline='#8b949e', fill='#0d1117')
draw1.text((1152, 102), 'Raw', fill='#8b949e', font=get_font(12))
# Copy button
draw1.rounded_rectangle([1200, 98, 1250, 124], radius=4, outline='#8b949e', fill='#0d1117')
draw1.text((1210, 102), 'Copy', fill='#8b949e', font=get_font(12))

# Search bar
draw1.rounded_rectangle([20, 140, 400, 168], radius=4, fill='#1c2128', outline='#30363d')
draw1.text((32, 146), 'Filter variables...', fill='#484f58', font=get_font(13))

# Group: Database (DB_)
group_y = 180
draw1.text((20, group_y), 'Database (DB_)', fill='#f57c00', font=get_bold_font(14))
draw1.line([(160, group_y+10), (1260, group_y+10)], fill='#21262d', width=1)

# Variables
env_vars = [
    (1, 'DB_HOST', 'localhost', 'normal', 'string'),
    (2, 'DB_PORT', '5432', 'normal', 'number'),
    (3, 'DB_NAME', 'myapp_production', 'normal', 'string'),
    (4, 'DB_USER', 'admin', 'normal', 'string'),
    (5, 'DB_PASSWORD', 'changeme', 'placeholder', 'string'),
]

line_y = group_y + 28
for num, key, val, classification, vtype in env_vars:
    # Line number
    draw1.text((20, line_y), str(num), fill='#484f58', font=get_mono_font(13))
    # Key
    draw1.text((55, line_y), key, fill='#58a6ff', font=get_mono_font(13))
    draw1.text((55 + len(key)*8, line_y), '=', fill='#8b949e', font=get_mono_font(13))
    # Value with color based on type
    val_x = 55 + len(key)*8 + 12
    if classification == 'placeholder':
        draw1.rounded_rectangle([val_x-4, line_y-2, val_x + len(val)*8 + 4, line_y+18], radius=3, fill='#3d2e00', outline='#f57c00')
        draw1.text((val_x, line_y), val, fill='#f0c000', font=get_mono_font(13))
        draw1.text((val_x + len(val)*8 + 12, line_y), '💡 Placeholder', fill='#f0c000', font=get_font(11))
    elif vtype == 'number':
        draw1.text((val_x, line_y), val, fill='#f57c00', font=get_mono_font(13))
    else:
        draw1.text((val_x, line_y), val, fill='#7ee787', font=get_mono_font(13))
    line_y += 26

# Group: API
line_y += 10
draw1.text((20, line_y), 'API (API_)', fill='#f57c00', font=get_bold_font(14))
draw1.line([(110, line_y+10), (1260, line_y+10)], fill='#21262d', width=1)
line_y += 28

api_vars = [
    (7, 'API_KEY', 'sk_live_a1b2c3d4e5f6...', 'sensitive', 'string'),
    (8, 'API_SECRET', '••••••••••••••••••', 'sensitive', 'string'),
    (9, 'API_URL', 'https://api.example.com/v2', 'normal', 'url'),
]

for num, key, val, classification, vtype in api_vars:
    draw1.text((20, line_y), str(num), fill='#484f58', font=get_mono_font(13))
    draw1.text((55, line_y), key, fill='#58a6ff', font=get_mono_font(13))
    draw1.text((55 + len(key)*8, line_y), '=', fill='#8b949e', font=get_mono_font(13))
    val_x = 55 + len(key)*8 + 12
    if classification == 'sensitive':
        draw1.rounded_rectangle([val_x-4, line_y-2, val_x + len(val)*8 + 4, line_y+18], radius=3, fill='#3d1a1a', outline='#f85149')
        draw1.text((val_x, line_y), val, fill='#f85149', font=get_mono_font(13))
        draw1.text((val_x + len(val)*8 + 12, line_y), '⚠️ Sensitive', fill='#f85149', font=get_font(11))
    elif vtype == 'url':
        draw1.text((val_x, line_y), val, fill='#a5d6ff', font=get_mono_font(13))
    else:
        draw1.text((val_x, line_y), val, fill='#7ee787', font=get_mono_font(13))
    line_y += 26

# Group: App Settings
line_y += 10
draw1.text((20, line_y), 'App (APP_)', fill='#f57c00', font=get_bold_font(14))
draw1.line([(120, line_y+10), (1260, line_y+10)], fill='#21262d', width=1)
line_y += 28

app_vars = [
    (11, 'APP_ENV', 'production', 'normal', 'string'),
    (12, 'APP_DEBUG', 'false', 'normal', 'boolean'),
    (13, 'APP_PORT', '3000', 'normal', 'number'),
    (14, 'APP_NAME', 'My Awesome App', 'normal', 'string'),
]

for num, key, val, classification, vtype in app_vars:
    draw1.text((20, line_y), str(num), fill='#484f58', font=get_mono_font(13))
    draw1.text((55, line_y), key, fill='#58a6ff', font=get_mono_font(13))
    draw1.text((55 + len(key)*8, line_y), '=', fill='#8b949e', font=get_mono_font(13))
    val_x = 55 + len(key)*8 + 12
    if vtype == 'number':
        draw1.text((val_x, line_y), val, fill='#f57c00', font=get_mono_font(13))
    elif vtype == 'boolean':
        draw1.text((val_x, line_y), val, fill='#d2a8ff', font=get_mono_font(13))
    else:
        draw1.text((val_x, line_y), val, fill='#7ee787', font=get_mono_font(13))
    line_y += 26

img1.save(os.path.join(base, 'screenshot-1-formatted.png'))
print('Created screenshot-1-formatted.png')


# ============================================
# Screenshot 2: Popup with settings
# ============================================
img2 = Image.new('RGB', (1280, 800), '#0d1117')
draw2 = ImageDraw.Draw(img2)

# Background GitHub header
draw2.rectangle([0, 0, 1280, 48], fill='#161b22')
draw2.text((20, 12), 'GitHub', fill='#f0f6fc', font=get_bold_font(20))

# Popup
popup_x, popup_y = 440, 80
popup_w, popup_h = 340, 420
draw2.rounded_rectangle([popup_x+5, popup_y+5, popup_x+popup_w+5, popup_y+popup_h+5], radius=12, fill='#333333')
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+popup_h], radius=12, fill='#ffffff')

# Header
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+56], radius=12, fill='#f57c00')
draw2.rectangle([popup_x, popup_y+40, popup_x+popup_w, popup_y+56], fill='#f57c00')
draw2.text((popup_x+20, popup_y+14), 'DotEnv Preview', fill='#ffffff', font=get_bold_font(22))

# Toggle: Auto-format
sy = popup_y + 72
draw2.text((popup_x+20, sy), 'Auto-format env files', fill='#333333', font=get_font(14))
draw2.rounded_rectangle([popup_x+popup_w-70, sy-2, popup_x+popup_w-20, sy+22], radius=12, fill='#f57c00')
draw2.ellipse([popup_x+popup_w-46, sy, popup_x+popup_w-24, sy+20], fill='#ffffff')

# Toggle: Mask sensitive
sy += 42
draw2.text((popup_x+20, sy), 'Mask sensitive values', fill='#333333', font=get_font(14))
draw2.rounded_rectangle([popup_x+popup_w-70, sy-2, popup_x+popup_w-20, sy+22], radius=12, fill='#f57c00')
draw2.ellipse([popup_x+popup_w-46, sy, popup_x+popup_w-24, sy+20], fill='#ffffff')

# Toggle: Group by prefix
sy += 42
draw2.text((popup_x+20, sy), 'Group by prefix', fill='#333333', font=get_font(14))
draw2.rounded_rectangle([popup_x+popup_w-70, sy-2, popup_x+popup_w-20, sy+22], radius=12, fill='#f57c00')
draw2.ellipse([popup_x+popup_w-46, sy, popup_x+popup_w-24, sy+20], fill='#ffffff')

# Toggle: Line numbers
sy += 42
draw2.text((popup_x+20, sy), 'Show line numbers', fill='#333333', font=get_font(14))
draw2.rounded_rectangle([popup_x+popup_w-70, sy-2, popup_x+popup_w-20, sy+22], radius=12, fill='#f57c00')
draw2.ellipse([popup_x+popup_w-46, sy, popup_x+popup_w-24, sy+20], fill='#ffffff')

# Theme selector
sy += 52
draw2.text((popup_x+20, sy), 'Theme', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw2.text((popup_x+30, sy+10), 'Auto (match GitHub)', fill='#333333', font=get_font(14))

# Save button
sy += 56
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+44], radius=8, fill='#f57c00')
draw2.text((popup_x+110, sy+12), 'Save Settings', fill='#ffffff', font=get_bold_font(15))

img2.save(os.path.join(base, 'screenshot-2-popup.png'))
print('Created screenshot-2-popup.png')


# ============================================
# Screenshot 3: Feature highlights
# ============================================
img3 = Image.new('RGB', (1280, 800), '#ffffff')
draw3 = ImageDraw.Draw(img3)

draw3.text((100, 40), 'DotEnv Preview', fill='#e65100', font=get_bold_font(36))
draw3.text((100, 85), 'Beautiful formatting for .env files on GitHub', fill='#5f6368', font=get_font(20))

features = [
    ('Syntax Highlight', 'Color-coded keys,\nvalues, and comments', '#f57c00'),
    ('Smart Grouping', 'Auto-groups vars by\nprefix (DB_, API_...)', '#1565c0'),
    ('Security Alerts', 'Flags sensitive values\nand placeholders', '#c62828'),
    ('Quick Copy', 'Copy any value or the\nentire file instantly', '#2e7d32'),
]

box_w, box_h = 250, 180
start_x = 80
for i, (title, desc, color) in enumerate(features):
    x = start_x + i * (box_w + 30)
    y = 160
    draw3.rounded_rectangle([x, y, x+box_w, y+box_h], radius=12, fill='#fafafa', outline=color, width=2)
    draw3.rounded_rectangle([x, y, x+box_w, y+6], radius=3, fill=color)
    draw3.text((x+20, y+25), title, fill='#333333', font=get_bold_font(18))
    dy = y + 55
    for line in desc.split('\n'):
        draw3.text((x+20, dy), line, fill='#666666', font=get_font(14))
        dy += 20

draw3.text((100, 400), 'Works On', fill='#333333', font=get_bold_font(24))

sites = [
    ('GitHub', 'github.com/*/*/blob/*/.env*'),
    ('GitLab', 'gitlab.com/*/*/blob/*/.env*'),
    ('Bitbucket', 'bitbucket.org/*/*/src/*/.env*'),
    ('Raw URLs', 'raw.githubusercontent.com/*'),
]

for i, (name, pattern) in enumerate(sites):
    x = 100 + i * 290
    y = 460
    draw3.rounded_rectangle([x, y, x+260, y+70], radius=8, fill='#fff3e0', outline='#f57c00', width=1)
    draw3.text((x+15, y+12), name, fill='#e65100', font=get_bold_font(16))
    draw3.text((x+15, y+38), pattern, fill='#888888', font=get_font(11))

# Supported file types
draw3.text((100, 570), 'Supports: .env  .env.example  .env.local  .env.production  .env.development', fill='#666666', font=get_font(14))

img3.save(os.path.join(base, 'screenshot-3-features.png'))
print('Created screenshot-3-features.png')


# ============================================
# Small promo tile (440x280)
# ============================================
promo = Image.new('RGB', (440, 280), '#e65100')
draw_p = ImageDraw.Draw(promo)

for i in range(280):
    r = int(230 + (245-230) * i/280)
    g = int(81 + (124-81) * i/280)
    b = int(0 + (0) * i/280)
    draw_p.line([(0, i), (440, i)], fill=(r, g, b))

draw_p.text((30, 20), 'DotEnv', fill='#ffffff', font=get_bold_font(36))
draw_p.text((30, 63), 'Preview', fill='#ffffff', font=get_bold_font(36))

# Mini code preview
draw_p.rounded_rectangle([30, 118, 280, 200], radius=8, fill='#1e1e1e')
draw_p.text((42, 125), 'DB_HOST', fill='#58a6ff', font=get_mono_font(12))
draw_p.text((110, 125), '=', fill='#8b949e', font=get_mono_font(12))
draw_p.text((122, 125), 'localhost', fill='#7ee787', font=get_mono_font(12))
draw_p.text((42, 145), 'API_KEY', fill='#58a6ff', font=get_mono_font(12))
draw_p.text((110, 145), '=', fill='#8b949e', font=get_mono_font(12))
draw_p.text((122, 145), '••••••••', fill='#f85149', font=get_mono_font(12))
draw_p.text((42, 165), 'APP_PORT', fill='#58a6ff', font=get_mono_font(12))
draw_p.text((118, 165), '=', fill='#8b949e', font=get_mono_font(12))
draw_p.text((130, 165), '3000', fill='#f57c00', font=get_mono_font(12))

draw_p.text((295, 130), 'Format .env', fill='#ffe0b2', font=get_font(15))
draw_p.text((295, 150), 'files on GitHub', fill='#ffe0b2', font=get_font(15))

draw_p.text((30, 218), 'Free Chrome Extension', fill='#ffcc80', font=get_font(15))
draw_p.text((30, 241), 'for Developers', fill='#ffcc80', font=get_font(15))

promo.save(os.path.join(base, 'promo-small-440x280.png'))
print('Created promo-small-440x280.png')


# ============================================
# Marquee promo tile (1400x560)
# ============================================
marquee = Image.new('RGB', (1400, 560), '#bf360c')
draw_m = ImageDraw.Draw(marquee)

for i in range(560):
    r = int(191 + (230-191) * i/560)
    g = int(54 + (81-54) * i/560)
    b = int(12 + (0-12) * i/560)
    draw_m.line([(0, i), (1400, i)], fill=(r, g, b))

draw_m.text((80, 80), 'DotEnv Preview', fill='#ffffff', font=get_bold_font(48))
draw_m.text((80, 145), 'Beautiful formatting for .env files on GitHub', fill='#ffcc80', font=get_font(24))

bullets_y = 210
for bullet in ['Syntax highlighting with color-coded values', 'Smart grouping by prefix (DB_, API_, AWS_...)', 'Sensitive value detection and masking', 'Copy individual values or entire file', 'Works on GitHub, GitLab, and Bitbucket']:
    draw_m.ellipse([100, bullets_y+6, 108, bullets_y+14], fill='#f57c00')
    draw_m.text((120, bullets_y), bullet, fill='#e0e0e0', font=get_font(18))
    bullets_y += 32

# Code preview on right
code_x, code_y = 900, 130
draw_m.rounded_rectangle([code_x, code_y, code_x+420, code_y+310], radius=12, fill='#0d1117', outline='#f57c00', width=2)
draw_m.text((code_x+15, code_y+10), 'DotEnv Preview', fill='#f57c00', font=get_bold_font(13))
draw_m.line([(code_x, code_y+32), (code_x+420, code_y+32)], fill='#21262d', width=1)

# Env vars in preview
preview_vars = [
    ('# Database', None, None, 'comment'),
    ('DB_HOST', 'localhost', '#7ee787', 'normal'),
    ('DB_PORT', '5432', '#f57c00', 'normal'),
    ('', None, None, 'blank'),
    ('# API Keys', None, None, 'comment'),
    ('API_KEY', 'sk_live_a1b2...', '#f85149', 'sensitive'),
    ('API_SECRET', '••••••••••', '#f85149', 'sensitive'),
    ('', None, None, 'blank'),
    ('# App Config', None, None, 'comment'),
    ('APP_ENV', 'production', '#7ee787', 'normal'),
    ('APP_DEBUG', 'false', '#d2a8ff', 'normal'),
]

py = code_y + 44
for key, val, color, kind in preview_vars:
    if kind == 'comment':
        draw_m.text((code_x+15, py), key, fill='#484f58', font=get_mono_font(12))
    elif kind == 'blank':
        pass
    elif kind == 'sensitive':
        draw_m.text((code_x+15, py), key, fill='#58a6ff', font=get_mono_font(12))
        draw_m.text((code_x+15+len(key)*7.5, py), '=', fill='#8b949e', font=get_mono_font(12))
        draw_m.text((code_x+15+len(key)*7.5+12, py), val, fill=color, font=get_mono_font(12))
    else:
        draw_m.text((code_x+15, py), key, fill='#58a6ff', font=get_mono_font(12))
        draw_m.text((code_x+15+len(key)*7.5, py), '=', fill='#8b949e', font=get_mono_font(12))
        draw_m.text((code_x+15+len(key)*7.5+12, py), val, fill=color, font=get_mono_font(12))
    py += 22

# CTA button
draw_m.rounded_rectangle([80, 410, 340, 475], radius=8, fill='#f57c00')
draw_m.text((105, 428), 'Add to Chrome - Free', fill='#ffffff', font=get_bold_font(20))

marquee.save(os.path.join(base, 'promo-marquee-1400x560.png'))
print('Created promo-marquee-1400x560.png')

print('\nAll promotional images created!')
