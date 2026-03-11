"""Generate Chrome Web Store promotional images for Meeting Cost Calculator."""

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
# Screenshot 1: Cost badge on Google Calendar
# ============================================
img1 = Image.new('RGB', (1280, 800), '#ffffff')
draw1 = ImageDraw.Draw(img1)

# Google Calendar header bar
draw1.rectangle([0, 0, 1280, 64], fill='#ffffff')
draw1.text((20, 18), 'Google Calendar', fill='#5f6368', font=get_bold_font(22))
draw1.text((250, 22), 'March 2026', fill='#3c4043', font=get_bold_font(18))

# Sidebar
draw1.rectangle([0, 64, 260, 800], fill='#ffffff')
draw1.rectangle([260, 64, 262, 800], fill='#dadce0')

# Mini calendar header
draw1.text((30, 80), 'March 2026', fill='#3c4043', font=get_bold_font(14))
draw1.text((30, 105), 'S  M  T  W  T  F  S', fill='#70757a', font=get_font(12))

# Calendar day numbers
days_y = 125
for week in range(5):
    for day in range(7):
        num = week * 7 + day - 1  # offset for March starting on Sunday
        if 1 <= num <= 31:
            x = 30 + day * 33
            y = days_y + week * 22
            if num == 11:
                draw1.ellipse([x-4, y-2, x+20, y+18], fill='#1a73e8')
                draw1.text((x, y), str(num), fill='#ffffff', font=get_font(12))
            else:
                draw1.text((x, y), str(num), fill='#3c4043', font=get_font(12))

# Main calendar grid - day view for March 11
draw1.rectangle([262, 64, 1280, 100], fill='#f8f9fa')
draw1.text((300, 72), 'WED', fill='#70757a', font=get_font(12))
draw1.text((300, 84), '11', fill='#1a73e8', font=get_bold_font(14))

# Time labels
times = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM']
for i, t in enumerate(times):
    y = 110 + i * 70
    draw1.text((270, y), t, fill='#70757a', font=get_font(11))
    draw1.line([(320, y+6), (1270, y+6)], fill='#dadce0', width=1)

# Calendar events
# Morning Standup 9-10am
draw1.rounded_rectangle([340, 180, 1260, 244], radius=4, fill='#039be5')
draw1.text((350, 185), 'Morning Standup', fill='#ffffff', font=get_bold_font(14))
draw1.text((350, 205), '9:00 - 10:00am  |  4 attendees', fill='#e1f5fe', font=get_font(12))

# Sprint Planning 1-2pm
draw1.rounded_rectangle([340, 460, 1260, 524], radius=4, fill='#7986cb')
draw1.text((350, 465), 'Sprint Planning', fill='#ffffff', font=get_bold_font(14))
draw1.text((350, 485), '1:00 - 2:00pm  |  8 attendees', fill='#e8eaf6', font=get_font(12))

# Quick 1:1 3-3:30pm
draw1.rounded_rectangle([340, 530, 1260, 562], radius=4, fill='#33b679')
draw1.text((350, 535), 'Quick 1:1 Check-in', fill='#ffffff', font=get_bold_font(14))

# Client Demo 4-5pm
draw1.rounded_rectangle([340, 600, 1260, 664], radius=4, fill='#f4511e')
draw1.text((350, 605), 'Client Demo - Project Alpha', fill='#ffffff', font=get_bold_font(14))
draw1.text((350, 625), '4:00 - 5:00pm  |  5 attendees', fill='#fbe9e7', font=get_font(12))

# THE COST BADGE (bottom right, floating)
badge_x, badge_y = 980, 640
badge_w, badge_h = 270, 130
# Shadow
draw1.rounded_rectangle([badge_x+4, badge_y+4, badge_x+badge_w+4, badge_y+badge_h+4], radius=12, fill='#cccccc')
# Badge
draw1.rounded_rectangle([badge_x, badge_y, badge_x+badge_w, badge_y+badge_h], radius=12, fill='#ffffff', outline='#1a73e8', width=2)
draw1.text((badge_x+15, badge_y+10), '$400.00', fill='#1a73e8', font=get_bold_font(32))
draw1.text((badge_x+15, badge_y+48), 'Sprint Planning', fill='#3c4043', font=get_font(13))
draw1.text((badge_x+15, badge_y+68), '8 attendees  x  60 min', fill='#70757a', font=get_font(12))
draw1.text((badge_x+15, badge_y+88), '$50.00/person  |  $6.67/min', fill='#70757a', font=get_font(12))
draw1.text((badge_x+15, badge_y+108), 'Meeting Cost Calculator', fill='#1a73e8', font=get_font(10))

img1.save(os.path.join(base, 'screenshot-1-badge.png'))
print('Created screenshot-1-badge.png')


# ============================================
# Screenshot 2: Popup with settings
# ============================================
img2 = Image.new('RGB', (1280, 800), '#f1f3f4')
draw2 = ImageDraw.Draw(img2)

# Background calendar
draw2.rectangle([0, 0, 1280, 64], fill='#ffffff')
draw2.text((20, 18), 'Google Calendar', fill='#5f6368', font=get_bold_font(22))

# Popup overlay
popup_x, popup_y = 420, 80
popup_w, popup_h = 380, 600
# Shadow
draw2.rounded_rectangle([popup_x+5, popup_y+5, popup_x+popup_w+5, popup_y+popup_h+5], radius=12, fill='#999999')
# Popup
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+popup_h], radius=12, fill='#ffffff')

# Header bar
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+56], radius=12, fill='#1a73e8')
draw2.rectangle([popup_x, popup_y+40, popup_x+popup_w, popup_y+56], fill='#1a73e8')
draw2.text((popup_x+20, popup_y+14), 'Meeting Cost Calculator', fill='#ffffff', font=get_bold_font(20))

# Your Rate section
sy = popup_y + 72
draw2.text((popup_x+20, sy), 'Your Hourly Rate', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', width=1, fill='#ffffff')
draw2.text((popup_x+30, sy+10), '$  75.00', fill='#3c4043', font=get_font(16))

# Rate type toggle
sy += 52
draw2.rounded_rectangle([popup_x+20, sy, popup_x+110, sy+30], radius=15, fill='#1a73e8')
draw2.text((popup_x+35, sy+7), 'Hourly', fill='#ffffff', font=get_font(12))
draw2.rounded_rectangle([popup_x+115, sy, popup_x+220, sy+30], radius=15, outline='#dadce0', fill='#ffffff')
draw2.text((popup_x+130, sy+7), 'Annual', fill='#5f6368', font=get_font(12))

# Default Attendee Rate
sy += 44
draw2.text((popup_x+20, sy), 'Default Attendee Rate', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', width=1, fill='#ffffff')
draw2.text((popup_x+30, sy+10), '$  50.00', fill='#3c4043', font=get_font(16))

# Currency
sy += 52
draw2.text((popup_x+20, sy), 'Currency', fill='#5f6368', font=get_font(13))
sy += 22
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+40], radius=6, outline='#dadce0', width=1, fill='#ffffff')
draw2.text((popup_x+30, sy+10), 'USD ($)', fill='#3c4043', font=get_font(16))

# Save button
sy += 56
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+44], radius=8, fill='#1a73e8')
draw2.text((popup_x+140, sy+12), 'Save Settings', fill='#ffffff', font=get_bold_font(15))

# Live meeting section
sy += 60
draw2.line([(popup_x+20, sy), (popup_x+popup_w-20, sy)], fill='#dadce0', width=1)
sy += 12
draw2.text((popup_x+20, sy), 'CURRENT MEETING', fill='#1a73e8', font=get_bold_font(11))
sy += 20
draw2.text((popup_x+20, sy), 'Sprint Planning', fill='#3c4043', font=get_bold_font(15))
sy += 22
draw2.text((popup_x+20, sy), '32 min elapsed  |  8 attendees', fill='#5f6368', font=get_font(12))
sy += 20

# Progress bar
draw2.rounded_rectangle([popup_x+20, sy, popup_x+popup_w-20, sy+6], radius=3, fill='#e8eaf6')
draw2.rounded_rectangle([popup_x+20, sy, popup_x+20+int(340*0.53), sy+6], radius=3, fill='#1a73e8')
sy += 16
draw2.text((popup_x+20, sy), 'Running cost:', fill='#5f6368', font=get_font(13))
draw2.text((popup_x+120, sy), '$213.33', fill='#1a73e8', font=get_bold_font(18))

img2.save(os.path.join(base, 'screenshot-2-popup.png'))
print('Created screenshot-2-popup.png')


# ============================================
# Screenshot 3: Feature highlights
# ============================================
img3 = Image.new('RGB', (1280, 800), '#ffffff')
draw3 = ImageDraw.Draw(img3)

draw3.text((100, 40), 'Meeting Cost Calculator', fill='#1a73e8', font=get_bold_font(36))
draw3.text((100, 85), 'See the real cost of every meeting', fill='#5f6368', font=get_font(20))

features = [
    ('Instant Cost', 'See total meeting cost\non any calendar event', '#1a73e8'),
    ('Live Tracking', 'Running cost counter\nfor active meetings', '#34a853'),
    ('7 Currencies', 'USD, EUR, GBP, CAD\nAUD, JPY, INR', '#ea4335'),
    ('100% Private', 'All data stays local\nin your browser', '#fbbc04'),
]

box_w, box_h = 250, 180
start_x = 80
for i, (title, desc, color) in enumerate(features):
    x = start_x + i * (box_w + 30)
    y = 160
    draw3.rounded_rectangle([x, y, x+box_w, y+box_h], radius=12, fill='#f8f9fa', outline=color, width=2)
    draw3.rounded_rectangle([x, y, x+box_w, y+6], radius=3, fill=color)
    draw3.text((x+20, y+25), title, fill='#3c4043', font=get_bold_font(18))
    dy = y + 55
    for line in desc.split('\n'):
        draw3.text((x+20, dy), line, fill='#5f6368', font=get_font(14))
        dy += 20

draw3.text((100, 400), 'How It Works', fill='#3c4043', font=get_bold_font(24))

steps = [
    ('1', 'Set your rate', 'Open the popup and\nenter your hourly rate'),
    ('2', 'Click any event', 'Click a Google Calendar\nevent as usual'),
    ('3', 'See the cost', 'Cost badge appears\ninstantly with breakdown'),
]

for i, (num, title, desc) in enumerate(steps):
    x = 100 + i * 380
    y = 460
    draw3.ellipse([x, y, x+50, y+50], fill='#1a73e8')
    draw3.text((x+17, y+10), num, fill='#ffffff', font=get_bold_font(22))
    draw3.text((x+65, y+5), title, fill='#3c4043', font=get_bold_font(16))
    dy = y + 30
    for line in desc.split('\n'):
        draw3.text((x+65, dy), line, fill='#5f6368', font=get_font(14))
        dy += 18

img3.save(os.path.join(base, 'screenshot-3-features.png'))
print('Created screenshot-3-features.png')


# ============================================
# Small promo tile (440x280)
# ============================================
promo = Image.new('RGB', (440, 280), '#1a73e8')
draw_p = ImageDraw.Draw(promo)

# Gradient background
for i in range(280):
    r = int(26 + (66-26) * i/280)
    g = int(115 + (133-115) * i/280)
    b = int(232 + (244-232) * i/280)
    draw_p.line([(0, i), (440, i)], fill=(r, g, b))

draw_p.text((30, 25), 'Meeting Cost', fill='#ffffff', font=get_bold_font(32))
draw_p.text((30, 65), 'Calculator', fill='#ffffff', font=get_bold_font(32))

# Cost badge
draw_p.rounded_rectangle([30, 120, 200, 185], radius=8, fill='#ffffff')
draw_p.text((45, 128), '$400', fill='#1a73e8', font=get_bold_font(34))

draw_p.text((215, 130), 'See the real cost', fill='#e8f0fe', font=get_font(16))
draw_p.text((215, 152), 'of every meeting', fill='#e8f0fe', font=get_font(16))

draw_p.text((30, 205), 'Free Chrome Extension', fill='#bbdefb', font=get_font(15))
draw_p.text((30, 228), 'for Google Calendar', fill='#bbdefb', font=get_font(15))

promo.save(os.path.join(base, 'promo-small-440x280.png'))
print('Created promo-small-440x280.png')


# ============================================
# Marquee promo tile (1400x560)
# ============================================
marquee = Image.new('RGB', (1400, 560), '#1a1a2e')
draw_m = ImageDraw.Draw(marquee)

# Gradient background
for i in range(560):
    r = int(26 + (26-26) * i/560)
    g = int(26 + (115-26) * i/560)
    b = int(46 + (232-46) * i/560)
    draw_m.line([(0, i), (1400, i)], fill=(r, g, b))

draw_m.text((80, 80), 'Meeting Cost Calculator', fill='#ffffff', font=get_bold_font(48))
draw_m.text((80, 145), 'See the real cost of every meeting', fill='#bbdefb', font=get_font(24))

bullets_y = 210
for bullet in ['Instant cost calculation for any event', 'Live running cost for active meetings', '7 currencies supported', '100% private - all data stays local', 'Completely free']:
    draw_m.ellipse([100, bullets_y+6, 108, bullets_y+14], fill='#1a73e8')
    draw_m.text((120, bullets_y), bullet, fill='#e0e0e0', font=get_font(18))
    bullets_y += 32

# Big cost badge on right
badge_cx, badge_cy = 1050, 240
draw_m.rounded_rectangle([badge_cx-130, badge_cy-110, badge_cx+130, badge_cy+110], radius=20, fill='#ffffff')
draw_m.text((badge_cx-100, badge_cy-85), '$400', fill='#1a73e8', font=get_bold_font(72))
draw_m.text((badge_cx-80, badge_cy+5), '8 attendees x 60 min', fill='#5f6368', font=get_font(14))
draw_m.text((badge_cx-55, badge_cy+30), 'Sprint Planning', fill='#3c4043', font=get_bold_font(16))
draw_m.text((badge_cx-70, badge_cy+58), '$50/person  |  $6.67/min', fill='#70757a', font=get_font(13))

# CTA button
draw_m.rounded_rectangle([80, 410, 360, 475], radius=8, fill='#1a73e8')
draw_m.text((105, 428), 'Add to Chrome - Free', fill='#ffffff', font=get_bold_font(20))

marquee.save(os.path.join(base, 'promo-marquee-1400x560.png'))
print('Created promo-marquee-1400x560.png')

print('\nAll promotional images created!')
