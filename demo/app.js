/*
 * DC Flooring trade site DEMO: logic.
 * No frameworks, no build step, no network calls. State lives in localStorage.
 *
 * Anything marked "SUPABASE LATER" is the seam where a real Supabase call
 * would replace the localStorage code. The pages only call these functions,
 * so swapping them should not need page changes (apart from making them async).
 */
(function () {
  'use strict';

  var D = window.DC_DEMO_DATA;
  var R = window.DC_DEMO_RANGES;
  var KEYS = {
    state: 'dcDemo.state.v2',     // { accounts: [...] }
    session: 'dcDemo.session.v2', // { accountId }
    staff: 'dcDemo.staff.v2',     // { signedIn: true }
    viewAs: 'dcDemo.viewAs.v2'    // { tier }  demo only, see getEffectiveTier()
  };
  var STAFF_NAME = 'Staff member';

  /* ------------------------------------------------------------------
   * Storage helpers. localStorage can throw (private mode, blocked), so
   * fall back to memory for the life of the page.
   * ---------------------------------------------------------------- */
  var memory = {};
  function read(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return memory[key] || null;
    }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { memory[key] = value; }
  }
  function remove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    delete memory[key];
  }

  /* ------------------------------------------------------------------
   * Small formatting helpers
   * ---------------------------------------------------------------- */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatGBP(n, whole) {
    var opts = whole ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return '£' + Number(n).toLocaleString('en-GB', opts);
  }
  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function tierById(id) {
    for (var i = 0; i < D.TIERS.length; i++) if (D.TIERS[i].id === id) return D.TIERS[i];
    return null;
  }
  function tierLabel(id) { var t = tierById(id); return t ? t.label : ''; }

  /* ------------------------------------------------------------------
   * Accounts (customers and applications share one list; status tells them apart)
   * ---------------------------------------------------------------- */

  // SUPABASE LATER: replace with a select on the profiles/applications tables
  // (staff only, protected by row level security).
  function loadState() {
    var state = read(KEYS.state);
    if (!state || !Array.isArray(state.accounts)) {
      state = { accounts: D.makeSeedAccounts() };
      write(KEYS.state, state);
    }
    return state;
  }
  function saveState(state) { write(KEYS.state, state); }

  function getAccounts() { return loadState().accounts; }
  function getAccount(id) {
    var list = getAccounts();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ------------------------------------------------------------------
   * Customer auth
   * ---------------------------------------------------------------- */

  // SUPABASE LATER: replace with supabase.auth.getUser(), then fetch the matching
  // row from `profiles`. Return null unless the account is approved.
  function currentUser() {
    var session = read(KEYS.session);
    if (!session) return null;
    var account = getAccount(session.accountId);
    return account && account.status === 'approved' ? account : null;
  }

  // SUPABASE LATER: replace with supabase.auth.signInWithPassword (or a magic link).
  // The demo just trusts the dropdown. Only approved accounts get a session.
  // Returns { ok, status, account }.
  function signIn(accountId) {
    var account = getAccount(accountId);
    if (!account) return { ok: false, status: 'unknown', account: null };
    if (account.status === 'approved') { write(KEYS.session, { accountId: account.id }); remove(KEYS.viewAs); }
    return { ok: account.status === 'approved', status: account.status, account: account };
  }

  // SUPABASE LATER: supabase.auth.signOut()
  function signOut() { remove(KEYS.session); remove(KEYS.viewAs); }

  /* ------------------------------------------------------------------
   * Pricing
   * ---------------------------------------------------------------- */

  // SUPABASE LATER: replace with a query (or RPC) that returns ranges with only the
  // price column for the signed-in customer's tier, enforced by row level security so
  // other tiers' prices never reach the browser. In this demo all three tiers sit in
  // assets/data/ranges.js, but this function only ever hands one tier to the page.
  function priceRange(range, tier) {
    return {
      id: range.id, name: range.name, category: range.category, heroImage: range.heroImage,
      specs: range.specs, colourways: range.colourways, unit: range.unit, stock: range.stock,
      price: range.prices[tier]
    };
  }
  function getPricesForTier(tier) {
    if (!tierById(tier)) tier = 'trade';
    return R.ranges.map(function (r) { return priceRange(r, tier); });
  }
  // SUPABASE LATER: same query as above, filtered to one range id. Returns null if unknown.
  function getRange(id, tier) {
    if (!tierById(tier)) tier = 'trade';
    for (var i = 0; i < R.ranges.length; i++) if (R.ranges[i].id === id) return priceRange(R.ranges[i], tier);
    return null;
  }

  // DEMO ONLY: lets a viewer flip between tiers to compare prices ("Demo: view as").
  // There is no Supabase equivalent. Delete this and use user.tier when the demo becomes real.
  function getEffectiveTier(user) {
    var override = read(KEYS.viewAs);
    return override && tierById(override.tier) ? override.tier : user.tier;
  }
  function setViewAsTier(tier) { if (tierById(tier)) write(KEYS.viewAs, { tier: tier }); }

  // SUPABASE LATER: compute server-side (spend from orders, saving from the price tables).
  // `tier` is the tier being viewed (see getEffectiveTier). Returns info for the
  // "Your next tier" nudge, or { next: null } on the top tier.
  function getNextTier(user, tier) {
    tier = tier || user.tier;
    var index = D.TIERS.map(function (t) { return t.id; }).indexOf(tier);
    var next = D.TIERS[index + 1];
    if (!next) return { next: null };
    var spend = user.spendYtd || 0;
    var remaining = Math.max(0, next.minSpend - spend);
    var progress = Math.min(100, Math.round((spend / next.minSpend) * 100));
    var saved = 0;
    R.ranges.forEach(function (r) { saved += 1 - r.prices[next.id] / r.prices[tier]; });
    return {
      next: next,
      spend: spend,
      remaining: remaining,
      progress: progress,
      savingPercent: Math.round((saved / R.ranges.length) * 1000) / 10
    };
  }

  /* ------------------------------------------------------------------
   * Applications and staff actions
   * ---------------------------------------------------------------- */
  function newId(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // SUPABASE LATER: insert into `applications` with status 'pending'
  // (a public insert-only policy; no real email is sent here).
  function submitApplication(form) {
    var state = loadState();
    var account = {
      id: newId('a'),
      businessName: form.businessName, tradeType: form.tradeType, contactName: form.contactName,
      phone: form.phone, email: form.email, postcode: form.postcode, vat: form.vat || '',
      spend: form.spend, marketingOptIn: !!form.marketingOptIn, termsAccepted: !!form.termsAccepted,
      status: 'pending', tier: null, spendYtd: 0,
      idChecked: false, idCheckedDate: null, idCheckedBy: null, notes: '',
      appliedOn: new Date().toISOString(), decidedOn: null, source: 'application'
    };
    state.accounts.push(account);
    saveState(state);
    return account;
  }

  // SUPABASE LATER: a staff-only update (or RPC) setting status = 'approved', tier,
  // id_checked_at and checked_by, restricted by a staff role in row level security.
  // Staff must confirm the ID and proof of trade check first.
  // Returns { ok, error, account }.
  function approveApplication(id, details) {
    var state = loadState();
    var account = state.accounts.filter(function (a) { return a.id === id; })[0];
    if (!account) return { ok: false, error: 'Application not found.' };
    if (!tierById(details.tier)) return { ok: false, error: 'Choose a tier first.' };
    if (!details.idChecked) return { ok: false, error: 'Tick "ID and proof of trade checked" before approving.' };
    account.status = 'approved';
    account.tier = details.tier;
    account.idChecked = true;
    account.idCheckedDate = new Date().toISOString();
    account.idCheckedBy = STAFF_NAME;
    account.notes = details.notes || '';
    account.decidedOn = new Date().toISOString();
    saveState(state);
    return { ok: true, account: account };
  }

  // SUPABASE LATER: same staff-only update, status = 'rejected'.
  function rejectApplication(id, details) {
    var state = loadState();
    var account = state.accounts.filter(function (a) { return a.id === id; })[0];
    if (!account) return { ok: false, error: 'Application not found.' };
    account.status = 'rejected';
    account.tier = null;
    account.notes = (details && details.notes) || '';
    account.decidedOn = new Date().toISOString();
    saveState(state);
    return { ok: true, account: account };
  }

  // SUPABASE LATER: a staff-only insert into `applications` / `profiles`.
  // Walk-ins are checked in person, so staff can approve straight away.
  function addWalkIn(form, decision) {
    var account = submitApplication(form);
    account.source = 'walk-in';
    var state = loadState();
    state.accounts = state.accounts.map(function (a) { return a.id === account.id ? account : a; });
    saveState(state);
    if (decision && decision.approve) {
      var result = approveApplication(account.id, decision);
      if (!result.ok) {
        // Roll back so a failed approve does not leave a half-made account.
        var rollback = loadState();
        rollback.accounts = rollback.accounts.filter(function (a) { return a.id !== account.id; });
        saveState(rollback);
      }
      return result;
    }
    return { ok: true, account: account };
  }

  // Demo only. There is no Supabase equivalent; this just restores the seed data.
  function resetDemoData() {
    remove(KEYS.state);
    remove(KEYS.session);
    remove(KEYS.viewAs);
    loadState();
  }

  /* ------------------------------------------------------------------
   * Staff auth (fake: any password works)
   * ---------------------------------------------------------------- */

  // SUPABASE LATER: supabase.auth.signInWithPassword plus a `staff` role check.
  function staffSignIn() { write(KEYS.staff, { signedIn: true }); }
  function staffSignOut() { remove(KEYS.staff); }
  function isStaffSignedIn() { var s = read(KEYS.staff); return !!(s && s.signedIn); }

  /* ------------------------------------------------------------------
   * Shared UI helpers
   * ---------------------------------------------------------------- */

  var UNIT_LABEL = { 'm\u00b2': 'per m\u00b2', roll: 'per roll', each: 'each' };

  // A price with its unit and VAT status, e.g. "£11.40 per m² ex VAT".
  function priceHTML(price, unit) {
    return '<span class="price-block"><span class="price">' + formatGBP(price) + '</span> ' +
      '<span class="price-unit">' + esc(UNIT_LABEL[unit] || unit) + ' ex VAT</span></span>';
  }

  function unitLabel(unit) { return UNIT_LABEL[unit] || unit; }

  function stockText(stock) {
    if (stock.status === 'in_stock') return 'In stock, cut today';
    if (stock.status === 'order_in') return 'Order in ' + stock.leadDays + (stock.leadDays === 1 ? ' day' : ' days');
    return 'Out of stock';
  }
  function stockHTML(stock) {
    var cls = { in_stock: 'stock-in', order_in: 'stock-order', out_of_stock: 'stock-out' }[stock.status] || 'stock-out';
    return '<span class="stock ' + cls + '"><span class="dot" aria-hidden="true"></span>' + esc(stockText(stock)) + '</span>';
  }

  function swatchStyle(colourway) {
    var style = 'background-color:' + esc(colourway.hex);
    if (colourway.image) style += ';background-image:url(' + esc(colourway.image) + ');background-size:cover';
    return style;
  }
  function colourCount(n) { return n + (n === 1 ? ' colour' : ' colours'); }

  // Scannable list of ranges: table-style rows with thin borders.
  // options.link: rows open the range page (signed in). options.priceHead: column heading.
  function rangeRowsHTML(items, options) {
    options = options || {};
    var rows = items.map(function (r) {
      var inner =
        '<span class="swatch" style="' + swatchStyle(r.colourways[0]) + '"></span>' +
        '<span class="range-main"><span class="range-name">' + esc(r.name) + '</span>' +
        '<span class="range-sub">' + esc(r.category) + ' \u00b7 ' + r.specs.slice(0, 2).map(esc).join(' \u00b7 ') + ' \u00b7 ' + colourCount(r.colourways.length) + '</span></span>' +
        '<span class="range-price">' + priceHTML(r.price, r.unit) + '</span>' +
        '<span class="range-stock">' + stockHTML(r.stock) + '</span>';
      return '<li>' + (options.link
        ? '<a class="range-row" href="range.html?id=' + encodeURIComponent(r.id) + '">' + inner + '</a>'
        : '<div class="range-row">' + inner + '</div>') + '</li>';
    }).join('');
    return '<div class="range-table"><div class="range-head" aria-hidden="true"><span></span><span>Range</span><span>' +
      esc(options.priceHead || 'Your price') + '</span><span>Stock</span></div><ul class="range-list" aria-label="' + esc(options.caption || 'Ranges') + '">' + rows + '</ul></div>';
  }

  function tierBadge(id) {
    return '<span class="badge badge-' + esc(id) + '">' + esc(tierLabel(id)) + '</span>';
  }

  // DEMO ONLY: the "Demo: view as" tier switcher. Renders into `slot`; calls onChange(tierId).
  function renderTierSwitcher(slot, onChange) {
    var user = currentUser();
    if (!slot || !user) return;
    var current = getEffectiveTier(user);
    slot.innerHTML = '<div class="demo-switch"><span class="demo-switch-label" id="viewAsLabel">Demo: view as</span>' +
      '<div class="seg" role="radiogroup" aria-labelledby="viewAsLabel">' +
      D.TIERS.map(function (t) {
        return '<label class="seg-opt"><input type="radio" name="viewAs" value="' + t.id + '"' + (t.id === current ? ' checked' : '') + '><span>' + esc(t.label) + '</span></label>';
      }).join('') + '</div></div>';
    slot.onchange = function (event) {
      if (!event.target || event.target.name !== 'viewAs') return;
      setViewAsTier(event.target.value);
      onChange(event.target.value);
    };
  }

  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove('show'); }, 4000);
  }

  // Header links change depending on whether a customer is signed in.
  function renderAuthNav() {
    var slot = document.getElementById('authNav');
    if (!slot) return;
    var user = currentUser();
    slot.innerHTML = user
      ? '<a class="nav-link" href="pricelist.html">Price list</a><a class="btn btn-ghost btn-sm" href="index.html" id="navSignOut">Sign out</a>'
      : '<a class="nav-link" href="login.html">Sign in</a><a class="btn btn-primary btn-sm" href="apply.html">Apply</a>';
    var out = document.getElementById('navSignOut');
    // The link goes to the home page; clear the session first.
    if (out) out.addEventListener('click', function () { signOut(); });
  }

  // Links and buttons marked data-demo-stub are not part of this demo (guides, terms).
  function wireStubs() {
    document.addEventListener('click', function (event) {
      var stub = event.target.closest('[data-demo-stub]');
      if (!stub) return;
      event.preventDefault();
      toast(stub.getAttribute('data-demo-stub') || 'This is not part of the demo.');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderAuthNav();
    wireStubs();
  });

  window.DCDemo = {
    // logic
    currentUser: currentUser, signIn: signIn, signOut: signOut,
    getPricesForTier: getPricesForTier, getRange: getRange, getNextTier: getNextTier,
    getEffectiveTier: getEffectiveTier, setViewAsTier: setViewAsTier,
    getAccounts: getAccounts, getAccount: getAccount,
    submitApplication: submitApplication, approveApplication: approveApplication,
    rejectApplication: rejectApplication, addWalkIn: addWalkIn, resetDemoData: resetDemoData,
    staffSignIn: staffSignIn, staffSignOut: staffSignOut, isStaffSignedIn: isStaffSignedIn,
    // helpers
    esc: esc, formatGBP: formatGBP, formatDate: formatDate, tierLabel: tierLabel, tierBadge: tierBadge,
    rangeRowsHTML: rangeRowsHTML, unitLabel: unitLabel, priceHTML: priceHTML, stockHTML: stockHTML, stockText: stockText, swatchStyle: swatchStyle,
    colourCount: colourCount, renderTierSwitcher: renderTierSwitcher, toast: toast, renderAuthNav: renderAuthNav,
    STAFF_NAME: STAFF_NAME
  };
})();
