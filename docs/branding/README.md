# PeakPost Gumroad Store Branding

Three branding strategies for **peakpost.gumroad.com** (Coleton Patton).

---

## Strategy A: "Clean & Professional"

**Concept:** Minimal, dev-focused, trust-building. Stripe/Linear aesthetic.

- **Tagline:** Developer tools & templates that just work.
- **Bio:** Developer tools & templates that just work. Chrome extensions, AI prompts, and productivity systems for builders.
- **Colors:**
  - `#0F172A` — Dark navy (background)
  - `#38BDF8` — Sky blue (accent)
  - `#F8FAFC` — Near-white (text)
  - `#94A3B8` — Muted slate (secondary text)
- **Banner:** Dark navy background, "PeakPost" in large white text with sky blue accent line, tagline in slate, subtle dot grid on right.
- **Avatar:** Dark navy circle with "PP" monogram in sky blue.

**Files:** `strategy-a-banner.png` (1280x640), `strategy-a-avatar.png` (400x400)

---

## Strategy B: "Bold & Modern"

**Concept:** Eye-catching gradient, energetic, stands out in Gumroad feed.

- **Tagline:** AI-Powered Tools for Builders
- **Bio:** AI-powered tools for builders. Prompt libraries, workflow templates, and Chrome extensions to 10x your output.
- **Colors:**
  - `#7C3AED` to `#2563EB` — Purple-to-blue gradient (background)
  - `#F59E0B` — Amber (accent)
  - `#FFFFFF` — White (text)
- **Banner:** Full-width purple-to-blue gradient, centered "PeakPost" in bold white, tagline in amber, subtle geometric shapes.
- **Avatar:** Purple-to-blue gradient circle with white mountain peak icon.

**Files:** `strategy-b-banner.png` (1280x640), `strategy-b-avatar.png` (400x400)

---

## Strategy C: "Warm & Approachable"

**Concept:** Friendly, creative, appeals to freelancers and indie creators.

- **Tagline:** Templates, tools & workflows for indie creators
- **Bio:** Templates, tools & workflows for indie creators. From AI prompts to spreadsheet systems — built by a solo dev in Canada.
- **Colors:**
  - `#1E293B` — Dark blue-gray (background)
  - `#10B981` — Emerald green (accent)
  - `#F97316` — Warm orange (secondary)
  - `#F1F5F9` — Light (text)
- **Banner:** Dark blue-gray background, "PeakPost" in emerald green, icon cards for Code, Sheets, and AI on the right, tagline below.
- **Avatar:** Dark circle with mountain peak outline in emerald green, orange sun/sparkle at top.

**Files:** `strategy-c-banner.png` (1280x640), `strategy-c-avatar.png` (400x400)

---

## How to Render

Run the Puppeteer render script from the project root:

```bash
node docs/branding/render.js
```

This generates all 6 PNG files from their HTML sources at `deviceScaleFactor: 1`.

## How to Apply

1. Go to [peakpost.gumroad.com](https://peakpost.gumroad.com) settings
2. Upload the chosen banner as the profile cover image (1280x640)
3. Upload the chosen avatar as the profile picture (400x400)
4. Set the bio text from the chosen strategy above
