"""Generate Chrome Web Store promotional images for Tab Brake."""

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


# ============================================
# Screenshot 1: Blocked page
# ============================================
img1 = Image.new('RGB', (1280, 800), '#fafafa')
draw1 = ImageDraw.Draw(img1)

# Browser tab bar
draw1.rectangle([0, 0, 1280, 36], fill='#dee1e6')
tab_names = ['Gmail', 'GitHub', 'Docs', 'Slack', 'YouTube', 'Reddit', 'Stack O...', 'Figma']
for i, name in enumerate(tab_names):
    tx = 10 + i * 155
    active = (i == len(tab_names) - 1)
    bg = '#ffffff' if active else '#e8eaed'
    draw1.rounded_rectangle([tx, 4, tx+148, 36], radius=8, fill=bg)
    draw1.text((tx+12, 12), name, fill='#333333' if active else '#888888', font=get_font(12))
    # Close X
    draw1.text((tx+128, 10), 'x', fill='#aaaaaa', font=get_font(12))

# Address bar
draw1.rectangle([0, 36, 1280, 68], fill='#ffffff')
draw1.rounded_rectangle([200, 42, 800, 62], radius=10, fill='#f1f3f4')
draw1.text((220, 45), 'chrome-extension://tab-brake/blocked.html', fill='#666666', font=get_font(12))

# Blocked page content
center_x = 640

# Stop hand icon (circle)
draw1.ellipse([center_x-50, 130, center_x+50, 230], fill='#ffebee', outline='#e53935', width=3)
draw1.text((center_x-22, 155), '✋', fill='#e53935', font=get_bold_font(40))

draw1.text((center_x-160, 260), 'Tab Limit Reached', fill='#e53935', font=get_bold_font(32))
draw1.text((center_x-200, 310), 'You have 8 tabs open (your limit is 8).', fill='#666666', font=get_font(18))
draw1.text((center_x-180, 340), 'Close a tab below or override this time.', fill='#666666', font=get_font(18))

# Open tabs list
list_y = 400
draw1.text((center_x-250, list_y-30), 'Your Open Tabs:', fill='#333333', font=get_bold_font(16))

open_tabs = [
    ('Gmail - Inbox (3)', 'mail.google.com'),
    ('peakpostagent/digital-products', 'github.com'),
    ('Project Roadmap - Google Docs', 'docs.google.com'),
    ('Slack | general', 'app.slack.com'),
]
for i, (title, url) in enumerate(open_tabs):
    ty = list_y + i * 44
    draw1.rounded_rectangle([center_x-250, ty, center_x+250, ty+38], radius=6, fill='#ffffff', outline='#e0e0e0', width=1)
    draw1.text((center_x-235, ty+4), title, fill='#333333', font=get_font(13))
    draw1.text((center_x-235, ty+20), url, fill='#aaaaaa', font=get_font(11))
    # Close button
    draw1.rounded_rectangle([center_x+185, ty+7, center_x+240, ty+31], radius=4, fill='#ffebee')
    draw1.text((center_x+196, ty+10), 'Close', fill='#e53935', font=get_font(12))

# Buttons at bottom
btn_y = list_y + 4 * 44 + 30
draw1.rounded_rectangle([center_x-250, btn_y, center_x-20, btn_y+48], radius=8, fill='#e53935')
draw1.text((center_x-190, btn_y+14), 'Go Back', fill='#ffffff', font=get_bold_font(16))

draw1.rounded_rectangle([center_x+20, btn_y, center_x+250, btn_y+48], radius=8, fill='#ffffff', outline='#e53935', width=2)
draw1.text((center_x+55, btn_y+14), 'Override Once', fill='#e53935', font=get_bold_font(16))

img1.save(os.path.join(base, 'screenshot-1-blocked.png'))
print('Created screenshot-1-blocked.png')


# ============================================
# Screenshot 2: Popup with stats
# ============================================
img2 = Image.new('RGB', (1280, 800), '#f5f5f5')
draw2 = ImageDraw.Draw(img2)

draw2.rectangle([0, 0, 1280, 40], fill='#f5f5f5')

# Popup
popup_x, popup_y = 420, 60
popup_w, popup_h = 380, 560
draw2.rounded_rectangle([popup_x+5, popup_y+5, popup_x+popup_w+5, popup_y+popup_h+5], radius=12, fill='#999999')
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+popup_h], radius=12, fill='#ffffff')

# Header
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+56], radius=12, fill='#e53935')
draw2.rectangle([popup_x, popup_y+40, popup_x+popup_w, popup_y+56], fill='#e53935')
draw2.text((popup_x+20, popup_y+16), 'Tab Brake', fill='#ffffff', font=get_bold_font(20))

# Current count
sy = popup_y + 72
draw2.text((popup_x+20, sy), 'Current Tabs', fill='#888888', font=get_font(12))
sy += 18
draw2.text((popup_x+20, sy), '6', fill='#ff9800', font=get_bold_font(48))
draw2.text((popup_x+80, sy+20), '/ 8 limit', fill='#888888', font=get_font(16))

# Progress bar
sy += 60
bar_fill = int((6/8) * (popup_w-40))
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+12], radius=6, fill='#f5f5f5')
draw2.rounded_rectangle([popup_x+20, sy, popup_x+20+bar_fill, sy+12], radius=6, fill='#ff9800')

# Enable toggle
sy += 30
draw2.text((popup_x+20, sy), 'Limiting Enabled', fill='#333333', font=get_bold_font(14))
draw2.rounded_rectangle([popup_x+popup_w-70, sy-2, popup_x+popup_w-20, sy+22], radius=12, fill='#e53935')
draw2.ellipse([popup_x+popup_w-46, sy, popup_x+popup_w-24, sy+20], fill='#ffffff')

# Tab limit setting
sy += 40
draw2.text((popup_x+20, sy), 'Tab Limit', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw2.text((popup_x+30, sy+10), '8', fill='#3c4043', font=get_font(16))

# 7-day chart
sy += 56
draw2.text((popup_x+20, sy), 'Last 7 Days', fill='#333333', font=get_bold_font(14))
sy += 28

days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
avg_tabs = [7, 6, 8, 5, 9, 3, 4]
max_h = 80
bar_w = 36
for i, (day, count) in enumerate(zip(days, avg_tabs)):
    bx = popup_x + 25 + i * 48
    h = int((count / 10) * max_h)
    bar_top = sy + (max_h - h)
    color = '#e53935' if count >= 8 else '#ff9800' if count >= 6 else '#4caf50'
    if h > 0:
        draw2.rounded_rectangle([bx, bar_top, bx+bar_w, sy+max_h], radius=4, fill=color)
        draw2.text((bx+8, bar_top-16), str(count), fill=color, font=get_font(11))
    draw2.text((bx+6, sy+max_h+5), day, fill='#888888', font=get_font(11))

# Stats
sy += max_h + 30
draw2.line([(popup_x+20, sy), (popup_x+popup_w-20, sy)], fill='#e0e0e0', width=1)
sy += 12
stats = [
    ('Times Blocked', '12'),
    ('Times Overridden', '3'),
    ('Avg Tab Count', '6.0'),
]
for label, val in stats:
    draw2.text((popup_x+30, sy), label, fill='#888888', font=get_font(12))
    draw2.text((popup_x+popup_w-70, sy), val, fill='#e53935', font=get_bold_font(13))
    sy += 22

img2.save(os.path.join(base, 'screenshot-2-popup.png'))
print('Created screenshot-2-popup.png')


# ============================================
# Screenshot 3: Feature highlights
# ============================================
img3 = Image.new('RGB', (1280, 800), '#ffffff')
draw3 = ImageDraw.Draw(img3)

draw3.text((100, 40), 'Tab Brake', fill='#e53935', font=get_bold_font(36))
draw3.text((100, 85), 'Tame your tabs. Reclaim your focus.', fill='#5f6368', font=get_font(20))

features = [
    ('Set Your Limit', 'Choose any limit\nfrom 1 to 50 tabs', '#e53935'),
    ('Live Badge', 'See your tab count\ncolor-coded on icon', '#ff9800'),
    ('Gentle Blocking', 'Friendly page, not\na scary error', '#4caf50'),
    ('Usage Stats', '7-day chart tracks\nyour tab habits', '#2196f3'),
]

box_w, box_h = 250, 180
start_x = 80
for i, (title, desc, color) in enumerate(features):
    x = start_x + i * (box_w + 30)
    y = 160
    draw3.rounded_rectangle([x, y, x+box_w, y+box_h], radius=12, fill='#f8f9fa', outline=color, width=2)
    draw3.rounded_rectangle([x, y, x+box_w, y+6], radius=3, fill=color)
    draw3.text((x+20, y+25), title, fill='#333333', font=get_bold_font(18))
    dy = y + 55
    for line in desc.split('\n'):
        draw3.text((x+20, dy), line, fill='#666666', font=get_font(14))
        dy += 20

draw3.text((100, 400), 'How It Works', fill='#333333', font=get_bold_font(24))

steps = [
    ('1', 'Set your limit', 'Pick a tab limit that\nworks for you (default 8)'),
    ('2', 'Browse normally', 'Badge shows live tab\ncount on the icon'),
    ('3', 'Stay focused', 'Hit the limit? Close a\ntab or override once'),
]

for i, (num, title, desc) in enumerate(steps):
    x = 100 + i * 380
    y = 460
    draw3.ellipse([x, y, x+50, y+50], fill='#e53935')
    draw3.text((x+17, y+10), num, fill='#ffffff', font=get_bold_font(22))
    draw3.text((x+65, y+5), title, fill='#333333', font=get_bold_font(16))
    dy = y + 30
    for line in desc.split('\n'):
        draw3.text((x+65, dy), line, fill='#666666', font=get_font(14))
        dy += 18

img3.save(os.path.join(base, 'screenshot-3-features.png'))
print('Created screenshot-3-features.png')


# ============================================
# Small promo tile (440x280)
# ============================================
promo = Image.new('RGB', (440, 280), '#e53935')
draw_p = ImageDraw.Draw(promo)

for i in range(280):
    r = int(229 + (183-229) * i/280)
    g = int(57 + (28-57) * i/280)
    b = int(53 + (28-53) * i/280)
    draw_p.line([(0, i), (440, i)], fill=(r, g, b))

draw_p.text((30, 25), 'Tab', fill='#ffffff', font=get_bold_font(36))
draw_p.text((30, 68), 'Brake', fill='#ffffff', font=get_bold_font(36))

draw_p.rounded_rectangle([30, 125, 210, 185], radius=8, fill='#ffffff')
draw_p.text((42, 130), 'Tabs open:', fill='#888888', font=get_font(14))
draw_p.text((42, 150), '6 / 8', fill='#e53935', font=get_bold_font(22))

draw_p.text((225, 135), 'Stay focused.', fill='#ffcdd2', font=get_font(16))
draw_p.text((225, 158), 'Tame your tabs.', fill='#ffcdd2', font=get_font(16))

draw_p.text((30, 210), 'Free Chrome Extension', fill='#ffcdd2', font=get_font(15))
draw_p.text((30, 233), 'for Digital Minimalists', fill='#ffcdd2', font=get_font(15))

promo.save(os.path.join(base, 'promo-small-440x280.png'))
print('Created promo-small-440x280.png')


# ============================================
# Marquee promo tile (1400x560)
# ============================================
marquee = Image.new('RGB', (1400, 560), '#b71c1c')
draw_m = ImageDraw.Draw(marquee)

for i in range(560):
    r = int(183 + (229-183) * i/560)
    g = int(28 + (57-28) * i/560)
    b = int(28 + (53-28) * i/560)
    draw_m.line([(0, i), (1400, i)], fill=(r, g, b))

draw_m.text((80, 80), 'Tab Brake', fill='#ffffff', font=get_bold_font(48))
draw_m.text((80, 145), 'Tame your tabs. Reclaim your focus.', fill='#ffcdd2', font=get_font(24))

bullets_y = 210
for bullet in ['Set a personal tab limit (1-50 tabs)', 'Live color-coded badge on extension icon', 'Friendly blocking page with override option', '7-day usage chart tracks your tab habits', '100% local - no accounts, no tracking']:
    draw_m.ellipse([100, bullets_y+6, 108, bullets_y+14], fill='#ef5350')
    draw_m.text((120, bullets_y), bullet, fill='#e0e0e0', font=get_font(18))
    bullets_y += 32

# Tab count example on right
badge_cx, badge_cy = 1050, 230
draw_m.rounded_rectangle([badge_cx-140, badge_cy-110, badge_cx+140, badge_cy+110], radius=20, fill='#ffffff')
draw_m.text((badge_cx-110, badge_cy-90), 'Current Tabs', fill='#888888', font=get_font(16))
draw_m.line([(badge_cx-110, badge_cy-60), (badge_cx+110, badge_cy-60)], fill='#e0e0e0', width=1)
draw_m.text((badge_cx-50, badge_cy-48), '6', fill='#ff9800', font=get_bold_font(64))
draw_m.text((badge_cx+30, badge_cy-20), '/ 8', fill='#888888', font=get_font(24))
draw_m.text((badge_cx-80, badge_cy+30), '75% of limit', fill='#888888', font=get_font(16))

# Mini bar chart
chart_x = badge_cx - 100
chart_y_base = badge_cy + 80
mini_bars = [7, 6, 8, 5, 9, 3, 4]
for i, v in enumerate(mini_bars):
    bx = chart_x + i * 30
    h = int(v * 4)
    color = '#e53935' if v >= 8 else '#ff9800' if v >= 6 else '#4caf50'
    draw_m.rounded_rectangle([bx, chart_y_base-h, bx+22, chart_y_base], radius=3, fill=color)

draw_m.rounded_rectangle([80, 410, 340, 475], radius=8, fill='#ef5350')
draw_m.text((105, 428), 'Add to Chrome - Free', fill='#ffffff', font=get_bold_font(20))

marquee.save(os.path.join(base, 'promo-marquee-1400x560.png'))
print('Created promo-marquee-1400x560.png')

print('\nAll Tab Brake promotional images created!')
