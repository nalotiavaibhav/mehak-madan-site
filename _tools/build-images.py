#!/usr/bin/env python3
"""Build every responsive image variant in assets/lib from the originals in ../highrespics.

For each photo pNN:
  pNN.webp / pNN.avif          full size (same pixel size as the pNN.jpg fallback)
  pNN-sm.webp / pNN-sm.avif    800px wide
Plus crops cut to the exact box a photo is shown in, so phones never download pixels
that CSS would crop away. Each crop uses the same focal point as the CSS object-position
it replaces, so framing is identical to what the page showed before:
  pNN-m{w}   4:5   homepage hero on phones        (.hero-photo, object-position 50% 22%)
  pNN-t{w}   16:10 video-card thumbnails          (.wthumb,     object-position 50% 28%)
  pNN-v{w}   16:9  homepage video poster          (.poster,     object-position 50% 30%)
The pNN.jpg files stay as the fallback and for og:image/schema; this script never touches them.

Run after adding or replacing a photo:   python3 _tools/build-images.py
"""
import os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(ROOT, '..', 'highrespics')
LIB = os.path.join(ROOT, 'assets', 'lib')

SOURCES = {
    'p05': 'WhatsApp Image 2025-11-27 at 08.30.41.jpeg', 'p10': 'WhatsApp Image 2025-11-27 at 08.30.43 (2).jpeg',
    'p11': 'WhatsApp Image 2025-11-27 at 08.30.43.jpeg', 'p13': 'WhatsApp Image 2025-11-27 at 08.30.44 (2).jpeg',
    'p16': 'WhatsApp Image 2025-11-27 at 08.30.45 (2).jpeg', 'p20': 'WhatsApp Image 2025-11-27 at 08.30.46.jpeg',
    'p25': 'WhatsApp Image 2025-11-27 at 08.30.48 (2).jpeg', 'p33': 'WhatsApp Image 2025-11-27 at 08.30.51 (1).jpeg',
    'p34': 'WhatsApp Image 2025-11-27 at 08.30.51.jpeg', 'p35': 'WhatsApp Image 2026-05-25 at 22.14.57.jpeg',
    'p47': '1706885525945.jpg',
}
# photos shown uncropped somewhere (gallery, portraits, hero, page backgrounds) and so need pNN / pNN-sm.
# p11, p25 and p34 only appear as thumbnails / the poster, which use their own crops below.
BASE = ['p05', 'p10', 'p13', 'p16', 'p20', 'p33', 'p35', 'p47']
# (photo, suffix, aspect w:h, focal y as in CSS object-position, widths)
CROPS = [('p05', 'm', (4, 5), .22, (480, 750, 1080))] + \
        [(p, 't', (16, 10), .28, (640, 960)) for p in ('p05', 'p11', 'p16', 'p25', 'p34', 'p47')] + \
        [('p34', 'v', (16, 9), .30, (750, 1300))]

def save(im, name):
    im.save(os.path.join(LIB, name + '.webp'), 'WEBP', quality=78, method=6)
    im.save(os.path.join(LIB, name + '.avif'), 'AVIF', quality=52)

def crop(im, aspect, focal_y):
    W, H = im.size; ar = aspect[0] / aspect[1]
    if W / H > ar:                       # too wide: trim the sides evenly
        cw = round(H * ar); x = (W - cw) // 2; return im.crop((x, 0, x + cw, H))
    ch = round(W / ar); y = round((H - ch) * focal_y)
    return im.crop((0, y, W, y + ch))

def main():
    for key in BASE:
        im = ImageOps.exif_transpose(Image.open(os.path.join(ORIG, SOURCES[key]))).convert('RGB')
        full = Image.open(os.path.join(LIB, key + '.jpg')).size          # keep the fallback's geometry
        big = im.resize(full, Image.LANCZOS)
        big.save(os.path.join(LIB, key + '.webp'), 'WEBP', quality=80, method=6)
        big.save(os.path.join(LIB, key + '.avif'), 'AVIF', quality=55)
        save(im.resize((800, round(full[1] * 800 / full[0])), Image.LANCZOS), key + '-sm')
    for key, suf, aspect, fy, widths in CROPS:
        im = crop(ImageOps.exif_transpose(Image.open(os.path.join(ORIG, SOURCES[key]))).convert('RGB'), aspect, fy)
        for w in widths:
            save(im.resize((w, round(w * aspect[1] / aspect[0])), Image.LANCZOS), f'{key}-{suf}{w}')
    print('built', len([f for f in os.listdir(LIB) if f.endswith(('.webp', '.avif'))]), 'variants in assets/lib')

if __name__ == '__main__':
    main()
