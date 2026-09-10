#!/usr/bin/env python3
"""Trim the self-hosted latin fonts to the characters the site actually uses.

The five *-latin.woff2 files in assets/fonts are cut down from the full Google
latin files kept in _tools/fonts-src/ (unpublished: Jekyll skips _dirs). Each
keeps all of printable ASCII, common typographic punctuation, and every other
character found in the pages / site.js. site.css's unicode-range for those faces
is rewritten to match, so any character outside the set cleanly falls through to
the latin-ext face or the system font instead of rendering as a missing glyph.
The latin-ext files are left whole; browsers only fetch them when needed.

Run after changing page copy, then stamp and commit:
    python3 _tools/subset-fonts.py            # rebuild fonts + unicode-range
    python3 _tools/subset-fonts.py --check    # exit 1 if a page uses a character the fonts lack
    python3 _tools/stamp-assets.py            # site.css changed -> new ?v= hash
Needs fontTools (pip install fonttools brotli).
"""
import glob, html, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_tools', 'fonts-src')
OUT = os.path.join(ROOT, 'assets', 'fonts')
CSS = os.path.join(ROOT, 'assets', 'site.css')

# Google's "latin" subset — the only range these files ever covered.
GOOGLE_LATIN = [(0x0, 0xFF), (0x131, 0x131), (0x152, 0x153), (0x2BB, 0x2BC), (0x2C6, 0x2C6),
                (0x2DA, 0x2DA), (0x2DC, 0x2DC), (0x304, 0x304), (0x308, 0x308), (0x329, 0x329),
                (0x2000, 0x206F), (0x20AC, 0x20AC), (0x2122, 0x2122), (0x2191, 0x2191),
                (0x2193, 0x2193), (0x2212, 0x2212), (0x2215, 0x2215), (0xFEFF, 0xFEFF), (0xFFFD, 0xFFFD)]
ALWAYS = set(range(0x20, 0x7F)) | {0xA0, 0xA9, 0xB7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C,
                                    0x201D, 0x2022, 0x2026, 0x20AC, 0x2122}

def in_latin(c):
    return any(a <= c <= b for a, b in GOOGLE_LATIN)

def used_chars():
    text = ''
    for page in glob.glob(os.path.join(ROOT, '*.html')):
        s = open(page, encoding='utf-8').read()
        s = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', s, flags=re.S)
        text += html.unescape(re.sub(r'<[^>]+>', ' ', s))
    text += open(os.path.join(ROOT, 'assets', 'site.js'), encoding='utf-8').read()
    return {ord(c) for c in text if ord(c) >= 0x20 and in_latin(ord(c))}   # no control chars

def ranges(cps):
    cps = sorted(cps); out = []; start = prev = cps[0]
    for c in cps[1:]:
        if c != prev + 1:
            out.append((start, prev)); start = c
        prev = c
    out.append((start, prev))
    return ','.join(f'U+{a:04X}' if a == b else f'U+{a:04X}-{b:04X}' for a, b in out)

def current_set():
    m = re.search(r"-normal-latin\.woff2\) format\('woff2'\);unicode-range:([^}]+)}", open(CSS).read())
    got = set()
    for part in m.group(1).split(','):
        a, _, b = part.strip()[2:].partition('-')
        got |= set(range(int(a, 16), int(b or a, 16) + 1))
    return got

def main():
    if '--check' in sys.argv:
        missing = used_chars() - current_set()
        if missing:
            print('fonts lack:', ' '.join(f'{chr(c)!r} U+{c:04X}' for c in sorted(missing)),
                  '\n-> run python3 _tools/subset-fonts.py'); sys.exit(1)
        print('fonts cover every character the pages use'); return
    keep = used_chars() | ALWAYS
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as f:
        f.write(','.join(f'U+{c:04X}' for c in sorted(keep))); ufile = f.name
    before = after = 0
    for src in sorted(glob.glob(os.path.join(SRC, '*-latin.woff2'))):
        dst = os.path.join(OUT, os.path.basename(src))
        subprocess.run(['pyftsubset', src, f'--unicodes-file={ufile}', '--flavor=woff2',
                        '--layout-features=*', f'--output-file={dst}'], check=True)
        before += os.path.getsize(src); after += os.path.getsize(dst)
    os.unlink(ufile)
    css = open(CSS).read()
    css, n = re.subn(r"(-latin\.woff2\) format\('woff2'\);unicode-range:)[^}]+}", r'\g<1>' + ranges(keep) + '}', css)
    open(CSS, 'w').write(css)
    print(f'{len(keep)} characters kept; latin fonts {before/1024:.0f}KB -> {after/1024:.0f}KB; '
          f'unicode-range updated on {n} faces')

if __name__ == '__main__':
    main()
