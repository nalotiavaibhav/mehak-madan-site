#!/usr/bin/env python3
"""Cache-bust assets/site.css and assets/site.js across every page.

GitHub Pages serves everything with max-age=600 and allows no custom headers, so
a browser that already holds site.css keeps using it after a deploy. Stamping each
reference with a content hash (site.css?v=1a2b3c4d) gives every change a new URL,
so the next page load always fetches it. Unchanged files keep their hash, so
visitors still get cache hits between deploys.

Run whenever site.css or site.js changes, before committing:
    python3 _tools/stamp-assets.py          # rewrite references
    python3 _tools/stamp-assets.py --check  # exit 1 if any reference is stale

Lives in an _underscore dir so Jekyll leaves it out of the published site.
"""
import glob, hashlib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = ('assets/site.css', 'assets/site.js')

def digest(rel):
    with open(os.path.join(ROOT, rel), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]

def main(check):
    want = {a: digest(a) for a in ASSETS}
    stale = []
    for page in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
        src = open(page, encoding='utf-8').read()
        out = src
        for asset, h in want.items():
            # matches assets/site.css, /assets/site.css, with or without an old ?v=
            pat = re.compile(r'((?:/)?' + re.escape(asset) + r')(\?v=[0-9a-f]+)?(?=")')
            for m in pat.finditer(src):
                if m.group(2) != '?v=' + h:
                    stale.append(f'{os.path.basename(page)}: {m.group(0)} -> ?v={h}')
            out = pat.sub(lambda m: m.group(1) + '?v=' + h, out)
        if out != src and not check:
            open(page, 'w', encoding='utf-8').write(out)
    for line in stale:
        print(('STALE  ' if check else 'stamped ') + line)
    if check and stale:
        sys.exit(1)
    if not stale:
        print('all asset references current:', ', '.join(f'{a}?v={h}' for a, h in want.items()))

if __name__ == '__main__':
    main('--check' in sys.argv)
