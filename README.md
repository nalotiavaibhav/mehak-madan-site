# Mehak Madan — Website

A full multi-page site for Mehak Madan, Bengaluru corporate stand-up comedian
and lifestyle manager. Built from the Claude Design "Home A" handoff, then
elevated into a premium, custom design system with real content and imagery.

## Design direction

**"Warm Editorial Playbill · Spotlight."** Warm cream paper, ink charcoal,
terracotta + marigold accents; Instrument Serif display, Albert Sans body,
Archivo labels. The memorable anchor is a warm **stage spotlight** that forms
each hero and recurs as a moving beam — most notably the home page's
*"one spotlight, two jobs"* Performer/Manager toggle, and the Comedy page's
interactive **Rundown** show-builder.

## Pages

```
index.html      Home — spotlight hero, proof, client strip, the Performer/Manager
                pivot (spotlight swings between them), topics, gallery, about &
                watch teasers, booking.
comedy.html     The Show — dark hero, the 60-min set + show rider, 8 topics,
                the interactive "Rundown" event-builder, why-it-works, proof
                (clients + venues), watch clips, booking.
lifestyle.html  The Manager — calm executive-trust register, services taxonomy,
                how-it-works, who-it's-for, consultation form.
about.html      About — story, stats, journey timeline, venues.
watch.html      Watch — viral reels grid, viral posts, YouTube.
assets/         site.css (design system), site.js (behaviour), lib/ (images).
```

## Run locally

```bash
cd site
python3 -m http.server 8000   # → http://localhost:8000
```

## Engineering notes

- **One design system, one visual language** across all five pages
  (`assets/site.css`), per the client UX brief. Strict type scale, shared
  header/footer, purpose-built (not reused) hero per page.
- **Progressive enhancement.** Everything works with JS disabled: content is
  visible by default, the pivot/rundown degrade to static, and a reveal
  *failsafe* guarantees above-the-fold content is never left invisible
  (the brief explicitly warns against fragile scroll-triggered blank states).
  All motion honours `prefers-reduced-motion`.
- **Fixed the broken logo wall.** The old hotlinked Wikimedia SVGs are replaced
  with a clean, consistent monochrome **text wordmark** strip — no more
  mismatched/broken logos.
- **Real HTML content**, never baked into images (dates, clients, topics, tour
  list are all selectable, accessible text).
- **Images** curated from `highrespics/` and optimised into `assets/lib/`.
- **Accessibility:** skip links, labelled + autocompleted forms, ARIA tabs on
  the pivot, `aria-pressed` on rundown cards, keyboard support, focus rings,
  landmark elements.

## Still to wire for production

- The contact forms are front-end only (inline confirmation). Point each
  `<form>` at an email service / endpoint to receive enquiries.
- Reel thumbnails currently reuse performance photos; swap for real video
  posters when available. Links go to the live Instagram/YouTube.
