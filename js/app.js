/* DC Flooring trade: signed-in home screen.
   Greeting, product search, the trade card sheet and the home screen prompt.
   The account comes from window.DC_USER (js/demo-user.js). */
(function () {
  'use strict';

  var A = window.DCAccount;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- greeting ---------- */
  var hour = new Date().getHours();
  var greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  document.querySelectorAll('[data-greeting]').forEach(function (el) { el.textContent = greeting; });

  /* ---------- search ---------- */
  var input = document.getElementById('q');
  var list = document.getElementById('results');
  var count = document.getElementById('searchCount');
  var index = [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  A.loadProducts().then(function (products) {
    index = products.map(function (p) {
      var optionValues = [];
      Object.keys(p.options || {}).forEach(function (k) { optionValues = optionValues.concat(p.options[k]); });
      return {
        p: p,
        name: p.name.toLowerCase(),
        hay: [p.name, p.brand, p.category, p.subcategory, optionValues.join(' '), (p.skus || []).join(' ')].join(' ').toLowerCase(),
        colours: (p.options && (p.options.Colour || p.options.Single)) || []
      };
    });
    var rc = document.querySelector('[data-range-count]');
    if (rc) rc.textContent = products.length;
    if (input.value) run();
  }).catch(function () {
    count.textContent = 'Search is not available right now. Try again in a minute.';
  });

  function run() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { list.innerHTML = ''; count.textContent = ''; return; }
    var tokens = q.split(/\s+/);
    var hits = index.filter(function (r) {
      return tokens.every(function (t) { return r.hay.indexOf(t) > -1; });
    });
    hits.sort(function (a, b) {
      var as = a.name.indexOf(q) === 0 ? 0 : a.name.indexOf(q) > -1 ? 1 : 2;
      var bs = b.name.indexOf(q) === 0 ? 0 : b.name.indexOf(q) > -1 ? 1 : 2;
      return as - bs;
    });
    var shown = hits.slice(0, 8);
    count.textContent = hits.length
      ? (hits.length === 1 ? '1 match' : hits.length + ' matches') + (hits.length > shown.length ? ', showing the first ' + shown.length : '')
      : 'No matches for “' + input.value.trim() + '”. Try a colour, a brand or a code.';
    list.innerHTML = shown.map(function (r) {
      var p = r.p;
      // Say which colour matched, so "grey" shows the grey you were after
      var colour = '';
      tokens.forEach(function (t) {
        if (colour) return;
        r.colours.forEach(function (c) { if (!colour && c.toLowerCase().indexOf(t) > -1) colour = c; });
      });
      var meta = [p.brand, p.category].filter(Boolean).join(' · ');
      return '<li><a class="result" href="pricelist.html?range=' + encodeURIComponent(p.handle) + '">' +
        '<span class="result__main"><span class="result__name">' + esc(p.name) + '</span>' +
        '<span class="result__meta">' + esc(meta) + (colour ? ' · <span class="result__colour">' + esc(colour) + '</span>' : '') + '</span>' +
        '<span class="result__stock' + (p.stock_status === 'in_stock' ? ' is-in' : '') + '">' + A.stockLabel(p.stock_status) + '</span></span>' +
        '<span class="result__price"><span class="num">' + (p.price_from ? '<small>from </small>' : '') + A.money(A.priceOf(p)) + '</span>' +
        '<span class="result__unit">' + esc(A.unitLabel(p.unit)) + '</span></span></a></li>';
    }).join('');
  }
  input.addEventListener('input', run);
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    input.blur(); // drop the keyboard so the results are visible
  });

  /* ---------- trade card sheet ---------- */
  var dialog = document.getElementById('tradeCard');
  var panel = document.getElementById('sheetPanel');
  var openBtn = document.getElementById('showCard');
  var closeBtn = document.getElementById('closeCard');
  var drawn = false;
  var wakeLock = null;
  var EASE_SHEET = 'cubic-bezier(0.32, 0.72, 0, 1)';

  function drawBarcode() {
    if (drawn || !window.JsBarcode) return;
    window.JsBarcode('#barcode', window.DC_USER.barcodeValue, {
      format: 'CODE128', displayValue: false, margin: 0, height: 96, width: 3, background: '#FFFFFF', lineColor: '#0B0A09'
    });
    // Let the barcode scale to the panel's width without blurring
    var svg = document.getElementById('barcode');
    var w = svg.getAttribute('width'), h = svg.getAttribute('height');
    svg.setAttribute('viewBox', '0 0 ' + parseFloat(w) + ' ' + parseFloat(h));
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.removeAttribute('width'); svg.removeAttribute('height');
    drawn = true;
  }

  function animatePanel(from, to, duration, easing) {
    if (!panel.animate) { panel.style.transform = to; return { finished: Promise.resolve() }; }
    var a = panel.animate([{ transform: from }, { transform: to }], { duration: duration, easing: easing, fill: 'forwards' });
    return a;
  }
  function currentY() {
    var m = new DOMMatrixReadOnly(getComputedStyle(panel).transform);
    return m.m42 || 0;
  }

  function openCard() {
    drawBarcode();
    dialog.showModal();
    document.documentElement.classList.add('sheet-open');
    if (reduceMotion.matches) {
      panel.getAnimations().forEach(function (a) { a.cancel(); });
      panel.style.transform = 'none';
      dialog.animate && dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease' });
    } else {
      panel.style.transform = '';
      animatePanel('translateY(100%)', 'translateY(0)', 420, EASE_SHEET);
    }
    closeBtn.focus();
    // Keep the screen on while it is being scanned
    if (navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () {});
    }
  }

  function finishClose() {
    panel.getAnimations().forEach(function (a) { a.cancel(); });
    panel.style.transform = '';
    dialog.close();
    document.documentElement.classList.remove('sheet-open');
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
    openBtn.focus();
  }

  function closeCard(velocity) {
    if (!dialog.open) return;
    if (reduceMotion.matches || !panel.animate) {
      var fade = dialog.animate ? dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease' }) : null;
      if (fade) fade.finished.then(finishClose); else finishClose();
      return;
    }
    // Leave from wherever it is now, faster if it was flicked
    var y = currentY();
    var remaining = Math.max(panel.offsetHeight - y, 1);
    var ms = velocity ? Math.max(140, Math.min(300, remaining / velocity)) : 260;
    var a = animatePanel('translateY(' + y + 'px)', 'translateY(100%)', ms, 'cubic-bezier(0.32, 0.72, 0, 1)');
    a.finished.then(finishClose);
  }

  openBtn.addEventListener('click', openCard);
  closeBtn.addEventListener('click', function () { closeCard(); });
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeCard(); }); // Escape key

  // Swipe down to close: the card follows the finger 1:1, resists going up,
  // and a quick flick closes it even if it has not travelled far.
  var drag = null;
  panel.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.target.closest('button, a')) return;
    if (drag) return; // ignore a second finger
    drag = { id: e.pointerId, startY: e.clientY, baseY: currentY(), lastY: e.clientY, lastT: e.timeStamp, v: 0, moved: false };
    panel.getAnimations().forEach(function (a) { a.commitStyles && a.commitStyles(); a.cancel(); });
  });
  panel.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dy = e.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.abs(dy) < 8) return;
      drag.moved = true;
      panel.setPointerCapture(e.pointerId);
      panel.classList.add('is-dragging');
    }
    var y = drag.baseY + dy;
    if (y < 0) y = -Math.pow(-y, 0.7); // rubber-band upwards
    panel.style.transform = 'translateY(' + y + 'px)';
    var dt = e.timeStamp - drag.lastT;
    if (dt > 0) drag.v = (e.clientY - drag.lastY) / dt;
    drag.lastY = e.clientY; drag.lastT = e.timeStamp;
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    panel.classList.remove('is-dragging');
    if (!d.moved) return;
    var y = currentY();
    if (y > panel.offsetHeight * 0.25 || d.v > 0.5) {
      closeCard(Math.max(d.v, 0.6));
    } else {
      animatePanel('translateY(' + y + 'px)', 'translateY(0)', 300, 'cubic-bezier(0.23, 1, 0.32, 1)');
    }
  }
  panel.addEventListener('pointerup', endDrag);
  panel.addEventListener('pointercancel', endDrag);

  /* ---------- add to home screen prompt (shown once) ---------- */
  var KEY = 'dc-a2hs';
  var box = document.getElementById('a2hs');
  var how = document.getElementById('a2hsHow');
  var addBtn = document.getElementById('a2hsAdd');
  var deferred = null;
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return 'unavailable'; } }
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!standalone && !stored()) {
    how.textContent = isiOS
      ? 'Tap Share, then Add to Home Screen. It opens full screen, like an app.'
      : 'Use your browser menu, then Add to Home screen. It opens full screen, like an app.';
    box.hidden = false;
    store('shown'); // show it once
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (!box.hidden) { addBtn.hidden = false; how.textContent = 'It opens full screen, like an app.'; }
  });
  addBtn.addEventListener('click', function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; box.hidden = true; store('dismissed'); });
  });
  document.getElementById('a2hsClose').addEventListener('click', function () {
    box.hidden = true;
    store('dismissed');
  });
})();
