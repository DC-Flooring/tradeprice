/* DC Flooring trade: staff screens (Home and Customers). The UI only: every Supabase call is
   in staff-api.js. Log in is the same mobile + code flow as fitters
   (js/login-flow.js). After log in we ask the database am_i_staff(); anyone
   else sees "This area is for DC staff" and no account data is loaded.
   Never logs phone numbers, codes, passwords or tokens. */
(function () {
  'use strict';

  var API = window.StaffAPI, S = window.DCSession, O = window.DCOtp;
  var $ = function (id) { return document.getElementById(id); };

  var TIERS = { trade: 'Trade', trade_plus: 'Trade Plus', trade_gold: 'Trade Gold' };
  var STATUS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended' };
  var ID_CHECK = { not_started: 'Not started', passed: 'Passed', failed: 'Failed', skipped: 'Skipped' };
  var MESSAGES = {
    'network': 'Couldn’t connect. Check your connection and try again.',
    'not-allowed': 'You don’t have permission to do that.',
    'not-allowed-value': 'One of those values isn’t allowed. Check and try again.',
    'not-found': 'That account couldn’t be found. It may have been removed.',
    'bad-login': 'That email or password isn’t right.',
    'rate': 'Too many tries. Wait a minute, then try again.',
    'code-taken': 'That Lightspeed code is already on another account.',
    'duplicate': 'That value is already used on another account.',
    'other': 'Something went wrong. Try again.'
  };
  function message(kind) { return MESSAGES[kind] || MESSAGES.other; }

  var accounts = [];
  var filter = 'pending';
  var selectedId = null;
  var staffUserId = null;
  var isStaff = false;
  var staffNames = {};          // staff id -> name, for "who did what"
  var notesFor = {};            // account id -> notes as last loaded from the database
  var panelLoad = 0;            // ignores slow answers for an account no longer on screen

  /* ---------- views ---------- */
  function show(view) {
    ['loginView', 'notStaffView', 'errorView', 'homeView', 'appView'].forEach(function (v) { $(v).hidden = v !== view; });
    $('userBar').hidden = view === 'loginView';
    $('stNav').hidden = !(view === 'homeView' || view === 'appView');
    document.querySelectorAll('.st-nav__link').forEach(function (a) {
      var on = (a.getAttribute('data-route') === 'home') === (view === 'homeView');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* #customers shows the Customers screen; anything else is Home */
  function route(moveFocus) {
    if (!isStaff) return;
    var customers = window.location.hash === '#customers';
    show(customers ? 'appView' : 'homeView');
    if (moveFocus) $(customers ? 'customers-title' : 'home-title').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { route(true); });
  $('reloadBtn').addEventListener('click', function () { window.location.reload(); });

  /* ---------- access ---------- */
  function afterSignIn(user) {
    staffUserId = user.id;
    $('whoAmI').textContent = 'Signed in';
    return API.amIStaff().then(function (r) {
      if (r.error) { $('errorText').textContent = message(r.error); show('errorView'); return; }
      if (!r.data) { show('notStaffView'); return; }   // not staff: load nothing
      isStaff = true;
      $('whoAmI').textContent = user.email ? 'Signed in as ' + user.email : 'Signed in as staff';
      route(false);
      loadHomeCounts();
      return Promise.all([loadStaffNames(), loadList()]).then(renderHome);
    });
  }

  /* ---------- log in: email + password ---------- */
  var loginForm = $('loginForm'), loginBtn = $('loginBtn');
  var emailInput = $('f-email'), passwordInput = $('f-password');

  function loginFieldError(input, el, text) {
    el.textContent = text;
    el.hidden = !text;
    if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function loginError(text) { $('e-login').textContent = text; $('e-login').hidden = !text; }
  function clearLoginErrors() {
    loginFieldError(emailInput, $('e-email'), '');
    loginFieldError(passwordInput, $('e-password'), '');
    loginError('');
  }
  [emailInput, passwordInput].forEach(function (input) {
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') loginFieldError(input, $(input === emailInput ? 'e-email' : 'e-password'), '');
      loginError('');
    });
  });

  $('showPassword').addEventListener('click', function () {
    var showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    this.textContent = showing ? 'Show' : 'Hide';
    this.setAttribute('aria-pressed', String(!showing));
    this.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (loginBtn.disabled) return;
    clearLoginErrors();
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    if (!email) { loginFieldError(emailInput, $('e-email'), 'Enter your email'); emailInput.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { loginFieldError(emailInput, $('e-email'), 'That doesn’t look like an email address'); emailInput.focus(); return; }
    if (!password) { loginFieldError(passwordInput, $('e-password'), 'Enter your password'); passwordInput.focus(); return; }
    setBusy(loginBtn, true, 'Logging in');
    API.signIn(email, password).then(function (r) {
      if (r.error) {
        setBusy(loginBtn, false);
        loginError(message(r.error));
        if (r.error === 'bad-login') { passwordInput.value = ''; passwordInput.focus(); }
        return;
      }
      passwordInput.value = '';
      return afterSignIn(r.data).then(function () { setBusy(loginBtn, false); });
    });
  });

  show('loginView');
  if (!S.configured()) {
    $('loginNote').textContent = 'Sign in isn’t switched on yet.';
    $('loginNote').hidden = false;
    loginBtn.disabled = true;
  } else {
    S.currentUser().then(function (user) { if (user) return afterSignIn(user); }).catch(function () {});
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  var dateTimeFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  function date(iso) { return iso ? dateFmt.format(new Date(iso)) : ''; }
  function dateTime(iso) { return iso ? dateTimeFmt.format(new Date(iso)) : ''; }
  function fullName(a) { return ((a.first_name || '') + ' ' + (a.last_name || '')).trim(); }
  function setBusy(btn, on, label) { O.buttonBusy(btn, on, label); }
  function byId(id) { for (var i = 0; i < accounts.length; i++) if (accounts[i].id === id) return accounts[i]; return null; }

  /* ---------- home ---------- */
  function loadStaffNames() {
    return API.listStaff().then(function (r) {
      (r.data || []).forEach(function (s) { staffNames[s.id] = s.name || ''; });
    });
  }
  function renderHome() {
    var h = new Date().getHours();
    $('homeGreeting').textContent = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
    var first = String(staffNames[staffUserId] || '').trim().split(/\s+/)[0];
    $('homeName').textContent = first ? ', ' + first : '';
    var count = function (st) { return accounts.filter(function (a) { return a.status === st; }).length; };
    $('statPending').textContent = $('tilePending').textContent = count('pending');
    $('statApproved').textContent = count('approved');
    $('statOther').textContent = count('rejected') + count('suspended');
  }
  /* What fitters see today: the ranges and live offers the site is showing */
  function loadHomeCounts() {
    var get = function (url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); };
    get('../data/products.json').then(function (list) { $('tileRanges').textContent = Array.isArray(list) ? list.length : 0; });
    get('../data/offers.json').then(function (list) {
      var d = new Date(), today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      $('tileOffers').textContent = Array.isArray(list) ? list.filter(function (o) { return !o.endDate || o.endDate >= today; }).length : 0;
    });
  }

  /* Who did something, in plain words */
  function whoDid(id, account) {
    if (!id) return 'Supabase dashboard';
    if (id === staffUserId) return staffNames[id] ? staffNames[id] + ' (you)' : 'You';
    if (account && id === account.id) return 'The fitter';
    return staffNames[id] || 'Another staff member';
  }

  /* ---------- list ---------- */
  function loadList() {
    $('listCount').textContent = 'Loading accounts';
    return API.listAccounts().then(function (r) {
      if (r.error) { $('listCount').textContent = message(r.error); return; }
      accounts = r.data || [];
      renderList();
      renderHome();
      if (selectedId) renderPanel();
    });
  }

  function matches(a, q) {
    if (!q) return true;
    var digits = q.replace(/\D/g, '');
    var hay = [fullName(a), a.company_name, a.lightspeed_code].join(' ').toLowerCase();
    if (hay.indexOf(q) > -1) return true;
    if (digits.length >= 3 && a.mobile) {
      // match 07..., 7... or +447... against the stored +447...
      var m = a.mobile.replace(/\D/g, ''), local = '0' + m.slice(2);
      return m.indexOf(digits) > -1 || local.indexOf(digits) > -1;
    }
    return false;
  }

  function renderList() {
    var q = $('stSearch').value.trim().toLowerCase();
    var pending = accounts.filter(function (a) { return a.status === 'pending'; }).length;
    $('pendingCount').textContent = pending;
    var shown = accounts.filter(function (a) {
      return (filter === 'all' || a.status === filter) && matches(a, q);
    });
    $('listCount').textContent = shown.length === 1 ? '1 account' : shown.length + ' accounts';
    $('rows').innerHTML = shown.length ? shown.map(function (a) {
      return '<li><button class="st-row' + (a.id === selectedId ? ' is-selected' : '') + '" type="button" data-id="' + esc(a.id) + '"' +
        (a.id === selectedId ? ' aria-current="true"' : '') + '>' +
        '<span class="st-row__main"><span class="st-row__name">' + esc(fullName(a) || 'No name') + '</span>' +
        '<span class="st-row__company">' + esc(a.company_name || 'No company') + '</span></span>' +
        '<span class="st-row__side"><span class="st-tag st-tag--' + esc(a.status) + '">' + esc(STATUS[a.status] || a.status) + '</span>' +
        '<span class="st-row__date">' + esc(date(a.created_at)) + '</span></span>' +
        '</button></li>';
    }).join('') : '<li class="st-none">No accounts here.</li>';
  }

  document.querySelector('.st-filters').addEventListener('click', function (e) {
    var b = e.target.closest('.st-filter');
    if (!b) return;
    filter = b.getAttribute('data-filter');
    document.querySelectorAll('.st-filter').forEach(function (x) {
      var on = x === b;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-pressed', String(on));
    });
    renderList();
  });
  $('stSearch').addEventListener('input', renderList);
  $('rows').addEventListener('click', function (e) {
    var b = e.target.closest('.st-row');
    if (!b) return;
    selectedId = b.getAttribute('data-id');
    renderList();
    renderPanel();
    $('panel').focus({ preventScroll: true });
  });

  /* ---------- panel ---------- */
  function renderPanel() {
    var a = byId(selectedId);
    $('panelEmpty').hidden = !!a;
    $('panelBody').hidden = !a;
    if (!a) return;
    $('pName').textContent = fullName(a) || 'No name';
    $('pCompany').textContent = a.company_name || 'No company';
    var tag = $('pStatus');
    tag.textContent = STATUS[a.status] || a.status;
    tag.className = 'st-tag st-tag--' + a.status;
    $('pMobile').textContent = S.prettyMobile(a.mobile) || a.mobile || '';
    $('pEmail').textContent = a.email || 'None given';
    $('pCreated').textContent = dateTime(a.created_at);
    var mk = [];
    if (a.marketing_email) mk.push('Email offers');
    if (a.marketing_sms) mk.push('Text offers');
    $('pMarketing').textContent = mk.length ? mk.join(', ') + (a.marketing_consent_at ? ' (agreed ' + date(a.marketing_consent_at) + ')' : '') : 'No offers';
    $('pApprovedRow').hidden = !(a.approved_by || a.approved_at);
    var by = a.approved_by ? 'by ' + (a.approved_by === staffUserId ? 'you' : whoDid(a.approved_by, a)) : '';
    $('pApproved').textContent = [dateTime(a.approved_at), by].filter(Boolean).join(', ');

    $('ed-tier').value = a.tier || 'trade';
    $('ed-discount').value = a.discount_override == null ? '' : String(Number(a.discount_override));
    $('ed-code').value = a.lightspeed_code || '';
    $('ed-idcheck').value = a.id_check || 'not_started';
    ['err-discount', 'err-code', 'statusError'].forEach(function (id) { $(id).hidden = true; $(id).textContent = ''; });
    $('savedMsg').textContent = '';
    renderStatusButtons(a);
    loadPanelExtras(a);
  }

  /* The notes and the history come from their own staff-only tables */
  function loadPanelExtras(a) {
    var ticket = ++panelLoad;
    var notes = $('ed-notes');
    if (notesFor[a.id] !== undefined) {
      notes.value = notesFor[a.id];
      notes.disabled = false;
    } else {
      notes.value = '';
      notes.disabled = true;
      notes.placeholder = 'Loading notes';
      API.getNotes(a.id).then(function (r) {
        if (ticket !== panelLoad) return;
        notes.disabled = false;
        notes.placeholder = '';
        if (r.error) { $('savedMsg').textContent = 'Couldn’t load the notes. ' + message(r.error); return; }
        notesFor[a.id] = r.data;
        notes.value = r.data;
      });
    }
    loadHistory(a, ticket);
  }

  /* ---------- history ---------- */
  var FIELD = {
    first_name: 'First name', last_name: 'Last name', company_name: 'Company', email: 'Email', mobile: 'Mobile',
    tier: 'Tier', discount_override: 'Discount override', status: 'Status', lightspeed_code: 'Lightspeed code',
    id_check: 'ID check', marketing_email: 'Email offers', marketing_sms: 'Text offers',
    marketing_consent_at: 'Offers agreed', notes: 'Staff notes'
  };
  var SKIP = { approved_by: true, approved_at: true };   // shown by the status line instead
  function showValue(field, v) {
    if (v === null || v === undefined || v === '') return 'none';
    if (field === 'tier') return TIERS[v] || v;
    if (field === 'status') return STATUS[v] || v;
    if (field === 'id_check') return ID_CHECK[v] || v;
    if (field === 'discount_override') return Number(v) + '%';
    if (field === 'marketing_email' || field === 'marketing_sms') return v ? 'yes' : 'no';
    if (field === 'marketing_consent_at') return date(v);
    if (field === 'mobile') return S.prettyMobile(v) || v;
    return String(v);
  }
  function describe(h) {
    if (h.action === 'signed_up') return ['Signed up'];
    var c = h.changes || {};
    if (h.action === 'notes' && c.notes) {
      var to = c.notes.to, from = c.notes.from;
      return [!to ? 'Cleared the staff notes' : !from ? 'Added staff notes: “' + to + '”' : 'Changed staff notes to “' + to + '”'];
    }
    var lines = Object.keys(c).filter(function (k) { return !SKIP[k]; }).map(function (k) {
      return (FIELD[k] || k.replace(/_/g, ' ')) + ': ' + showValue(k, c[k].from) + ' → ' + showValue(k, c[k].to);
    });
    // status first, it matters most
    lines.sort(function (x, y) { return (y.indexOf('Status:') === 0) - (x.indexOf('Status:') === 0); });
    return lines.length ? lines : ['Updated'];
  }
  function loadHistory(a, ticket) {
    $('historyNote').textContent = 'Loading history';
    $('historyList').innerHTML = '';
    API.getHistory(a.id).then(function (r) {
      if (ticket !== undefined && ticket !== panelLoad) return;
      if (r.error) { $('historyNote').textContent = 'Couldn’t load the history. ' + message(r.error); $('historyCount').textContent = '–'; return; }
      var rows = r.data || [];
      $('historyCount').textContent = rows.length;
      $('historyNote').textContent = rows.length ? '' : 'No changes recorded yet.';
      $('historyList').innerHTML = rows.map(function (h) {
        var lines = describe(h);
        return '<li class="st-history__item">' +
          '<p class="st-history__meta"><time datetime="' + esc(h.changed_at) + '">' + esc(dateTime(h.changed_at)) + '</time>' +
          '<span class="st-history__who">' + esc(whoDid(h.changed_by, a)) + '</span></p>' +
          '<ul class="st-history__changes">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
          '</li>';
      }).join('');
    });
  }

  function renderStatusButtons(a) {
    var buttons = {
      pending: [['approved', 'Approve', 'btn--gold'], ['rejected', 'Reject', 'btn--outline']],
      approved: [['suspended', 'Suspend', 'btn--outline']],
      rejected: [['approved', 'Reactivate', 'btn--gold']],
      suspended: [['approved', 'Reactivate', 'btn--gold']]
    }[a.status] || [];
    $('statusButtons').innerHTML = buttons.map(function (b) {
      return '<button class="btn ' + b[2] + '" type="button" data-status="' + b[0] + '">' + b[1] + '</button>';
    }).join('');
  }

  /* ---------- the editable fields ---------- */
  function fieldError(id, text) { $(id).textContent = text || ''; $(id).hidden = !text; }

  function readFields() {
    var ok = true;
    fieldError('err-discount', ''); fieldError('err-code', '');
    var raw = $('ed-discount').value.trim().replace(',', '.').replace('%', '');
    var discount = null;
    if (raw !== '') {
      discount = Number(raw);
      if (!isFinite(discount) || discount < 0 || discount > 50 || !/^\d+(\.\d{1,2})?$/.test(raw)) {
        fieldError('err-discount', 'Enter a number from 0 to 50, or leave it blank for none.');
        ok = false;
      }
    }
    var code = $('ed-code').value.trim().toUpperCase();
    $('ed-code').value = code;
    return ok ? {
      tier: $('ed-tier').value,
      discount_override: discount,
      lightspeed_code: code || null,
      id_check: $('ed-idcheck').value,
      // notes are only sent if they've loaded, and only saved if they changed
      notes: $('ed-notes').disabled ? undefined : $('ed-notes').value.trim(),
      notesBefore: notesFor[selectedId] === undefined ? undefined : String(notesFor[selectedId]).trim()
    } : null;
  }

  function afterWrite(r, where) {
    if (r.error) {
      if (r.error === 'code-taken') fieldError('err-code', message('code-taken'));
      else if (where === 'status') fieldError('statusError', message(r.error));
      else $('savedMsg').textContent = message(r.error);
      return false;
    }
    // Refresh this row and the list from what the database now holds
    var i = accounts.findIndex(function (a) { return a.id === r.data.id; });
    if (i > -1) accounts[i] = r.data; else accounts.unshift(r.data);
    if (r.notes !== undefined) notesFor[r.data.id] = r.notes;
    var typedNotes = $('ed-notes').value;
    renderList();
    renderHome();
    renderPanel();          // also reloads the history
    if (r.notesError) {
      $('ed-notes').value = typedNotes;   // keep what was typed so it can be saved again
      $('savedMsg').textContent = 'Saved, but the notes didn’t save. ' + message(r.notesError);
      return true;
    }
    $('savedMsg').textContent = 'Saved';
    if (window.DCToast) window.DCToast('Saved');
    return true;
  }

  $('editForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('saveBtn');
    if (btn.disabled) return;
    var fields = readFields();
    if (!fields) return;
    setBusy(btn, true, 'Saving');
    API.saveAccount(selectedId, fields, staffUserId).then(function (r) {
      setBusy(btn, false);
      afterWrite(r, 'save');
    });
  });

  $('ed-code').addEventListener('blur', function () { this.value = this.value.trim().toUpperCase(); });
  ['ed-tier', 'ed-discount', 'ed-code', 'ed-idcheck', 'ed-notes'].forEach(function (id) {
    $(id).addEventListener('input', function () { $('savedMsg').textContent = ''; });
  });

  $('nextCodeBtn').addEventListener('click', function () {
    var btn = this;
    if (btn.disabled) return;
    setBusy(btn, true, 'Finding code');
    API.nextDcCode().then(function (r) {
      setBusy(btn, false);
      if (r.error) { fieldError('err-code', message(r.error)); return; }
      $('ed-code').value = r.data;
      fieldError('err-code', '');
      $('savedMsg').textContent = '';
    });
  });

  /* ---------- status changes, each confirmed first ---------- */
  function confirmAction(text, okLabel) {
    var dlg = $('confirm');
    $('confirmText').textContent = text;
    $('confirmOk').textContent = okLabel;
    return new Promise(function (resolve) {
      dlg.addEventListener('close', function onClose() {
        dlg.removeEventListener('close', onClose);
        resolve(dlg.returnValue === 'ok');
      });
      dlg.returnValue = '';
      dlg.showModal();
      $('confirmOk').focus();
    });
  }

  $('statusButtons').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-status]');
    if (!btn || btn.disabled) return;
    var a = byId(selectedId);
    if (!a) return;
    var status = btn.getAttribute('data-status');
    fieldError('statusError', '');
    var fields = readFields();
    if (!fields) return;
    if (status === 'approved' && !fields.lightspeed_code) {
      fieldError('statusError', 'Add a Lightspeed code before approving. Use next DC code if they are new.');
      $('ed-code').focus();
      return;
    }
    var verb = btn.textContent.trim();
    confirmAction(verb + ' ' + (fullName(a) || 'this account') + '?', verb).then(function (yes) {
      if (!yes) return;
      var all = $('statusButtons').querySelectorAll('button');
      all.forEach(function (b) { b.disabled = true; });
      setBusy(btn, true, { Approve: 'Approving', Reject: 'Rejecting', Suspend: 'Suspending', Reactivate: 'Reactivating' }[verb] || 'Saving');
      API.setStatus(a.id, status, staffUserId, fields).then(function (r) {
        setBusy(btn, false);
        all.forEach(function (b) { b.disabled = false; });
        afterWrite(r, 'status');
      });
    });
  });
})();
