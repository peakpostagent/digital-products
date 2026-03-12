"""Generate Chrome Web Store promotional images for Read Cost."""

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
# Screenshot 1: Badge on a blog article
# ============================================
img1 = Image.new('RGB', (1280, 800), '#ffffff')
draw1 = ImageDraw.Draw(img1)

# Browser-like top bar
draw1.rectangle([0, 0, 1280, 40], fill='#f5f5f5')
draw1.rounded_rectangle([200, 8, 800, 32], radius=12, fill='#ffffff', outline='#e0e0e0')
draw1.text((220, 11), 'blog.example.com/scaling-microservices', fill='#666666', font=get_font(13))

# Article content
draw1.text((120, 70), 'Scaling Microservices:', fill='#222222', font=get_bold_font(32))
draw1.text((120, 112), 'Lessons from Production', fill='#222222', font=get_bold_font(32))
draw1.text((120, 160), 'By Sarah Chen · March 8, 2026 · 14 min read', fill='#999999', font=get_font(14))

# Article body text
body_y = 210
paragraphs = [
    'After running microservices in production for three years at scale,',
    "we've learned some hard lessons about what works and what doesn't.",
    'This is a deep dive into the patterns that saved us and the anti-',
    'patterns that nearly brought our systems down.',
    '',
    'The Promise vs. Reality',
    '',
    'When we started breaking our monolith into services, everything',
    'seemed straightforward. Each team would own their service, deploy',
    'independently, and scale as needed. The reality was far more',
    'nuanced. Service boundaries that seemed obvious turned out to be',
    'wrong, and inter-service communication became our biggest challenge.',
    '',
    'Pattern 1: Start with a Service Mesh',
    '',
    'The single best decision we made was adopting a service mesh early.',
    'It gave us observability, traffic management, and security without',
    'changing application code. We chose Istio, though Linkerd would',
    'have been equally valid for our use case.',
]
for line in paragraphs:
    if line:
        weight = get_bold_font(18) if line.startswith('Pattern') or line.startswith('The Promise') else get_font(15)
        color = '#222222' if line.startswith('Pattern') or line.startswith('The Promise') else '#444444'
        draw1.text((120, body_y), line, fill=color, font=weight)
    body_y += 24

# Floating badge (the key feature!)
badge_x, badge_y = 1050, 100
draw1.rounded_rectangle([badge_x, badge_y, badge_x+195, badge_y+65], radius=12, fill='#00897b', outline='#00695c', width=2)
draw1.text((badge_x+14, badge_y+8), '$17.50', fill='#ffffff', font=get_bold_font(24))
draw1.text((badge_x+14, badge_y+38), 'of your time', fill='#b2dfdb', font=get_font(13))
draw1.text((badge_x+140, badge_y+14), '14 min', fill='#b2dfdb', font=get_font(12))
draw1.text((badge_x+140, badge_y+32), '3,400 w', fill='#b2dfdb', font=get_font(11))

img1.save(os.path.join(base, 'screenshot-1-badge.png'))
print('Created screenshot-1-badge.png')


# ============================================
# Screenshot 2: Expanded detail view
# ============================================
img2 = Image.new('RGB', (1280, 800), '#ffffff')
draw2 = ImageDraw.Draw(img2)

# Browser bar
draw2.rectangle([0, 0, 1280, 40], fill='#f5f5f5')
draw2.rounded_rectangle([200, 8, 800, 32], radius=12, fill='#ffffff', outline='#e0e0e0')
draw2.text((220, 11), 'medium.com/react-performance-tips', fill='#666666', font=get_font(13))

# Article
draw2.text((120, 70), '10 React Performance Tips', fill='#222222', font=get_bold_font(28))
draw2.text((120, 110), 'That Actually Work in 2026', fill='#222222', font=get_bold_font(28))
draw2.text((120, 155), 'By Alex Rivera · 8 min read', fill='#999999', font=get_font(14))

# Some body text
body_y = 195
for line in [
    'React applications can become painfully slow if you are not',
    'careful about re-renders. Here are ten actionable tips that',
    'have made real differences in production applications.',
    '',
    '1. Use React.memo wisely — but not everywhere',
    '',
    'The most common performance advice is to wrap components in',
    'React.memo(). But memoization has a cost too. Only use it for',
]:
    if line:
        weight = get_bold_font(16) if line.startswith('1.') else get_font(14)
        color = '#222222' if line.startswith('1.') else '#444444'
        draw2.text((120, body_y), line, fill=color, font=weight)
    body_y += 22

# Expanded detail panel
panel_x, panel_y = 820, 100
panel_w, panel_h = 400, 320
draw2.rounded_rectangle([panel_x+4, panel_y+4, panel_x+panel_w+4, panel_y+panel_h+4], radius=12, fill='#cccccc')
draw2.rounded_rectangle([panel_x, panel_y, panel_x+panel_w, panel_y+panel_h], radius=12, fill='#ffffff', outline='#00897b', width=2)

# Panel header
draw2.rounded_rectangle([panel_x, panel_y, panel_x+panel_w, panel_y+48], radius=12, fill='#00897b')
draw2.rectangle([panel_x, panel_y+36, panel_x+panel_w, panel_y+48], fill='#00897b')
draw2.text((panel_x+16, panel_y+14), 'Read Cost', fill='#ffffff', font=get_bold_font(18))

py = panel_y + 62
# Cost
draw2.text((panel_x+20, py), 'Cost of This Article', fill='#888888', font=get_font(12))
py += 20
draw2.text((panel_x+20, py), '$10.00', fill='#00897b', font=get_bold_font(36))
py += 48

# Divider
draw2.line([(panel_x+20, py), (panel_x+panel_w-20, py)], fill='#e0e0e0', width=1)
py += 15

# Details grid
details = [
    ('Reading Time', '8 min'),
    ('Word Count', '1,904 words'),
    ('Reading Level', 'Moderate'),
    ('Your Rate', '$75.00/hr'),
]
for label, value in details:
    draw2.text((panel_x+20, py), label, fill='#888888', font=get_font(12))
    draw2.text((panel_x+panel_w-120, py), value, fill='#333333', font=get_bold_font(13))
    py += 28

img2.save(os.path.join(base, 'screenshot-2-detail.png'))
print('Created screenshot-2-detail.png')


# ============================================
# Screenshot 3: Popup with settings
# ============================================
img3 = Image.new('RGB', (1280, 800), '#f5f5f5')
draw3 = ImageDraw.Draw(img3)

# Background header
draw3.rectangle([0, 0, 1280, 40], fill='#f5f5f5')

# Popup
popup_x, popup_y = 420, 60
popup_w, popup_h = 380, 520
draw3.rounded_rectangle([popup_x+5, popup_y+5, popup_x+popup_w+5, popup_y+popup_h+5], radius=12, fill='#999999')
draw3.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+popup_h], radius=12, fill='#ffffff')

# Header
draw3.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+56], radius=12, fill='#00897b')
draw3.rectangle([popup_x, popup_y+40, popup_x+popup_w, popup_y+56], fill='#00897b')
draw3.text((popup_x+20, popup_y+16), 'Read Cost', fill='#ffffff', font=get_bold_font(20))

# Toggle
sy = popup_y + 72
draw3.text((popup_x+20, sy), 'Show Cost Badge', fill='#333333', font=get_bold_font(14))
draw3.rounded_rectangle([popup_x+popup_w-70, sy-2, popup_x+popup_w-20, sy+22], radius=12, fill='#00897b')
draw3.ellipse([popup_x+popup_w-46, sy, popup_x+popup_w-24, sy+20], fill='#ffffff')

# Hourly rate
sy += 46
draw3.text((popup_x+20, sy), 'Your Hourly Rate', fill='#5f6368', font=get_font(13))
sy += 22
draw3.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw3.text((popup_x+30, sy+10), '$75.00', fill='#3c4043', font=get_font(16))

# Reading speed
sy += 52
draw3.text((popup_x+20, sy), 'Reading Speed', fill='#5f6368', font=get_font(13))
sy += 22
draw3.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw3.text((popup_x+30, sy+10), 'Average (238 WPM)', fill='#3c4043', font=get_font(16))

# Currency
sy += 52
draw3.text((popup_x+20, sy), 'Currency', fill='#5f6368', font=get_font(13))
sy += 22
draw3.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw3.text((popup_x+30, sy+10), 'USD ($)', fill='#3c4043', font=get_font(16))

# Weekly stats
sy += 56
draw3.text((popup_x+20, sy), 'This Week', fill='#333333', font=get_bold_font(14))
sy += 24
stats_items = [
    ('Articles Read', '23'),
    ('Time Spent', '4h 12m'),
    ('Total Cost', '$315.00'),
]
for label, val in stats_items:
    draw3.text((popup_x+30, sy), label, fill='#888888', font=get_font(12))
    draw3.text((popup_x+popup_w-80, sy), val, fill='#00897b', font=get_bold_font(13))
    sy += 22

# Save button
sy += 14
draw3.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+44], radius=8, fill='#00897b')
draw3.text((popup_x+130, sy+12), 'Save Settings', fill='#ffffff', font=get_bold_font(15))

img3.save(os.path.join(base, 'screenshot-3-popup.png'))
print('Created screenshot-3-popup.png')


# ============================================
# Screenshot 4: Feature highlights
# ============================================
img4 = Image.new('RGB', (1280, 800), '#ffffff')
draw4 = ImageDraw.Draw(img4)

draw4.text((100, 40), 'Read Cost', fill='#00897b', font=get_bold_font(36))
draw4.text((100, 85), 'See what every article costs you', fill='#5f6368', font=get_font(20))

features = [
    ('Dollar Cost', 'See the real cost of\nreading any article', '#00897b'),
    ('Reading Time', 'Word count & time\nestimate at a glance', '#2196f3'),
    ('Any Website', 'Works on blogs, docs,\nnews sites & more', '#ff9800'),
    ('100% Private', 'All data stays local\nin your browser', '#9c27b0'),
]

box_w, box_h = 250, 180
start_x = 80
for i, (title, desc, color) in enumerate(features):
    x = start_x + i * (box_w + 30)
    y = 160
    draw4.rounded_rectangle([x, y, x+box_w, y+box_h], radius=12, fill='#f8f9fa', outline=color, width=2)
    draw4.rounded_rectangle([x, y, x+box_w, y+6], radius=3, fill=color)
    draw4.text((x+20, y+25), title, fill='#333333', font=get_bold_font(18))
    dy = y + 55
    for line in desc.split('\n'):
        draw4.text((x+20, dy), line, fill='#666666', font=get_font(14))
        dy += 20

# Example conversion
draw4.text((100, 400), 'Example', fill='#333333', font=get_bold_font(24))
draw4.rounded_rectangle([100, 450, 600, 600], radius=12, fill='#f0faf9', outline='#00897b', width=2)
draw4.text((130, 470), 'Article: "Scaling Microservices"', fill='#444444', font=get_font(16))
draw4.text((130, 500), '3,400 words · 14 min read', fill='#888888', font=get_font(14))
draw4.text((130, 535), 'At $75/hr =', fill='#888888', font=get_font(18))
draw4.text((270, 530), '$17.50', fill='#00897b', font=get_bold_font(28))
draw4.text((400, 538), 'of your time', fill='#888888', font=get_font(16))

img4.save(os.path.join(base, 'screenshot-4-features.png'))
print('Created screenshot-4-features.png')


# ============================================
# Small promo tile (440x280)
# ============================================
promo = Image.new('RGB', (440, 280), '#00897b')
draw_p = ImageDraw.Draw(promo)

for i in range(280):
    r = int(0 + (0-0) * i/280)
    g = int(137 + (105-137) * i/280)
    b = int(123 + (92-123) * i/280)
    draw_p.line([(0, i), (440, i)], fill=(r, g, b))

draw_p.text((30, 25), 'Read', fill='#ffffff', font=get_bold_font(36))
draw_p.text((30, 68), 'Cost', fill='#ffffff', font=get_bold_font(36))

draw_p.rounded_rectangle([30, 125, 260, 185], radius=8, fill='#ffffff')
draw_p.text((42, 130), '14 min article', fill='#888888', font=get_font(14))
draw_p.text((42, 150), '= $17.50', fill='#00897b', font=get_bold_font(22))

draw_p.text((270, 135), 'See the real', fill='#b2dfdb', font=get_font(16))
draw_p.text((270, 158), 'cost of reading', fill='#b2dfdb', font=get_font(16))

draw_p.text((30, 210), 'Free Chrome Extension', fill='#b2dfdb', font=get_font(15))
draw_p.text((30, 233), 'for Knowledge Workers', fill='#b2dfdb', font=get_font(15))

promo.save(os.path.join(base, 'promo-small-440x280.png'))
print('Created promo-small-440x280.png')


# ============================================
# Marquee promo tile (1400x560)
# ============================================
marquee = Image.new('RGB', (1400, 560), '#00695c')
draw_m = ImageDraw.Draw(marquee)

for i in range(560):
    r = int(0 + (0-0) * i/560)
    g = int(105 + (137-105) * i/560)
    b = int(92 + (123-92) * i/560)
    draw_m.line([(0, i), (1400, i)], fill=(r, g, b))

draw_m.text((80, 80), 'Read Cost', fill='#ffffff', font=get_bold_font(48))
draw_m.text((80, 145), 'See what every article costs you', fill='#b2dfdb', font=get_font(24))

bullets_y = 210
for bullet in ['Shows dollar cost based on your hourly rate', 'Reading time and word count at a glance', 'Works on any website with article content', '7 currencies and adjustable reading speed', '100% private - all data stays local']:
    draw_m.ellipse([100, bullets_y+6, 108, bullets_y+14], fill='#4db6ac')
    draw_m.text((120, bullets_y), bullet, fill='#e0e0e0', font=get_font(18))
    bullets_y += 32

# Conversion example on right
badge_cx, badge_cy = 1050, 230
draw_m.rounded_rectangle([badge_cx-140, badge_cy-110, badge_cx+140, badge_cy+110], radius=20, fill='#ffffff')
draw_m.text((badge_cx-110, badge_cy-90), '14 min read · 3,400 words', fill='#888888', font=get_font(14))
draw_m.line([(badge_cx-110, badge_cy-65), (badge_cx+110, badge_cy-65)], fill='#e0e0e0', width=1)
draw_m.text((badge_cx-80, badge_cy-50), '$17.50', fill='#00897b', font=get_bold_font(48))
draw_m.text((badge_cx-110, badge_cy+15), 'of your time', fill='#666666', font=get_font(16))
draw_m.text((badge_cx-110, badge_cy+40), 'at $75/hr', fill='#888888', font=get_font(14))
draw_m.text((badge_cx-110, badge_cy+70), 'Read Cost', fill='#4db6ac', font=get_bold_font(13))

draw_m.rounded_rectangle([80, 410, 340, 475], radius=8, fill='#4db6ac')
draw_m.text((105, 428), 'Add to Chrome - Free', fill='#ffffff', font=get_bold_font(20))

marquee.save(os.path.join(base, 'promo-marquee-1400x560.png'))
print('Created promo-marquee-1400x560.png')

print('\nAll Read Cost promotional images created!')
