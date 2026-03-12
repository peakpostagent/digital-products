"""Generate Chrome Web Store promotional images for Review Clock."""

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
# Screenshot 1: Floating timer on GitHub PR
# ============================================
img1 = Image.new('RGB', (1280, 800), '#f6f8fa')
draw1 = ImageDraw.Draw(img1)

# GitHub header bar
draw1.rectangle([0, 0, 1280, 48], fill='#24292f')
draw1.text((20, 12), 'GitHub', fill='#ffffff', font=get_bold_font(22))
draw1.text((120, 16), 'Pull requests', fill='#c9d1d9', font=get_font(16))

# Repo breadcrumb
draw1.rectangle([0, 48, 1280, 80], fill='#ffffff')
draw1.text((20, 54), 'acme-corp', fill='#0969da', font=get_font(16))
draw1.text((120, 54), '/', fill='#666666', font=get_font(16))
draw1.text((135, 54), 'frontend-app', fill='#0969da', font=get_font(16))

# PR title area
draw1.rectangle([0, 80, 1280, 200], fill='#ffffff')
draw1.text((40, 95), 'Refactor auth middleware to use JWT tokens #247', fill='#24292f', font=get_bold_font(22))
draw1.text((40, 130), 'Open', fill='#ffffff', font=get_bold_font(13))
draw1.rounded_rectangle([35, 126, 87, 148], radius=10, fill='#238636')
draw1.text((40, 130), 'Open', fill='#ffffff', font=get_bold_font(13))
draw1.text((100, 132), 'alice opened 3 hours ago · 12 files changed', fill='#666666', font=get_font(14))

# PR tabs
draw1.rectangle([0, 160, 1280, 195], fill='#ffffff')
for i, tab in enumerate(['Conversation', 'Commits 4', 'Checks 3', 'Files changed 12']):
    x = 40 + i * 180
    color = '#0969da' if tab.startswith('Files') else '#666666'
    draw1.text((x, 168), tab, fill=color, font=get_font(14))
if True:
    draw1.rectangle([580, 190, 740, 195], fill='#0969da')

# File diff content
draw1.rectangle([30, 210, 1250, 700], fill='#ffffff', outline='#d0d7de', width=1)
draw1.text((50, 220), 'src/middleware/auth.js', fill='#24292f', font=get_bold_font(14))
draw1.text((50, 245), '+47 -23', fill='#666666', font=get_font(12))

# Diff lines
diff_y = 275
diff_lines = [
    ('-', "  const session = req.cookies.get('session');", '#ffebe9'),
    ('-', "  if (!session) return res.status(401).send('Unauthorized');", '#ffebe9'),
    ('+', "  const token = req.headers.authorization?.split(' ')[1];", '#dafbe1'),
    ('+', "  if (!token) return res.status(401).json({ error: 'Missing token' });", '#dafbe1'),
    ('+', "  const decoded = jwt.verify(token, process.env.JWT_SECRET);", '#dafbe1'),
    (' ', "  req.user = decoded;", '#ffffff'),
    (' ', "  next();", '#ffffff'),
]
for sign, line, bg in diff_lines:
    draw1.rectangle([50, diff_y, 1230, diff_y + 24], fill=bg)
    color = '#cf222e' if sign == '-' else '#1a7f37' if sign == '+' else '#666666'
    draw1.text((60, diff_y + 4), sign, fill=color, font=get_font(13))
    draw1.text((80, diff_y + 4), line, fill='#24292f', font=get_font(13))
    diff_y += 26

# Floating timer widget (the key feature!)
timer_x, timer_y = 1050, 620
draw1.rounded_rectangle([timer_x, timer_y, timer_x+195, timer_y+75], radius=12, fill='#5c6bc0', outline='#3f51b5', width=2)
# Timer icon
draw1.text((timer_x+14, timer_y+10), '⏱', fill='#ffffff', font=get_font(20))
draw1.text((timer_x+42, timer_y+10), '12:34', fill='#ffffff', font=get_bold_font(28))
draw1.text((timer_x+14, timer_y+48), 'PR #247 · Active', fill='#c5cae9', font=get_font(12))
# Effort badge
draw1.rounded_rectangle([timer_x+130, timer_y+46, timer_x+185, timer_y+66], radius=4, fill='#ff9800')
draw1.text((timer_x+140, timer_y+49), 'Large', fill='#ffffff', font=get_bold_font(11))

img1.save(os.path.join(base, 'screenshot-1-timer.png'))
print('Created screenshot-1-timer.png')


# ============================================
# Screenshot 2: Weekly stats popup
# ============================================
img2 = Image.new('RGB', (1280, 800), '#f6f8fa')
draw2 = ImageDraw.Draw(img2)

# GitHub background header
draw2.rectangle([0, 0, 1280, 48], fill='#24292f')
draw2.text((20, 12), 'GitHub', fill='#ffffff', font=get_bold_font(22))

# Popup centered
popup_x, popup_y = 420, 80
popup_w, popup_h = 400, 620
draw2.rounded_rectangle([popup_x+6, popup_y+6, popup_x+popup_w+6, popup_y+popup_h+6], radius=12, fill='#999999')
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+popup_h], radius=12, fill='#ffffff')

# Header
draw2.rounded_rectangle([popup_x, popup_y, popup_x+popup_w, popup_y+56], radius=12, fill='#5c6bc0')
draw2.rectangle([popup_x, popup_y+40, popup_x+popup_w, popup_y+56], fill='#5c6bc0')
draw2.text((popup_x+20, popup_y+16), 'Review Clock', fill='#ffffff', font=get_bold_font(20))
draw2.text((popup_x+popup_w-80, popup_y+20), 'This Week', fill='#c5cae9', font=get_font(13))

# Stats cards
sy = popup_y + 72
stats = [
    ('Total Time', '3h 47m', '#5c6bc0'),
    ('PRs Reviewed', '8', '#43a047'),
    ('Avg per Review', '28m', '#ff9800'),
    ('Longest Review', '1h 12m', '#e53935'),
]
for i, (label, value, color) in enumerate(stats):
    sx = popup_x + 15 + (i % 2) * 190
    row_y = sy + (i // 2) * 70
    draw2.rounded_rectangle([sx, row_y, sx+175, row_y+60], radius=8, fill='#f5f5f5')
    draw2.text((sx+12, row_y+8), label, fill='#888888', font=get_font(11))
    draw2.text((sx+12, row_y+28), value, fill=color, font=get_bold_font(20))

# Daily breakdown chart
chart_y = sy + 160
draw2.text((popup_x+20, chart_y), 'Daily Breakdown', fill='#333333', font=get_bold_font(14))
chart_y += 28

days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
heights = [45, 80, 30, 65, 55, 10, 0]
max_h = 90
bar_w = 38
for i, (day, h) in enumerate(zip(days, heights)):
    bx = popup_x + 25 + i * 52
    bar_top = chart_y + (max_h - h)
    if h > 0:
        draw2.rounded_rectangle([bx, bar_top, bx+bar_w, chart_y+max_h], radius=4, fill='#7986cb')
    draw2.text((bx+8, chart_y+max_h+5), day, fill='#888888', font=get_font(11))

# Recent reviews
recent_y = chart_y + max_h + 35
draw2.text((popup_x+20, recent_y), 'Recent Reviews', fill='#333333', font=get_bold_font(14))
recent_y += 25

reviews = [
    ('acme-corp/frontend', '#247 Refactor auth', '1h 12m', 'Today'),
    ('acme-corp/api', '#89 Add rate limiting', '34m', 'Today'),
    ('oss/react-hooks', '#12 Fix memo leak', '22m', 'Yesterday'),
    ('acme-corp/frontend', '#245 Update deps', '8m', 'Yesterday'),
]
for repo, pr, duration, date in reviews:
    draw2.rounded_rectangle([popup_x+15, recent_y, popup_x+popup_w-15, recent_y+48], radius=6, fill='#fafafa', outline='#e0e0e0', width=1)
    draw2.text((popup_x+25, recent_y+6), pr, fill='#0969da', font=get_bold_font(12))
    draw2.text((popup_x+25, recent_y+24), repo, fill='#888888', font=get_font(10))
    draw2.text((popup_x+popup_w-80, recent_y+6), duration, fill='#5c6bc0', font=get_bold_font(12))
    draw2.text((popup_x+popup_w-80, recent_y+24), date, fill='#aaaaaa', font=get_font(10))
    recent_y += 54

img2.save(os.path.join(base, 'screenshot-2-popup.png'))
print('Created screenshot-2-popup.png')


# ============================================
# Screenshot 3: Feature highlights
# ============================================
img3 = Image.new('RGB', (1280, 800), '#ffffff')
draw3 = ImageDraw.Draw(img3)

draw3.text((100, 40), 'Review Clock', fill='#5c6bc0', font=get_bold_font(36))
draw3.text((100, 85), 'Know how long every code review takes', fill='#5f6368', font=get_font(20))

features = [
    ('Live Timer', 'Tracks active time\non every PR page', '#5c6bc0'),
    ('Effort Estimate', 'See PR size & time\nestimate at a glance', '#43a047'),
    ('Weekly Stats', 'Review count, total\ntime & daily chart', '#ff9800'),
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
    ('1', 'Open a GitHub PR', 'The timer starts automatically\nwhen you view a pull request'),
    ('2', 'Review the code', 'Timer pauses when you switch\ntabs or go idle'),
    ('3', 'Check your stats', 'See weekly totals and daily\nbreakdowns in the popup'),
]

for i, (num, title, desc) in enumerate(steps):
    x = 100 + i * 380
    y = 460
    draw3.ellipse([x, y, x+50, y+50], fill='#5c6bc0')
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
promo = Image.new('RGB', (440, 280), '#5c6bc0')
draw_p = ImageDraw.Draw(promo)

for i in range(280):
    r = int(92 + (63-92) * i/280)
    g = int(107 + (81-107) * i/280)
    b = int(192 + (181-192) * i/280)
    draw_p.line([(0, i), (440, i)], fill=(r, g, b))

draw_p.text((30, 25), 'Review', fill='#ffffff', font=get_bold_font(36))
draw_p.text((30, 68), 'Clock', fill='#ffffff', font=get_bold_font(36))

draw_p.rounded_rectangle([30, 125, 260, 185], radius=8, fill='#ffffff')
draw_p.text((42, 130), 'PR #247', fill='#888888', font=get_font(14))
draw_p.text((42, 150), '⏱ 12:34', fill='#5c6bc0', font=get_bold_font(22))

draw_p.text((270, 135), 'Track your', fill='#c5cae9', font=get_font(16))
draw_p.text((270, 158), 'review time', fill='#c5cae9', font=get_font(16))

draw_p.text((30, 210), 'Free Chrome Extension', fill='#c5cae9', font=get_font(15))
draw_p.text((30, 233), 'for Developers', fill='#c5cae9', font=get_font(15))

promo.save(os.path.join(base, 'promo-small-440x280.png'))
print('Created promo-small-440x280.png')


# ============================================
# Marquee promo tile (1400x560)
# ============================================
marquee = Image.new('RGB', (1400, 560), '#3f51b5')
draw_m = ImageDraw.Draw(marquee)

for i in range(560):
    r = int(63 + (92-63) * i/560)
    g = int(81 + (107-81) * i/560)
    b = int(181 + (192-181) * i/560)
    draw_m.line([(0, i), (1400, i)], fill=(r, g, b))

draw_m.text((80, 80), 'Review Clock', fill='#ffffff', font=get_bold_font(48))
draw_m.text((80, 145), 'Know how long every code review takes', fill='#c5cae9', font=get_font(24))

bullets_y = 210
for bullet in ['Live timer on every GitHub PR page', 'Smart pause when you switch tabs or go idle', 'Weekly stats dashboard with daily breakdown', 'Effort estimation based on PR size', '100% private - all data stays local']:
    draw_m.ellipse([100, bullets_y+6, 108, bullets_y+14], fill='#7986cb')
    draw_m.text((120, bullets_y), bullet, fill='#e0e0e0', font=get_font(18))
    bullets_y += 32

# Timer example on right
badge_cx, badge_cy = 1050, 230
draw_m.rounded_rectangle([badge_cx-140, badge_cy-110, badge_cx+140, badge_cy+110], radius=20, fill='#ffffff')
draw_m.text((badge_cx-110, badge_cy-90), 'PR #247 · Active', fill='#888888', font=get_font(14))
draw_m.line([(badge_cx-110, badge_cy-65), (badge_cx+110, badge_cy-65)], fill='#e0e0e0', width=1)
draw_m.text((badge_cx-90, badge_cy-50), '12:34', fill='#5c6bc0', font=get_bold_font(48))
draw_m.text((badge_cx-110, badge_cy+15), 'This Week: 3h 47m', fill='#666666', font=get_font(14))
draw_m.text((badge_cx-110, badge_cy+40), '8 PRs reviewed', fill='#666666', font=get_font(14))
draw_m.rounded_rectangle([badge_cx-60, badge_cy+65, badge_cx+60, badge_cy+90], radius=4, fill='#ff9800')
draw_m.text((badge_cx-45, badge_cy+70), 'Large PR', fill='#ffffff', font=get_bold_font(13))

draw_m.rounded_rectangle([80, 410, 340, 475], radius=8, fill='#7986cb')
draw_m.text((105, 428), 'Add to Chrome - Free', fill='#ffffff', font=get_bold_font(20))

marquee.save(os.path.join(base, 'promo-marquee-1400x560.png'))
print('Created promo-marquee-1400x560.png')

print('\nAll Review Clock promotional images created!')
