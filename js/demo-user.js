/* ==================================================================
 * DEMO USER: FAKE DATA. Craig Wilson and Wilson Flooring are made up.
 *
 * This file stands in for the signed-in fitter's account until the site
 * is wired to Supabase. Every signed-in page reads the account from
 * window.DC_USER and nowhere else, so swapping is one change here.
 *
 * SUPABASE LATER: replace this file with a small loader that reads the
 * signed-in user's row, e.g.
 *   const { data: { user } } = await supabase.auth.getUser()
 *   const { data } = await supabase.from('accounts')
 *     .select('first_name, last_name, business, account_number, tier, favourites')
 *     .eq('user_id', user.id).single()
 * and only ever fetch the price column for that account's tier.
 * ================================================================== */
(function () {
  'use strict';

  window.DC_USER = {
    demo: true,
    firstName: 'Craig',
    lastName: 'Wilson',
    business: 'Wilson Flooring',
    accountNumber: 'DC-1042',
    barcodeValue: 'DC1042',          // what the counter scanner reads (Code 128)
    tier: 'tradePlus',               // 'trade' | 'tradePlus' | 'tradeGold'
    // Starred favourites, by product id in data/products.json
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
    initials: function () { return (window.DC_USER.firstName[0] + window.DC_USER.lastName[0]).toUpperCase(); },
    priceOf: function (product) { return product[this.tier().priceKey]; },
    unitLabel: function (unit) { return UNITS[unit] || unit; },
    money: function (n) { return '£' + Number(n).toFixed(2); },
    // Lightspeed stock figures for the trade counter are not reliable yet,
    // so the app only shows a simple status, never a number.
    stockLabel: function (status) { return status === 'in_stock' ? 'In stock' : 'Ring to check'; },
    loadProducts: function () {
      if (!this._products) {
        this._products = fetch('data/products.json', { cache: 'no-cache' }).then(function (r) {
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
    set('[data-user-first]', u.firstName);
    set('[data-user-fullname]', u.firstName + ' ' + u.lastName);
    set('[data-user-business]', u.business);
    set('[data-user-account]', u.accountNumber);
    set('[data-user-tier]', A.tier().label);
    set('[data-user-initials]', A.initials());
    set('[data-fav-count]', u.favourites.length);
    document.querySelectorAll('[data-user-initials]').forEach(function (el) {
      el.setAttribute('aria-label', 'Your account, ' + u.firstName + ' ' + u.lastName);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();
