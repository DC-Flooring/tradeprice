/* DC Flooring trade: the price list.
   One question, answered fast: what is my price on X, and is it in stock?
   Search and the category chip filter the whole list, then it shows 50 rows at a
   time. Tapping a row opens its details in place; only one is open at a time.
   Prices are the account's own tier price from data/products.json, ex VAT.
   The front end never works out discounts: the tiers are already in the data. */
(function () {
  'use strict';

  var A = window.DCAccount;
  var PAGE = 50;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var input = document.getElementById('plQ');
  var clearBtn = document.getElementById('plClear');
  var chipsEl = document.getElementById('plChips');
  var countEl = document.getElementById('plCount');
  var listEl = document.getElementById('plList');
  var moreBtn = document.getElementById('plMore');
  var loadingEl = document.getElementById('plLoading');
  var emptyEl = document.getElementById('plEmpty');
  var errorEl = document.getElementById('plError');

  var index = [];        // every range, ready to search
  var categories = [];   // in the order they first appear in the data
  var results = [];      // the current filtered list
  var shown = 0;         // how many of the results are on screen
  var category = '';     // '' means All
  var openId = null;     // the one expanded row
  var pending = 0;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rowId(p) { return 'r-' + p.id; }

  /* ---------- load ---------- */
  function load() {
    loadingEl.hidden = false;
    errorEl.hidden = true;
    countEl.textContent = 'Loading your prices';
    A.loadProducts().then(function (products) {
      index = A.searchIndex(products);
      categories = [];
      products.forEach(function (p) { if (categories.indexOf(p.category) === -1) categories.push(p.category); });
      loadingEl.hidden = true;
      var focus = new URLSearchParams(window.location.search).get('range');
      apply(focus);
    }).catch(function () {
      A._products = null; // let Try again fetch afresh
      loadingEl.hidden = true;
      countEl.textContent = '';
      errorEl.hidden = false;
    });
  }
  document.getElementById('plRetry').addEventListener('click', load);

  /* ---------- filter ---------- */
  function apply(focusHandle) {
    var q = input.value;
    results = A.search(index, q, category);
    openId = null;
    shown = 0;
    listEl.innerHTML = '';
    renderChips(q);
    if (focusHandle) {
      // Arrived from search or Buy again on the home screen: open that range
      var at = -1;
      results.forEach(function (r, i) { if (at === -1 && r.p.handle === focusHandle) at = i; });
      if (at > -1) {
        renderMore(Math.ceil((at + 1) / PAGE) * PAGE);
        var item = document.getElementById(rowId(results[at].p));
        if (item) { toggle(item, true); item.scrollIntoView({ block: 'center' }); }
        updateCount(q);
        return;
      }
    }
    renderMore(PAGE);
    updateCount(q);
  }

  function updateCount(q) {
    var total = index.length;
    var trimmed = (q || '').trim();
    emptyEl.hidden = results.length > 0;
    if (!results.length) {
      document.getElementById('plEmptyTitle').textContent = trimmed
        ? 'Nothing matches “' + trimmed + '”' + (category ? ' in ' + category : '') + '.'
        : 'Nothing listed in ' + category + ' yet.';
      var ask = trimmed ? 'Hi, have you got ' + trimmed + '?' : 'Hi, what have you got in ' + category + '?';
      document.getElementById('plEmptyCall').href = A.counter.telHref();
      document.getElementById('plEmptyWa').href = A.counter.whatsappHref(ask);
      countEl.textContent = 'No matches';
      return;
    }
    if (!trimmed && !category) countEl.textContent = total + ' ranges';
    else countEl.textContent = results.length + (results.length === 1 ? ' match' : ' matches') + (category ? ' in ' + category : '');
  }

  function scheduleApply() {
    clearBtn.hidden = !input.value;
    if (pending) return;
    // One filter per frame, however fast they type
    pending = requestAnimationFrame(function () { pending = 0; apply(); });
  }
  input.addEventListener('input', scheduleApply);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; scheduleApply(); }
  });
  document.getElementById('plSearch').addEventListener('submit', function (e) { e.preventDefault(); input.blur(); });
  clearBtn.addEventListener('click', function () { input.value = ''; scheduleApply(); input.focus(); });

  /* ---------- chips ---------- */
  function renderChips(q) {
    // Counts follow the search, so a chip shows how many matches it holds
    var counts = {};
    var hits = A.search(index, q, '');
    hits.forEach(function (r) { counts[r.p.category] = (counts[r.p.category] || 0) + 1; });
    var html = chipHTML('', 'All', hits.length);
    categories.forEach(function (c) { html += chipHTML(c, c, counts[c] || 0); });
    chipsEl.innerHTML = html;
  }
  function chipHTML(value, label, n) {
    var on = value === category;
    return '<button class="pl-chip' + (on ? ' is-on' : '') + '" type="button" aria-pressed="' + on + '" data-cat="' + esc(value) + '">' +
      esc(label) + ' <span class="pl-chip__n num">' + n + '</span></button>';
  }
  chipsEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.pl-chip');
    if (!chip) return;
    var value = chip.getAttribute('data-cat');
    category = value === category ? '' : value; // tapping the active chip goes back to All
    apply();
    var active = chipsEl.querySelector('.pl-chip.is-on');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });

  /* ---------- rows ---------- */
  function rowHTML(p) {
    var id = rowId(p);
    var inStock = A.inStock(p);
    return '<li class="pl-item" id="' + id + '" data-id="' + esc(p.id) + '">' +
      '<button class="pl-row" type="button" aria-expanded="false" aria-controls="' + id + '-d" id="' + id + '-b">' +
        '<span class="pl-row__main">' +
          '<span class="pl-row__name">' + esc(p.name) + '</span>' +
          '<span class="pl-stock ' + (inStock ? 'is-in' : 'is-ring') + '">' + A.stockLabel(p) + '</span>' +
        '</span>' +
        '<span class="pl-row__price">' +
          '<span class="pl-price num">' + (p.price_from ? '<small>from</small>' : '') + A.money(A.priceOf(p)) + '</span>' +
          '<span class="pl-unit">' + esc(A.unitLabel(p.unit)) + ' · ex VAT</span>' +
        '</span>' +
      '</button>' +
    '</li>';
  }

  function renderMore(upTo) {
    var end = Math.min(results.length, Math.max(upTo || 0, shown + PAGE));
    if (end > shown) {
      var html = '';
      for (var i = shown; i < end; i++) html += rowHTML(results[i].p);
      listEl.insertAdjacentHTML('beforeend', html);
      shown = end;
    }
    var left = results.length - shown;
    moreBtn.hidden = left <= 0;
    moreBtn.textContent = 'Show more (' + left + ' left)';
  }
  moreBtn.addEventListener('click', function () {
    var firstNew = shown;
    renderMore(shown + PAGE);
    // Move focus to the first new row so keyboard and screen reader users carry on from there
    var row = listEl.children[firstNew] && listEl.children[firstNew].querySelector('.pl-row');
    if (row) row.focus({ preventScroll: true });
  });

  /* ---------- the expanded row ---------- */
  var OPTION_LABELS = { Width: 'Widths', Size: 'Sizes', Type: 'Comes as', Style: 'Style' };

  function fact(label, value) { return '<div><dt>' + esc(label) + '</dt><dd>' + value + '</dd></div>'; }

  function detailHTML(p) {
    var facts = '';
    var price = A.priceOf(p);
    // Optional pack and spec fields: only shown when the data has them
    if (p.packSize) facts += fact('Pack size', esc(p.packSize));
    if (p.m2PerPack) facts += fact('Per pack', '<span class="num">' + esc(p.m2PerPack) + '</span> m²');
    if (p.unit === 'pack') facts += fact('Price per pack', '<span class="num">' + A.money(price) + '</span> ex VAT');
    else if (p.m2PerPack && p.unit === 'm²') facts += fact('Price per pack', '<span class="num">' + A.money(price * Number(p.m2PerPack)) + '</span> ex VAT');
    if (p.thickness) facts += fact('Thickness', esc(p.thickness));
    if (p.wearLayer) facts += fact('Wear layer', esc(p.wearLayer));
    if (p.brand) facts += fact('Brand', esc(p.brand));
    Object.keys(p.options || {}).forEach(function (k) {
      var vals = p.options[k] || [];
      if (!vals.length) return;
      if (k === 'Colour' || k === 'Single') facts += fact('Colours', '<span class="num">' + vals.length + '</span>');
      else facts += fact(OPTION_LABELS[k] || k, esc(vals.join(', ')));
    });
    var note = p.price_from ? '<p class="pl-note">Lowest price shown. Cases and other options cost a bit more.</p>' : '';
    var ask = 'Hi, about ' + p.name + ': ';
    var spec = p.specSheetUrl
      ? '<a class="pl-spec" href="' + esc(p.specSheetUrl) + '" target="_blank" rel="noopener">Spec sheet<span class="sr-only"> for ' + esc(p.name) + ', opens in a new tab</span></a>'
      : '';
    return '<div class="pl-detail" id="' + rowId(p) + '-d" role="region" aria-labelledby="' + rowId(p) + '-b">' +
      '<div class="pl-detail__inner">' +
        (facts ? '<dl class="pl-facts">' + facts + '</dl>' : '') + note +
        '<div class="pl-contact">' +
          '<a class="counter-bar__btn" href="' + esc(A.counter.telHref()) + '">' +
            '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>Call</a>' +
          '<a class="counter-bar__btn" href="' + esc(A.counter.whatsappHref(ask)) + '">' +
            '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 20l1.3-3.9A9 9 0 1 1 7.9 19.7L3 20"/></svg>WhatsApp</a>' +
        '</div>' + spec +
      '</div></div>';
  }

  function productFor(item) {
    var id = item.getAttribute('data-id');
    for (var i = 0; i < results.length; i++) if (results[i].p.id === id) return results[i].p;
    return null;
  }

  function collapse(item) {
    var btn = item.querySelector('.pl-row');
    var d = item.querySelector('.pl-detail');
    btn.setAttribute('aria-expanded', 'false');
    item.classList.remove('is-open');
    if (!d) return;
    if (reduceMotion.matches) { d.remove(); return; }
    d.classList.remove('is-shown');
    var done = function () { if (!item.classList.contains('is-open')) d.remove(); };
    d.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 260); // in case the transition never fires
  }

  function toggle(item, forceOpen) {
    var opening = forceOpen || !item.classList.contains('is-open');
    // Keep the tapped row still on screen while another row above it closes
    var before = item.getBoundingClientRect().top;
    if (openId && openId !== item.id) {
      var prev = document.getElementById(openId);
      if (prev) {
        var d = prev.querySelector('.pl-detail');
        if (d) d.remove(); // close the other one at once so nothing jumps under the thumb
        prev.classList.remove('is-open');
        prev.querySelector('.pl-row').setAttribute('aria-expanded', 'false');
      }
      openId = null;
    }
    var shift = item.getBoundingClientRect().top - before;
    if (shift) window.scrollBy(0, shift);

    if (!opening) { collapse(item); openId = null; return; }
    var p = productFor(item);
    if (!p) return;
    item.insertAdjacentHTML('beforeend', detailHTML(p));
    item.classList.add('is-open');
    item.querySelector('.pl-row').setAttribute('aria-expanded', 'true');
    openId = item.id;
    var detail = item.querySelector('.pl-detail');
    if (reduceMotion.matches) { detail.classList.add('is-shown'); return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { detail.classList.add('is-shown'); }); });
  }

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.pl-row');
    if (!btn) return;
    toggle(btn.parentNode);
  });

  load();
})();
