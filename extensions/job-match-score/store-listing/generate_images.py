"""Generate Chrome Web Store promotional images for Job Match Score."""

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
# Screenshot 1: Match score badge on LinkedIn
# ============================================
img1 = Image.new('RGB', (1280, 800), '#f3f2ef')
draw1 = ImageDraw.Draw(img1)

# LinkedIn header
draw1.rectangle([0, 0, 1280, 52], fill='#ffffff')
draw1.text((20, 14), 'LinkedIn', fill='#0a66c2', font=get_bold_font(24))
draw1.text((140, 18), 'Jobs', fill='#666666', font=get_font(18))

# Sidebar
draw1.rectangle([0, 60, 420, 800], fill='#ffffff')
draw1.rectangle([10, 70, 410, 170], fill='#f8f8f8', outline='#e0e0e0')
draw1.text((20, 80), 'Senior Data Analyst', fill='#000000', font=get_bold_font(16))
draw1.text((20, 105), 'TechCorp Inc.', fill='#666666', font=get_font(14))
draw1.text((20, 125), 'Remote', fill='#888888', font=get_font(13))

draw1.rectangle([10, 180, 410, 280], fill='#ffffff', outline='#0a66c2', width=2)
draw1.text((20, 190), 'Full Stack Developer', fill='#000000', font=get_bold_font(16))
draw1.text((20, 215), 'InnovateTech', fill='#666666', font=get_font(14))
draw1.text((20, 235), 'San Francisco, CA', fill='#888888', font=get_font(13))

# Main content
draw1.rectangle([430, 60, 1270, 800], fill='#ffffff')
draw1.text((450, 80), 'Full Stack Developer', fill='#000000', font=get_bold_font(24))
draw1.text((450, 115), 'InnovateTech - San Francisco, CA', fill='#666666', font=get_font(16))
draw1.text((450, 145), 'Posted 2 days ago - 47 applicants', fill='#888888', font=get_font(14))

desc_y = 190
lines = [
    'About the role:',
    'We are looking for a Full Stack Developer with experience',
    'in React, Node.js, PostgreSQL, and cloud services (AWS).',
    '',
    'Requirements:',
    '  3+ years experience with JavaScript/TypeScript',
    '  Proficiency in React, Redux, and REST APIs',
    '  Experience with PostgreSQL or similar databases',
    '  Familiarity with Docker, CI/CD pipelines',
    '  Strong problem-solving and communication skills',
]
for line in lines:
    if line:
        draw1.text((450, desc_y), line, fill='#333333', font=get_font(14))
    desc_y += 22

# THE BADGE
badge_x, badge_y = 1050, 650
badge_w, badge_h = 200, 100
draw1.rounded_rectangle([badge_x+3, badge_y+3, badge_x+badge_w+3, badge_y+badge_h+3], radius=12, fill='#cccccc')
draw1.rounded_rectangle([badge_x, badge_y, badge_x+badge_w, badge_y+badge_h], radius=12, fill='#ffffff', outline='#4caf50', width=3)
draw1.text((badge_x + 15, badge_y + 8), '72%', fill='#4caf50', font=get_bold_font(36))
draw1.text((badge_x + 15, badge_y + 52), 'Strong match', fill='#333333', font=get_font(14))
draw1.text((badge_x + 15, badge_y + 72), '18 of 25 keywords', fill='#888888', font=get_font(12))

img1.save(os.path.join(base, 'screenshot-1-badge.png'))
print('Created screenshot-1-badge.png')


# ============================================
# Screenshot 2: Popup with keyword analysis
# ============================================
img2 = Image.new('RGB', (1280, 800), '#f3f2ef')
draw2 = ImageDraw.Draw(img2)

draw2.rectangle([0, 0, 1280, 52], fill='#ffffff')
draw2.text((20, 14), 'LinkedIn', fill='#0a66c2', font=get_bold_font(24))

# Popup
popup_x, popup_y = 440, 100
popup_w, popup_h = 400, 580
draw2.rounded_rectangle([popup_x+4, popup_y+4, popup_x+popup_w+4, popup_y+popup_h+4], radius=12, fill='#999999')
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+popup_h], radius=12, fill='#ffffff')

# Header
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+60], radius=12, fill='#4a90d9')
draw2.rectangle([popup_x, popup_y+40, popup_x+popup_w, popup_y+60], fill='#4a90d9')
draw2.text((popup_x+20, popup_y+12), 'Job Match Score', fill='#ffffff', font=get_bold_font(22))

# Score
sy = popup_y + 75
draw2.text((popup_x+20, sy), 'Your Match Score', fill='#888888', font=get_font(13))
draw2.text((popup_x+20, sy+20), '72%', fill='#4caf50', font=get_bold_font(42))
draw2.text((popup_x+120, sy+35), 'Strong match', fill='#4caf50', font=get_bold_font(16))

# Progress bar
bar_y = sy + 75
draw2.rounded_rectangle([popup_x+20, bar_y, popup_x+popup_w-20, bar_y+8], radius=4, fill='#e0e0e0')
draw2.rounded_rectangle([popup_x+20, bar_y, popup_x+20+int(360*0.72), bar_y+8], radius=4, fill='#4caf50')

# Matched keywords
ky = bar_y + 25
draw2.text((popup_x+20, ky), 'MATCHED KEYWORDS (18)', fill='#4caf50', font=get_bold_font(12))
ky += 22

green_kws = ['react', 'javascript', 'nodejs', 'postgresql', 'aws', 'docker', 'rest', 'api', 'redux', 'cicd', 'typescript', 'git']
chip_x = popup_x + 20
for kw in green_kws:
    tw = len(kw) * 8 + 16
    if chip_x + tw > popup_x + popup_w - 20:
        chip_x = popup_x + 20
        ky += 28
    draw2.rounded_rectangle([chip_x, ky, chip_x+tw, ky+22], radius=11, fill='#e8f5e9')
    draw2.text((chip_x+8, ky+3), kw, fill='#2e7d32', font=get_font(12))
    chip_x += tw + 6

# Missing keywords
ky += 40
draw2.text((popup_x+20, ky), 'MISSING KEYWORDS (7)', fill='#e53935', font=get_bold_font(12))
ky += 22

red_kws = ['graphql', 'agile', 'scrum', 'python', 'testing', 'leadership', 'figma']
chip_x = popup_x + 20
for kw in red_kws:
    tw = len(kw) * 8 + 16
    if chip_x + tw > popup_x + popup_w - 20:
        chip_x = popup_x + 20
        ky += 28
    draw2.rounded_rectangle([chip_x, ky, chip_x+tw, ky+22], radius=11, fill='#ffebee')
    draw2.text((chip_x+8, ky+3), kw, fill='#c62828', font=get_font(12))
    chip_x += tw + 6

draw2.text((popup_x+20, popup_y+popup_h-30), '18 of 25 keywords matched', fill='#888888', font=get_font(12))

img2.save(os.path.join(base, 'screenshot-2-popup.png'))
print('Created screenshot-2-popup.png')


# ============================================
# Screenshot 3: Feature highlights
# ============================================
img3 = Image.new('RGB', (1280, 800), '#ffffff')
draw3 = ImageDraw.Draw(img3)

draw3.text((100, 40), 'Job Match Score', fill='#4a90d9', font=get_bold_font(36))
draw3.text((100, 85), 'Know your fit before you apply', fill='#666666', font=get_font(20))

features = [
    ('Instant Scores', 'See match % on every\nLinkedIn job listing', '#4caf50'),
    ('Smart Keywords', 'Synonym matching &\nmulti-word detection', '#2196f3'),
    ('100% Private', 'All data stays local\nin your browser', '#9c27b0'),
    ('Zero Cost', 'Completely free\nNo sign-up needed', '#ff9800'),
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
    ('1', 'Paste your resume', 'Open the popup and\npaste your resume text'),
    ('2', 'Browse LinkedIn', 'Visit any job listing\non LinkedIn as usual'),
    ('3', 'See your score', 'Match badge appears\nautomatically on the page'),
]

for i, (num, title, desc) in enumerate(steps):
    x = 100 + i * 380
    y = 460
    draw3.ellipse([x, y, x+50, y+50], fill='#4a90d9')
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
promo = Image.new('RGB', (440, 280), '#4a90d9')
draw_p = ImageDraw.Draw(promo)

for i in range(280):
    r = max(0, int(74 + (26-74) * i/280))
    g = max(0, int(144 + (30-144) * i/280))
    b = max(0, int(217 + (46-217) * i/280))
    draw_p.line([(0, i), (440, i)], fill=(r, g, b))

draw_p.text((30, 30), 'Job Match', fill='#ffffff', font=get_bold_font(36))
draw_p.text((30, 75), 'Score', fill='#ffffff', font=get_bold_font(36))

draw_p.rounded_rectangle([30, 140, 180, 200], radius=8, fill='#ffffff')
draw_p.text((45, 148), '72%', fill='#4caf50', font=get_bold_font(32))
draw_p.text((200, 150), 'See your fit', fill='#e0e0e0', font=get_font(18))
draw_p.text((200, 175), 'before you apply', fill='#e0e0e0', font=get_font(18))

draw_p.text((30, 220), 'Free Chrome Extension', fill='#bbdefb', font=get_font(16))
draw_p.text((30, 245), 'for LinkedIn Job Seekers', fill='#bbdefb', font=get_font(16))

promo.save(os.path.join(base, 'promo-small-440x280.png'))
print('Created promo-small-440x280.png')


# ============================================
# Marquee promo tile (1400x560)
# ============================================
marquee = Image.new('RGB', (1400, 560), '#1a1a2e')
draw_m = ImageDraw.Draw(marquee)

for i in range(560):
    r = int(26 + (74-26) * i/560)
    g = int(26 + (144-26) * i/560)
    b = int(46 + (217-46) * i/560)
    draw_m.line([(0, i), (1400, i)], fill=(r, g, b))

draw_m.text((80, 100), 'Job Match Score', fill='#ffffff', font=get_bold_font(48))
draw_m.text((80, 165), 'Know your fit before you apply', fill='#bbdefb', font=get_font(24))

bullets_y = 240
for bullet in ['Instant match scores on LinkedIn', 'Smart keyword analysis', '100% private - all data stays local', 'Completely free']:
    draw_m.text((100, bullets_y), bullet, fill='#e0e0e0', font=get_font(18))
    bullets_y += 35

badge_cx, badge_cy = 1050, 250
draw_m.rounded_rectangle([badge_cx-120, badge_cy-100, badge_cx+120, badge_cy+100], radius=20, fill='#ffffff')
draw_m.text((badge_cx-80, badge_cy-75), '72%', fill='#4caf50', font=get_bold_font(72))
draw_m.text((badge_cx-60, badge_cy+15), 'Strong match', fill='#333333', font=get_bold_font(18))
draw_m.text((badge_cx-65, badge_cy+45), '18 of 25 keywords', fill='#888888', font=get_font(14))

draw_m.rounded_rectangle([80, 430, 340, 490], radius=8, fill='#4caf50')
draw_m.text((105, 445), 'Add to Chrome - Free', fill='#ffffff', font=get_bold_font(18))

marquee.save(os.path.join(base, 'promo-marquee-1400x560.png'))
print('Created promo-marquee-1400x560.png')

print('\nAll promotional images created!')
