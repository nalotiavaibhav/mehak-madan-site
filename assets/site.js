/* Mehak Madan — shared site behaviour. All progressive enhancement:
   the page is fully usable, visible, and navigable with this file absent. */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // mark JS available (enables reveal animations that are otherwise no-ops)
  root.classList.add('js');

  /* ---- mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---- smooth scroll (Lenis if present) ---- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ autoRaf: true });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        var el = document.querySelector(id);
        if (lenis) lenis.scrollTo(el, { offset: -72, duration: 1.1 });
        else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        history.replaceState(null, '', id);
      }
    });
  });

  /* ---- scroll reveals ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- stat count-up ---- */
  var stats = document.querySelectorAll('[data-count]');
  if (stats.length && 'IntersectionObserver' in window && !reduced) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1100, 1);
          el.firstChild.nodeValue = Math.round((1 - Math.pow(1 - p, 3)) * target).toString();
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        so.unobserve(el);
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { so.observe(el); });
  }

  /* ---- spotlight-swing pivot (the anchor) ---- */
  var pivot = document.querySelector('[data-pivot]');
  if (pivot) {
    var tabs = pivot.querySelectorAll('[role="tab"]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var which = tab.getAttribute('data-target'); // 'stage' | 'manager'
        pivot.setAttribute('data-active', which);
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
        });
      });
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var arr = Array.prototype.slice.call(tabs);
        var i = arr.indexOf(tab);
        var next = arr[(i + (e.key === 'ArrowRight' ? 1 : arr.length - 1)) % arr.length];
        next.focus(); next.click();
      });
    });
  }
})();
