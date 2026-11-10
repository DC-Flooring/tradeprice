/* DC Flooring trade: the Offers strip on the signed-in home.

   data/offers.json is an array of offers:
     { productId, offerPrice (ex VAT, one price for every tier), endDate (YYYY-MM-DD),
       image (file path), hook (optional short line), demoNote (optional) }

   The parts are kept apart on purpose:
     loadOffers()      fetches the two data files
     offerStatus() /
     isOfferLive()     PURE: decide if an offer can be shown to this fitter right now
     endsLabel()       PURE: "Ends today" or "Ends Sun 15 Nov"
     renderOffers()    builds the cards
   The pure parts also run in Node for tests/offers.test.js.

   SUPABASE LATER: offers will come from a table staff edit; only loadOffers() changes. */
(function (root) {
  'use strict';

  var UK = 'Europe/London';
  var ukDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: UK, year: 'numeric', month: '2-digit', day: '2-digit' });
  var endFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

  /* Today's date in the UK as YYYY-MM-DD, whatever the phone's own time zone. */
  function ukDateString(now) {
    return ukDateFmt.format(now); // en-CA gives YYYY-MM-DD
  }

  function validIsoDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  }

  /* PURE. Why an offer can or cannot be shown.
     - An offer runs to the end of its endDate in UK time, so one ending Sunday
       stays live all of Sunday and goes at midnight UK time.
     - Never show a worse price than the fitter's normal tier price.
     Returns 'ok' | 'bad-data' | 'no-product' | 'expired' | 'worse-price'. */
  function offerStatus(offer, product, tierPrice, now) {
    if (!offer || typeof offer.offerPrice !== 'number' || !(offer.offerPrice > 0) || !validIsoDate(offer.endDate)) return 'bad-data';
    if (!product) return 'no-product';
    if (ukDateString(now) > offer.endDate) return 'expired';
    if (typeof tierPrice !== 'number' || offer.offerPrice > tierPrice) return 'worse-price';
    return 'ok';
  }

  /* PURE. True when this offer can be shown to this fitter right now. */
  function isOfferLive(offer, product, tierPrice, now) {
    return offerStatus(offer, product, tierPrice, now) === 'ok';
  }

  /* PURE. "Ends today" on the last day (UK time), otherwise "Ends Sun 15 Nov". */
  function endsLabel(endDate, now) {
    if (ukDateString(now) === endDate) return 'Ends today';
    return 'Ends ' + endFmt.format(new Date(endDate + 'T00:00:00Z')).replace(',', '');
  }

  /* ---------- browser only below ---------- */

  function loadOffers() {
    return Promise.all([
      fetch('data/offers.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('Could not load offers');
        return r.json();
      }),
      root.DCAccount.loadProducts()
    ]);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Pick the offers this fitter can see, in file order, at most 3. Warns about bad ones. */
  function liveOffers(offers, products, now) {
    var A = root.DCAccount;
    var byId = {};
    products.forEach(function (p) { byId[p.id] = p; });
    var out = [];
    (Array.isArray(offers) ? offers : []).forEach(function (o) {
      var p = byId[o && o.productId];
      var tierPrice = p ? A.priceOf(p) : undefined;
      var status = offerStatus(o, p, tierPrice, now);
      if (status === 'no-product') console.warn('Offer skipped: no product with productId ' + o.productId);
      else if (status === 'worse-price') console.warn('Offer hidden: offer price is higher than this fitter\'s tier price for productId ' + o.productId);
      else if (status === 'bad-data') console.warn('Offer skipped: missing or bad offerPrice or endDate for productId ' + (o && o.productId));
      if (status === 'ok') out.push({ offer: o, product: p, tierPrice: tierPrice });
    });
    return out.slice(0, 3);
  }

  function cardHTML(item, now) {
    var A = root.DCAccount;
    var o = item.offer, p = item.product;
    var unit = A.unitLabel(p.unit);
    var showWas = o.offerPrice < item.tierPrice; // strike-through only when it really is cheaper
    return '<li class="offer-card-wrap">' +
      '<a class="offer-card" href="pricelist.html?range=' + encodeURIComponent(p.handle) + '">' +
        '<span class="offer-card__photo">' +
          (o.image ? '<img src="' + esc(o.image) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">' : '') +
          '<span class="offer-card__tag">' + esc(p.category) + '</span>' +
        '</span>' +
        '<span class="offer-card__body">' +
          '<span class="offer-card__name">' + esc(p.name) + '</span>' +
          (o.hook ? '<span class="offer-card__hook">' + esc(o.hook) + '</span>' : '') +
          '<span class="offer-card__prices">' +
            (showWas ? '<span class="offer-card__was"><s><span class="sr-only">Your normal price </span><span class="num">' + A.money(item.tierPrice) + '</span></s> <small>' + esc(unit) + ' · ex VAT</small></span>' : '') +
            '<span class="offer-card__now num"><span class="sr-only">Offer price </span>' + A.money(o.offerPrice) + '</span>' +
            (showWas ? '' : '<small class="offer-card__unit">' + esc(unit) + ' · ex VAT</small>') +
          '</span>' +
          '<span class="offer-card__ends">' + esc(endsLabel(o.endDate, now)) + '</span>' +
        '</span>' +
      '</a></li>';
  }

  function renderOffers(section, items, now) {
    if (!items.length) { section.hidden = true; return; } // nothing live: no heading, nothing
    var row = section.querySelector('.week__row');
    row.innerHTML = items.map(function (it) { return cardHTML(it, now); }).join('');
    // A missing photo becomes a plain dark box, never a broken image icon
    row.querySelectorAll('.offer-card__photo img').forEach(function (img) {
      var fail = function () { img.parentNode.classList.add('is-missing'); img.remove(); };
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
      else img.addEventListener('error', fail, { once: true });
    });
    section.hidden = false;
  }

  function init() {
    var section = document.getElementById('weekOffers');
    if (!section) return;
    var now = new Date();
    loadOffers().then(function (res) {
      renderOffers(section, liveOffers(res[0], res[1], now), now);
    }).catch(function (e) {
      section.hidden = true;
      console.warn('Offers not shown: ' + e.message);
    });
  }

  var api = { ukDateString: ukDateString, offerStatus: offerStatus, isOfferLive: isOfferLive, endsLabel: endsLabel,
    loadOffers: loadOffers, liveOffers: liveOffers, renderOffers: renderOffers };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.DCOffers = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
