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


  /* ---- booking forms: real submission ----
     Progressive enhancement. Without this file the form still POSTs natively to
     FormSubmit and lands on thanks.html. With it, we submit in the background so
     the visitor stays put — and we only ever claim success on a real 2xx. */
  document.querySelectorAll('form[data-book-form]').forEach(function (form) {
    var note = form.querySelector('.form-note');
    var btn = form.querySelector('button[type="submit"]');
    var mailto = '<a href="mailto:comedyrecordingsmehak@gmail.com">comedyrecordingsmehak@gmail.com</a>';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var endpoint = form.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/');
      var btnText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      if (note) { note.classList.remove('is-error'); note.textContent = 'Sending…'; }

      fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          if (data && String(data.success) === 'false') throw new Error(data.message || 'rejected');
          form.reset();
          if (btn) btn.textContent = 'Sent ✓';
          if (note) note.textContent = form.getAttribute('data-success') ||
            'Thank you — your note has landed. Mehak will reply within two working days.';
        })
        .catch(function () {
          // Never pretend it sent. Give the visitor a route that always works.
          if (btn) { btn.disabled = false; btn.textContent = btnText; }
          if (note) {
            note.classList.add('is-error');
            note.innerHTML = 'That didn\'t send — sorry. Please email ' + mailto + ' directly and it\'ll reach Mehak.';
          }
        });
    });
  });


  /* ---- share: deep-linkable cards + native share sheet ----
     Web pages cannot detect screenshots (no browser exposes that — it is a
     native-app-only API), so instead every video card and major section gets a
     real share affordance: navigator.share opens the OS sheet (WhatsApp,
     Instagram, anything installed), with clipboard copy as the fallback.
     Copying selected text also appends the source link. */
  (function () {
    var SITE = 'https://mehakmadan.in';

    function pageBase() {
      // Always share the canonical live URL, never localhost/file paths.
      var path = location.pathname.replace(/\/index\.html$/, '/');
      return SITE + (path === '/' ? '/' : path);
    }
    function slugify(t) {
      return (t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    }

    /* toast */
    var toast;
    function say(msg) {
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add('on');
      clearTimeout(toast._t);
      toast._t = setTimeout(function () { toast.classList.remove('on'); }, 2600);
    }

    function legacyCopy(text) {
      return new Promise(function (res, rej) {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        ok ? res() : rej(new Error('copy failed'));
      });
    }
    function copy(text) {
      // The async API needs a secure context and user activation; if it refuses
      // for any reason, fall through to the old execCommand path rather than
      // telling the visitor it failed.
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
          .catch(function () { return legacyCopy(text); });
      }
      return legacyCopy(text);
    }

    function share(title, url) {
      if (navigator.share) {
        navigator.share({ title: title, text: title, url: url })
          .catch(function () { /* user dismissed the sheet — say nothing */ });
        return;
      }
      copy(url).then(function () { say('Link copied — paste it anywhere'); })
               .catch(function () { say('Could not copy. The link is ' + url); });
    }

    function btn(label, cls) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.setAttribute('aria-label', label);
      b.title = label;
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.1c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 1 0-3-3c0 .24.04.47.09.7L8.04 9.81A3 3 0 1 0 6 15c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 2.92-2.9z"/></svg>';
      return b;
    }

    /* 1. video cards */
    document.querySelectorAll('.wcard').forEach(function (card, i) {
      var titleEl = card.querySelector('.wmeta b');
      var title = titleEl ? titleEl.textContent.trim() : 'Mehak Madan';
      var id = slugify(title) || ('clip-' + (i + 1));
      var wrap = document.createElement('div');
      wrap.className = 'shareable';
      wrap.id = id;
      card.parentNode.insertBefore(wrap, card);
      wrap.appendChild(card);

      var b = btn('Share “' + title + '”', 'share-btn');
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        share('Mehak Madan — ' + title, pageBase() + '#' + id);
      });
      wrap.appendChild(b);
    });

    /* 2. major sections */
    document.querySelectorAll('section[id] .section-head, section[id] .booking-grid > .reveal:first-child')
      .forEach(function (head) {
        var sec = head.closest('section[id]');
        if (!sec || sec.querySelector('.share-sec')) return;
        var h = head.querySelector('h2');
        var title = h ? h.textContent.trim().replace(/\s+/g, ' ') : document.title;
        var b = btn('Share this section', 'share-sec');
        b.appendChild(document.createTextNode('Share'));
        b.addEventListener('click', function () {
          share('Mehak Madan — ' + title, pageBase() + '#' + sec.id);
        });
        head.appendChild(b);
      });

    /* 3. copying text carries the source link with it */
    document.addEventListener('copy', function (e) {
      try {
        var sel = String(window.getSelection());
        if (sel.trim().length < 40) return;           // short copies stay clean
        if (!e.clipboardData) return;
        e.clipboardData.setData('text/plain', sel + '\n\n— Mehak Madan, ' + pageBase());
        e.preventDefault();
      } catch (err) { /* leave the native copy alone */ }
    });

    /* 4. arriving on a deep link highlights the item */
    if (location.hash.length > 1) {
      try {
        var t = document.querySelector(location.hash);
        if (t && t.classList.contains('shareable')) {
          t.classList.add('flash');
          setTimeout(function () { t.classList.remove('flash'); }, 2400);
        }
      } catch (err) {}
    }
  })();

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
