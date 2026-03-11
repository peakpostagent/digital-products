"""Generate Chrome Web Store promotional images for Pay Decoder."""

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
# Screenshot 1: Inline conversion on LinkedIn
# ============================================
img1 = Image.new('RGB', (1280, 800), '#f3f2ef')
draw1 = ImageDraw.Draw(img1)

# LinkedIn header
draw1.rectangle([0, 0, 1280, 52], fill='#ffffff')
draw1.text((20, 14), 'LinkedIn', fill='#0a66c2', font=get_bold_font(24))
draw1.text((140, 18), 'Jobs', fill='#666666', font=get_font(18))

# Sidebar job list
draw1.rectangle([0, 60, 420, 800], fill='#ffffff')

jobs = [
    ('Senior Data Analyst', 'TechCorp Inc.', '$95,000 - $120,000/yr', False),
    ('Full Stack Developer', 'InnovateTech', '$110,000 - $140,000/yr', True),
    ('Product Manager', 'StartupCo', '$125,000/yr', False),
]

for i, (title, company, salary, selected) in enumerate(jobs):
    y = 70 + i * 110
    outline_color = '#0a66c2' if selected else '#e0e0e0'
    outline_width = 2 if selected else 1
    draw1.rounded_rectangle([10, y, 410, y+100], radius=4, fill='#ffffff', outline=outline_color, width=outline_width)
    draw1.text((20, y+10), title, fill='#000000', font=get_bold_font(15))
    draw1.text((20, y+32), company, fill='#666666', font=get_font(13))
    draw1.text((20, y+52), salary, fill='#333333', font=get_font(13))
    if selected:
        # Inline conversion badge
        draw1.rounded_rectangle([20, y+72, 350, y+92], radius=4, fill='#e8f5e9')
        draw1.text((28, y+74), '= $52.88 - $67.31/hr  |  $4,231 - $5,385/bi-wk', fill='#2e7d32', font=get_font(11))

# Main content - job detail
draw1.rectangle([430, 60, 1270, 800], fill='#ffffff')
draw1.text((450, 80), 'Full Stack Developer', fill='#000000', font=get_bold_font(24))
draw1.text((450, 115), 'InnovateTech - San Francisco, CA', fill='#666666', font=get_font(16))
draw1.text((450, 145), 'Posted 2 days ago - 47 applicants', fill='#888888', font=get_font(14))

# Salary section with conversion
draw1.text((450, 190), '$110,000 - $140,000/yr', fill='#333333', font=get_bold_font(18))

# The conversion tooltip
tooltip_x, tooltip_y = 450, 220
draw1.rounded_rectangle([tooltip_x, tooltip_y, tooltip_x+500, tooltip_y+80], radius=8, fill='#e8f5e9', outline='#4caf50', width=1)
draw1.text((tooltip_x+12, tooltip_y+8), 'Pay Decoder', fill='#2e7d32', font=get_bold_font(12))
draw1.text((tooltip_x+12, tooltip_y+28), 'Hourly: $52.88 - $67.31  |  Monthly: $9,167 - $11,667', fill='#2e7d32', font=get_font(13))
draw1.text((tooltip_x+12, tooltip_y+50), 'Biweekly: $4,231 - $5,385  |  Weekly: $2,115 - $2,692', fill='#558b2f', font=get_font(12))

# Job description
desc_y = 320
lines = [
    'About the role:',
    'We are looking for a Full Stack Developer with experience',
    'in React, Node.js, PostgreSQL, and cloud services (AWS).',
    '',
    'Requirements:',
    '  3+ years experience with JavaScript/TypeScript',
    '  Proficiency in React, Redux, and REST APIs',
    '  Experience with PostgreSQL or similar databases',
]
for line in lines:
    if line:
        draw1.text((450, desc_y), line, fill='#333333', font=get_font(14))
    desc_y += 22

img1.save(os.path.join(base, 'screenshot-1-inline.png'))
print('Created screenshot-1-inline.png')


# ============================================
# Screenshot 2: Popup with settings
# ============================================
img2 = Image.new('RGB', (1280, 800), '#f3f2ef')
draw2 = ImageDraw.Draw(img2)

# Background
draw2.rectangle([0, 0, 1280, 52], fill='#ffffff')
draw2.text((20, 14), 'LinkedIn', fill='#0a66c2', font=get_bold_font(24))

# Popup
popup_x, popup_y = 440, 80
popup_w, popup_h = 360, 440
draw2.rounded_rectangle([popup_x+5, popup_y+5, popup_x+popup_w+5, popup_y+popup_h+5], radius=12, fill='#999999')
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+popup_h], radius=12, fill='#ffffff')

# Header
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+56], radius=12, fill='#2e7d32')
draw2.rectangle([popup_x, popup_y+40, popup_x+popup_w, popup_y+56], fill='#2e7d32')
draw2.text((popup_x+20, popup_y+14), 'Pay Decoder', fill='#ffffff', font=get_bold_font(22))

# Show conversions toggle
sy = popup_y + 72
draw2.text((popup_x+20, sy), 'Show Conversions', fill='#333333', font=get_bold_font(14))
draw2.rounded_rectangle([popup_x+popup_w-70, sy-2, popup_x+popup_w-20, sy+22], radius=12, fill='#4caf50')
draw2.ellipse([popup_x+popup_w-46, sy, popup_x+popup_w-24, sy+20], fill='#ffffff')

# Hours per week
sy += 46
draw2.text((popup_x+20, sy), 'Hours per Week', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw2.text((popup_x+30, sy+10), '40', fill='#3c4043', font=get_font(16))

# Weeks per year
sy += 52
draw2.text((popup_x+20, sy), 'Weeks per Year', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw2.text((popup_x+30, sy+10), '52', fill='#3c4043', font=get_font(16))

# Currency
sy += 52
draw2.text((popup_x+20, sy), 'Display Currency', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', fill='#ffffff')
draw2.text((popup_x+30, sy+10), 'USD ($)', fill='#3c4043', font=get_font(16))

# Save button
sy += 56
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+44], radius=8, fill='#2e7d32')
draw2.text((popup_x+120, sy+12), 'Save Settings', fill='#ffffff', font=get_bold_font(15))

img2.save(os.path.join(base, 'screenshot-2-popup.png'))
print('Created screenshot-2-popup.png')


# ============================================
# Screenshot 3: Feature highlights
# ============================================
img3 = Image.new('RGB', (1280, 800), '#ffffff')
draw3 = ImageDraw.Draw(img3)

draw3.text((100, 40), 'Pay Decoder', fill='#2e7d32', font=get_bold_font(36))
draw3.text((100, 85), 'Instantly decode any job salary', fill='#5f6368', font=get_font(20))

features = [
    ('Instant Convert', 'See hourly, monthly &\nbiweekly breakdowns', '#4caf50'),
    ('Multi-Site', 'Works on LinkedIn,\nIndeed & Glassdoor', '#2196f3'),
    ('Range Support', 'Handles salary ranges\nlike $80k - $120k', '#ff9800'),
    ('100% Private', 'All data stays local\nin your browser', '#9c27b0'),
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
    ('1', 'Install & configure', 'Set your preferred hours\nand display currency'),
    ('2', 'Browse job listings', 'Visit LinkedIn, Indeed or\nGlassdoor as usual'),
    ('3', 'See decoded salary', 'Conversions appear inline\nnext to every salary'),
]

for i, (num, title, desc) in enumerate(steps):
    x = 100 + i * 380
    y = 460
    draw3.ellipse([x, y, x+50, y+50], fill='#2e7d32')
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
promo = Image.new('RGB', (440, 280), '#2e7d32')
draw_p = ImageDraw.Draw(promo)

for i in range(280):
    r = int(46 + (76-46) * i/280)
    g = int(125 + (175-125) * i/280)
    b = int(50 + (80-50) * i/280)
    draw_p.line([(0, i), (440, i)], fill=(r, g, b))

draw_p.text((30, 25), 'Pay', fill='#ffffff', font=get_bold_font(36))
draw_p.text((30, 68), 'Decoder', fill='#ffffff', font=get_bold_font(36))

draw_p.rounded_rectangle([30, 125, 250, 185], radius=8, fill='#ffffff')
draw_p.text((42, 130), '$110k/yr', fill='#666666', font=get_font(14))
draw_p.text((42, 150), '= $52.88/hr', fill='#2e7d32', font=get_bold_font(22))

draw_p.text((265, 135), 'Decode any', fill='#c8e6c9', font=get_font(16))
draw_p.text((265, 158), 'job salary', fill='#c8e6c9', font=get_font(16))

draw_p.text((30, 210), 'Free Chrome Extension', fill='#a5d6a7', font=get_font(15))
draw_p.text((30, 233), 'for Job Seekers', fill='#a5d6a7', font=get_font(15))

promo.save(os.path.join(base, 'promo-small-440x280.png'))
print('Created promo-small-440x280.png')


# ============================================
# Marquee promo tile (1400x560)
# ============================================
marquee = Image.new('RGB', (1400, 560), '#1b5e20')
draw_m = ImageDraw.Draw(marquee)

for i in range(560):
    r = int(27 + (46-27) * i/560)
    g = int(94 + (125-94) * i/560)
    b = int(32 + (50-32) * i/560)
    draw_m.line([(0, i), (1400, i)], fill=(r, g, b))

draw_m.text((80, 80), 'Pay Decoder', fill='#ffffff', font=get_bold_font(48))
draw_m.text((80, 145), 'Instantly decode any job salary', fill='#a5d6a7', font=get_font(24))

bullets_y = 210
for bullet in ['Converts salary to hourly, monthly & biweekly', 'Works on LinkedIn, Indeed & Glassdoor', 'Supports salary ranges ($80k - $120k)', '100% private - all data stays local', 'Completely free']:
    draw_m.ellipse([100, bullets_y+6, 108, bullets_y+14], fill='#4caf50')
    draw_m.text((120, bullets_y), bullet, fill='#e0e0e0', font=get_font(18))
    bullets_y += 32

# Conversion example on right
badge_cx, badge_cy = 1050, 230
draw_m.rounded_rectangle([badge_cx-140, badge_cy-110, badge_cx+140, badge_cy+110], radius=20, fill='#ffffff')
draw_m.text((badge_cx-110, badge_cy-90), '$110,000/yr', fill='#666666', font=get_font(16))
draw_m.line([(badge_cx-110, badge_cy-60), (badge_cx+110, badge_cy-60)], fill='#e0e0e0', width=1)
draw_m.text((badge_cx-110, badge_cy-45), '= $52.88/hr', fill='#2e7d32', font=get_bold_font(28))
draw_m.text((badge_cx-110, badge_cy+0), '$9,167/mo', fill='#558b2f', font=get_font(16))
draw_m.text((badge_cx-110, badge_cy+25), '$4,231/biweekly', fill='#558b2f', font=get_font(16))
draw_m.text((badge_cx-110, badge_cy+50), '$2,115/weekly', fill='#558b2f', font=get_font(16))
draw_m.text((badge_cx-110, badge_cy+78), 'Pay Decoder', fill='#4caf50', font=get_bold_font(12))

draw_m.rounded_rectangle([80, 410, 340, 475], radius=8, fill='#4caf50')
draw_m.text((105, 428), 'Add to Chrome - Free', fill='#ffffff', font=get_bold_font(20))

marquee.save(os.path.join(base, 'promo-marquee-1400x560.png'))
print('Created promo-marquee-1400x560.png')

print('\nAll promotional images created!')
