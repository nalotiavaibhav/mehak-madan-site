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

  /* ---- smooth in-page anchors ----
     JS-driven rAF tween using instant steps. CSS `scroll-behavior:smooth` and
     `scrollIntoView({behavior:'smooth'})` are unreliable across environments;
     this works everywhere and honours prefers-reduced-motion. */
  function smoothScrollTo(el) {
    var destY = Math.max(0, window.scrollY + el.getBoundingClientRect().top - 78);
    var startY = window.scrollY;
    if (reduced) { window.scrollTo(0, destY); return; }
    try { window.scrollTo({ top: destY, behavior: 'smooth' }); }
    catch (e) { window.scrollTo(0, destY); return; }
    // Fallback: if the smooth scroll never started (e.g. rAF throttled), jump.
    setTimeout(function () {
      if (Math.abs(window.scrollY - startY) < 4 && Math.abs(window.scrollY - destY) > 4) {
        window.scrollTo(0, destY);
      }
    }, 320);
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var el = null;
      try { el = id.length > 1 ? document.querySelector(id) : null; } catch (err) { el = null; }
      if (el) {
        e.preventDefault();
        smoothScrollTo(el);
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
    // failsafe: anything already in (or near) the viewport at load reveals immediately,
    // so above-the-fold content is never left invisible.
    requestAnimationFrame(function () {
      revealEls.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('in');
      });
    });
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

  /* ---- Comedy "Rundown" show-builder (progressive enhancement) ---- */
  var rundown = document.querySelector('[data-rundown]');
  if (rundown) {
    var cards = rundown.querySelectorAll('.format-card');
    var glow = rundown.querySelector('.format-glow');
    var railList = rundown.querySelector('[data-rail]');
    var railEmpty = rundown.querySelector('[data-rail-empty]');
    var railBtn = rundown.querySelector('[data-rail-btn]');
    var grid = rundown.querySelector('.format-grid');
    var chosen = [];

    function place(card) {
      if (!glow || !grid) return;
      var g = grid.getBoundingClientRect(), c = card.getBoundingClientRect();
      glow.style.transform = 'translate(' + (c.left - g.left) + 'px,' + (c.top - g.top + c.height / 2 - 56) + 'px)';
      rundown.classList.add('armed');
    }
    function render() {
      if (!railList) return;
      railList.innerHTML = '';
      chosen.forEach(function (t, i) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="rn">' + ('0' + (i + 1)) + '</span><span>' + t + '</span>';
        railList.appendChild(li);
      });
      if (railEmpty) railEmpty.style.display = chosen.length ? 'none' : '';
      if (railBtn) railBtn.style.display = chosen.length ? '' : 'none';
    }
    if (railBtn) {
      railBtn.setAttribute('href', '#book');
      railBtn.addEventListener('click', function () {
        var box = document.getElementById('b-msg');
        if (box && chosen.length) box.value = 'My running order: ' + chosen.join(' · ');
        var sel = document.getElementById('b-type');
        if (sel) sel.value = 'Corporate stand-up show';
      });
    }
    cards.forEach(function (card) {
      var title = card.getAttribute('data-title');
      card.addEventListener('click', function () {
        var on = card.classList.toggle('on');
        card.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) { chosen.push(title); place(card); }
        else { chosen = chosen.filter(function (t) { return t !== title; }); }
        render();
      });
      card.addEventListener('mouseenter', function () { place(card); });
    });
    render();
  }

  /* ---- prefill booking message from a rundown link ---- */
  (function () {
    var m = /[#&?]rundown=([^&]+)/.exec(location.hash);
    var box = document.getElementById('b-msg');
    if (m && box) {
      box.value = 'My running order: ' + decodeURIComponent(m[1].replace(/\+/g, ' '));
      var sel = document.getElementById('b-type');
      if (sel) sel.value = 'Corporate stand-up show';
    }
  })();
})();
