/* DC Flooring trade: sign-in session, shared by every page that needs it.

   - client():          the one Supabase client (settings come from config.js)
   - normaliseMobile(): any UK mobile a fitter types, as +447xxxxxxxxx (or '' if not valid)
   - friendlyError():   turns any Supabase or network error into one plain message
   - loadAccount():     the signed-in fitter's own row from public.accounts
   - routeFor():        where an account should go: app, status screen or sign-up
   - guard():           on signed-in pages, checks the session and the account status,
                        then fills in the fitter's details and shows the page
   - signOut()

   Rules: never log phone numbers, codes or tokens; never show raw error text.
   Only the anon key is used. The service_role key must never be in this site. */
(function (root) {
  'use strict';

  /* ---------- pure helpers (also used by tests/session.test.js) ---------- */

  // Accepts 07xxx, 7xxx, +447xxx, 447xxx or 00447xxx, with or without spaces,
  // dashes, dots or brackets. Returns +447 followed by 9 digits, or ''.
  function normaliseMobile(input) {
    var n = String(input || '').replace(/[\s\-().]/g, '');
    var m;
    if ((m = n.match(/^\+447(\d{9})$/))) return '+447' + m[1];
    if ((m = n.match(/^00447(\d{9})$/))) return '+447' + m[1];
    if ((m = n.match(/^447(\d{9})$/))) return '+447' + m[1];
    if ((m = n.match(/^07(\d{9})$/))) return '+447' + m[1];
    if ((m = n.match(/^7(\d{9})$/))) return '+447' + m[1];
    return '';
  }

  // +447700900123 -> 07700 900123 (for showing back to the fitter only)
  function prettyMobile(e164) {
    if (!/^\+447\d{9}$/.test(e164 || '')) return '';
    var local = '0' + e164.slice(3);
    return local.slice(0, 5) + ' ' + local.slice(5);
  }

  // Sort any error into one of a few kinds, each with plain wording.
  // step is 'send' (asking for a code), 'verify' (checking a code) or 'data' (reading or saving the account).
  function friendlyError(error, step) {
    var status = error && typeof error.status === 'number' ? error.status : 0;
    var code = String((error && (error.code || error.error_code)) || '').toLowerCase();
    var msg = String((error && error.message) || '').toLowerCase();
    var name = String((error && error.name) || '');

    if (status === 429 || /rate_limit|too_many/.test(code) || /rate limit|too many/.test(msg)) {
      return { kind: 'rate', message: 'Too many tries. Wait a minute, then try again.' };
    }
    // Database errors carry a code but often no status, so check them before treating "no status" as no signal
    if (step === 'data' && (code === '23505' || /duplicate key/.test(msg))) {
      return { kind: 'duplicate', message: 'That mobile is already on an account. Give the counter a ring and we’ll sort it.' };
    }
    if ((!status && !code) || status >= 500 || name === 'AuthRetryableFetchError' || /fetch|network|failed to/.test(msg)) {
      return { kind: 'network', message: 'Couldn’t connect. Check your signal and try again.' };
    }
    if (step === 'send' && (/otp_disabled|signup_disabled|user_not_found/.test(code) || /signups not allowed|user not found/.test(msg))) {
      return { kind: 'unknown-number', message: 'We don’t recognise that number.' };
    }
    if (step === 'verify' && (status === 401 || status === 403 || /otp_expired|invalid|expired/.test(code + ' ' + msg))) {
      return { kind: 'bad-code', message: 'That code’s not right or has run out.' };
    }
    return { kind: 'other', message: 'Something went wrong. Try again, or give the counter a ring.' };
  }

  // Where an account belongs. No row means they still need to sign up.
  function routeFor(account) {
    if (!account) return 'apply.html?from=login';
    if (account.status === 'approved') return 'app.html';
    return 'account-status.html'; // pending, rejected or suspended
  }

  // Database tier names -> the names the site's price helpers use
  var TIER_FROM_DB = { trade: 'trade', trade_plus: 'tradePlus', trade_gold: 'tradeGold' };

  var pure = { normaliseMobile: normaliseMobile, prettyMobile: prettyMobile, friendlyError: friendlyError, routeFor: routeFor, TIER_FROM_DB: TIER_FROM_DB };
  if (typeof module !== 'undefined' && module.exports) { module.exports = pure; return; }

  /* ---------- browser ---------- */

  var cfg = root.DC_CONFIG || {};
  var _client = null;

  function configured() {
    return !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
      !/PASTE_/.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY) &&
      root.supabase && typeof root.supabase.createClient === 'function');
  }

  function client() {
    if (_client) return _client;
    if (!configured()) return null;
    _client = root.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'dc-trade-auth' }
    });
    return _client;
  }

  function currentUser() {
    var c = client();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (r) {
      return r && r.data && r.data.session ? r.data.session.user : null;
    });
  }

  // Only the columns the site needs. Never cost prices; there are none in this table.
  var ACCOUNT_COLUMNS = 'first_name, last_name, company_name, tier, status, lightspeed_code';
  function loadAccount(userId) {
    return client().from('accounts').select(ACCOUNT_COLUMNS).eq('id', userId).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }

  // Copy the account into the shape the rest of the site reads (window.DC_USER)
  function applyAccount(account) {
    var u = root.DC_USER || (root.DC_USER = {});
    u.demo = false;
    u.firstName = account.first_name || '';
    u.lastName = account.last_name || '';
    u.business = account.company_name || '';
    u.accountNumber = account.lightspeed_code || '';
    u.barcodeValue = account.lightspeed_code || '';
    u.tier = TIER_FROM_DB[account.tier] || 'trade';
    u.status = account.status;
    if (root.DCAccount && root.DCAccount.fill) root.DCAccount.fill();
  }

  function signOut(to) {
    var c = client();
    var done = function () {
      try { sessionStorage.clear(); } catch (e) { /* private mode */ }
      root.location.href = to || 'index.html';
    };
    if (!c) return done();
    return c.auth.signOut().then(done, done);
  }

  // Any [data-sign-out] button or link logs out first, then goes to its link (or the home page)
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-sign-out]');
    if (!el) return;
    e.preventDefault();
    if (el.disabled) return;
    el.disabled = true;
    el.setAttribute('aria-busy', 'true');
    signOut(el.getAttribute('href') || 'index.html');
  });

  /* On signed-in pages (<html class="auth-wait">): only approved fitters get in.
     Everything that needs the fitter's tier waits for DC_READY first. */
  var readyResolve;
  root.DC_READY = new Promise(function (res) { readyResolve = res; });

  function guard(options) {
    options = options || {};
    if (!configured()) { root.location.replace('login.html'); return; }
    currentUser().then(function (user) {
      if (!user) { root.location.replace('login.html'); return null; }
      return loadAccount(user.id).then(function (account) {
        if (options.allow) {
          // a page that shows any status (the account status screen)
          if (!account) { root.location.replace(routeFor(null)); return; }
          if (!options.allow(account)) { root.location.replace(routeFor(account)); return; }
        } else if (!account || account.status !== 'approved') {
          root.location.replace(routeFor(account));
          return;
        }
        applyAccount(account);
        document.documentElement.classList.remove('auth-wait');
        readyResolve(account);
      });
    }).catch(function () {
      // Could not reach Supabase: say so plainly rather than show someone else's details
      document.documentElement.classList.remove('auth-wait');
      document.documentElement.classList.add('auth-offline');
      var main = document.getElementById('main');
      if (main) {
        main.innerHTML = '<div class="narrow apply"><h1 class="page-title">No signal?</h1>' +
          '<p class="page-lede">We couldn’t load your account. Check your signal and try again.</p>' +
          '<div class="account-actions"><button class="btn btn--gold btn--lg btn--block" type="button" onclick="location.reload()">Try again</button></div></div>';
      }
    });
  }

  root.DCSession = {
    configured: configured,
    client: client,
    currentUser: currentUser,
    loadAccount: loadAccount,
    applyAccount: applyAccount,
    normaliseMobile: normaliseMobile,
    prettyMobile: prettyMobile,
    friendlyError: friendlyError,
    routeFor: routeFor,
    guard: guard,
    signOut: signOut
  };

  if (document.documentElement.classList.contains('auth-wait')) {
    var allow = document.documentElement.getAttribute('data-auth-allow');
    guard(allow === 'any-status' ? { allow: function () { return true; } } : {});
  }
})(typeof window !== 'undefined' ? window : globalThis);
