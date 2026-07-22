# Mehak Madan — Website (Home A)

Production implementation of the **Home A** design from the Claude Design handoff
(`Mehak Madan — Comedian Website`). Single-page marketing site for a corporate
stand-up comedian & lifestyle manager.

## Structure

```
site/
├── index.html      # the full page — inline CSS + JS, no build step
├── assets/         # local images (hero, gallery, about, watch thumbnails)
└── README.md
```

## Run locally

It's a static site — open `index.html` directly, or serve it:

```bash
cd site
python3 -m http.server 8000
# → http://localhost:8000
```

## Notes / decisions

- **Faithful to Home A.** Layout, type scale, colour tokens and copy match the
  prototype exactly. The A/B/C variant switcher and Claude Design tooling
  attributes (`data-screen-label`, `data-comment-anchor`) were dropped — those
  are design-review artifacts, not part of the shipped page.
- **External dependencies:** Google Fonts (Instrument Serif / Albert Sans /
  Archivo) and the Lenis smooth-scroll library via CDN. Client logos load from
  Wikimedia with a styled text fallback (`onerror`) if a request fails.
- **Progressive enhancement:** smooth scroll and the logo marquee are JS
  enhancements; the page is fully readable and navigable without JS, and both
  respect `prefers-reduced-motion`.
- **Images optimised:** `corporate-group.jpg` and `hosting-aisle.jpg` were
  resized from 4032px/~6.5MB originals to 1800px/~0.6MB for web.
- **Contact form** is front-end only (shows a confirmation message). Wire the
  `<form>` to an email service or backend endpoint to receive real enquiries.
- **Accessibility:** skip link, labelled form fields with autocomplete,
  `aria-hidden` on decorative SVGs, and landmark elements.
```
