"""
generate_icons.py — Generate Read Cost extension icons using Pillow.

Creates icon16.png, icon48.png, and icon128.png with a teal/cyan color scheme
featuring a book/dollar reading theme.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

# Output directory
ICON_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "icons")
os.makedirs(ICON_DIR, exist_ok=True)

# Colors
TEAL = (0, 137, 123)        # #00897b
TEAL_DARK = (0, 105, 92)    # #00695c
WHITE = (255, 255, 255)
TEAL_LIGHT = (178, 223, 219)  # light teal for accents


def draw_icon(size):
    """
    Draw a Read Cost icon at the given size.

    Design: Rounded teal square with a stylized "$" and a book/page curve.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    margin = max(1, size // 16)
    radius = max(2, size // 5)
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=radius,
        fill=TEAL,
    )

    # Draw a subtle book/page shape (curved left edge)
    center_x = size // 2
    center_y = size // 2

    # Book spine curve on the left side
    book_left = size * 0.2
    book_right = size * 0.78
    book_top = size * 0.18
    book_bottom = size * 0.82

    # Draw a simple page/document shape
    page_points = [
        (book_left + size * 0.08, book_top),
        (book_right, book_top),
        (book_right, book_bottom),
        (book_left + size * 0.08, book_bottom),
    ]
    draw.polygon(page_points, fill=(255, 255, 255, 60))

    # Draw page fold corner (top-right triangle)
    fold_size = size * 0.12
    fold_points = [
        (book_right - fold_size, book_top),
        (book_right, book_top + fold_size),
        (book_right, book_top),
    ]
    draw.polygon(fold_points, fill=TEAL_DARK)

    # Draw dollar sign in the center
    font_size = max(8, int(size * 0.45))
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except (IOError, OSError):
        try:
            font = ImageFont.truetype("Arial.ttf", font_size)
        except (IOError, OSError):
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except (IOError, OSError):
                font = ImageFont.load_default()

    dollar = "$"
    bbox = draw.textbbox((0, 0), dollar, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = center_x - text_w // 2
    text_y = center_y - text_h // 2 - bbox[1]

    # Draw dollar sign with shadow
    shadow_offset = max(1, size // 32)
    draw.text((text_x + shadow_offset, text_y + shadow_offset), dollar,
              fill=(0, 80, 70, 120), font=font)
    draw.text((text_x, text_y), dollar, fill=WHITE, font=font)

    return img


def main():
    """Generate all icon sizes."""
    sizes = [16, 48, 128]
    for size in sizes:
        img = draw_icon(size)
        path = os.path.join(ICON_DIR, f"icon{size}.png")
        img.save(path, "PNG")
        print(f"Created {path} ({size}x{size})")


if __name__ == "__main__":
    main()
