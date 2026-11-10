/* ==================================================================
 * The signed-in fitter, and the shared helpers for signed-in pages.
 *
 * WHO is signed in comes from Supabase only: js/session.js reads the
 * fitter's own row from public.accounts and fills window.DC_USER
 * (first name, last name, company, tier, account number). Nothing about
 * the person is made up here any more.
 *
 * Still DEMO: products and prices come from data/products.json, and the
 * three starred favourites below are sample product ids until a
 * favourites table exists.
 * ================================================================== */
(function () {
  'use strict';

  window.DC_USER = {
    demo: false,
    firstName: '',
    lastName: '',
    business: '',
    accountNumber: '',               // lightspeed_code; empty until staff match the account
    barcodeValue: '',                // what the counter scanner reads (Code 128)
    tier: 'trade',                   // 'trade' | 'tradePlus' | 'tradeGold', set from the account
    // DEMO favourites, by product id in data/products.json
    favourites: [
      'dcf6c265-04e9-4d4c-acb8-b81c7ba22bd4', // 10mm PU Underlay
      '50ace893-8624-4991-a121-599e19b72c15', // Grippers - Dual Pin (True Grip)
      '8ac96fd1-e656-400e-ba5a-147626950104'  // Double Sided POLYESTER TAPE
    ]
  };

  /* Shared helpers for signed-in pages. Pages only ever show the
     price for the account's own tier. */
  var TIERS = {
    trade: { label: 'Trade', priceKey: 'price_trade' },
    tradePlus: { label: 'Trade Plus', priceKey: 'price_trade_plus' },
    tradeGold: { label: 'Trade Gold', priceKey: 'price_trade_gold' }
  };
  var UNITS = { 'm²': 'per m²', roll: 'per roll', pack: 'per pack', each: 'each' };

  window.DCAccount = {
    tier: function () { return TIERS[window.DC_USER.tier] || TIERS.trade; },
    initials: function () {
      var u = window.DC_USER;
      return ((u.firstName || '').charAt(0) + (u.lastName || '').charAt(0)).toUpperCase() || 'DC';
    },
    priceOf: function (product) { return product[this.tier().priceKey]; },
    unitLabel: function (unit) { return UNITS[unit] || unit; },
    money: function (n) { return '£' + Number(n).toFixed(2); },
    // Stock: only ever "In stock" or "Ring to check", never a number.
    // In stock means the trade counter figure is above zero; zero or a
    // negative figure (common in the Lightspeed export) means ring to check.
    inStock: function (product) { return Number(product.stock_trade_counter) > 0; },
    stockLabel: function (product) { return this.inStock(product) ? 'In stock' : 'Ring to check'; },

    // The counter's numbers live here, once. Swap the placeholders for the real numbers.
    counter: {
      phone: '[Phone]',
      whatsapp: '[WhatsApp]',
      telHref: function () { return 'tel:' + this.phone; },
      whatsappHref: function (message) {
        return 'https://wa.me/' + this.whatsapp + (message ? '?text=' + encodeURIComponent(message) : '');
      }
    },

    // Search: one shared matcher for every signed-in page. Matches every word
    // typed against name, category, brand, colours, sizes and product codes.
    searchIndex: function (products) {
      return products.map(function (p) {
        var opts = [];
        Object.keys(p.options || {}).forEach(function (k) { opts = opts.concat(p.options[k]); });
        return {
          p: p,
          name: p.name.toLowerCase(),
          hay: [p.name, p.category, p.subcategory, p.brand, opts.join(' '), (p.skus || []).join(' ')].join(' ').toLowerCase(),
          colours: (p.options && (p.options.Colour || p.options.Single)) || []
        };
      });
    },
    search: function (index, query, category) {
      var q = (query || '').trim().toLowerCase();
      var tokens = q ? q.split(/\s+/) : [];
      var hits = index.filter(function (r) {
        if (category && r.p.category !== category) return false;
        for (var i = 0; i < tokens.length; i++) if (r.hay.indexOf(tokens[i]) === -1) return false;
        return true;
      });
      if (q) {
        // Names that start with, then contain, the search come first; otherwise keep list order
        var rank = function (r) { var at = r.name.indexOf(q); return at === 0 ? 0 : at > 0 ? 1 : 2; };
        hits = hits.map(function (r, i) { return { r: r, k: rank(r), i: i }; })
          .sort(function (a, b) { return a.k - b.k || a.i - b.i; })
          .map(function (x) { return x.r; });
      }
      return hits;
    },
    // Waits until the signed-in fitter's tier is known (DC_READY from js/session.js),
    // so a price is never shown at the wrong tier
    ready: function () { return window.DC_READY || Promise.resolve(); },
    loadProducts: function () {
      if (!this._products) {
        this._products = this.ready().then(function () { return fetch('data/products.json', { cache: 'no-cache' }); }).then(function (r) {
          if (!r.ok) throw new Error('Could not load products');
          return r.json();
        });
      }
      return this._products;
    }
  };

  // Fill the account details into any signed-in page
  function fill() {
    var u = window.DC_USER, A = window.DCAccount;
    var set = function (sel, text) { document.querySelectorAll(sel).forEach(function (el) { el.textContent = text; }); };
    var full = (u.firstName + ' ' + u.lastName).trim();
    set('[data-user-first]', u.firstName);
    set('[data-user-fullname]', full);
    set('[data-user-business]', u.business || full);
    set('[data-user-account]', u.accountNumber || 'Account number coming soon');
    document.querySelectorAll('[data-user-account]').forEach(function (el) { el.classList.toggle('is-soon', !u.accountNumber); });
    document.querySelectorAll('[data-user-has-account]').forEach(function (el) { el.hidden = !u.accountNumber; });
    set('[data-user-tier]', A.tier().label);
    set('[data-user-initials]', A.initials());
    set('[data-fav-count]', u.favourites.length);
    document.querySelectorAll('[data-user-initials]').forEach(function (el) {
      el.setAttribute('aria-label', 'Your account, ' + full);
    });
  }
  window.DCAccount.fill = fill;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();
