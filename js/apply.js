/* DC Flooring trade: sign up (Supabase phone sign-in, then the account row).
   1. Check the form.
   2. Text a code to their mobile (signInWithOtp), show the 6-digit box.
   3. Check the code (verifyOtp). They are now signed in.
   4. If they already have an account row, treat it as a log in and send them on.
      Otherwise insert their row into public.accounts with ONLY the fitter's own
      fields. status, tier, lightspeed_code and the rest are left to the database
      defaults and are never sent.
   5. Show the "Nice one" received screen.
   Never logs phone numbers, codes or tokens. */
(function () {
  'use strict';

  var S = window.DCSession, O = window.DCOtp;
  var form = document.getElementById('applyForm');
  if (!form) return;

  var formView = document.getElementById('formView');
  var codeView = document.getElementById('codeView');
  var receivedView = document.getElementById('receivedView');
  var applyBtn = document.getElementById('applyBtn');
  var note = document.getElementById('applyNote');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var resend = O.resendTimer(document.getElementById('resendBtn'), 30);
  var pending = null; // the details waiting to be saved once the code is checked

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var rules = {
    first_name: function (v) { return v.trim() ? '' : 'Enter your first name'; },
    last_name: function (v) { return v.trim() ? '' : 'Enter your last name'; },
    company_name: function () { return ''; },
    mobile: function (v) {
      if (!v.trim()) return 'Enter your mobile number. Your login code comes here';
      return S.normaliseMobile(v) ? '' : 'That doesn’t look like a UK mobile. Try one like 07700 900123';
    },
    email: function (v) { return !v.trim() || EMAIL.test(v.trim()) ? '' : 'Check your email address, or leave it blank'; },
    terms: function (v, el) { return el.checked ? '' : 'Tick to agree to the trade account terms'; }
  };

  function setError(el, message) {
    var box = document.getElementById('e-' + ({ first_name: 'first', last_name: 'last', company_name: 'company' }[el.name] || el.name));
    if (!box) return;
    box.textContent = message || '';
    box.hidden = !message;
    if (message) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function check(el) {
    var rule = rules[el.name];
    if (!rule) return '';
    var message = rule(el.value, el);
    setError(el, message);
    return message;
  }
  function clearOnEdit(event) {
    var el = event.target;
    if (el.getAttribute('aria-invalid') === 'true') setError(el, '');
  }
  form.addEventListener('input', clearOnEdit);
  form.addEventListener('change', clearOnEdit);

  function swap(from, to, focusEl) {
    from.hidden = true;
    to.hidden = false;
    to.classList.add('is-entering');
    requestAnimationFrame(function () { requestAnimationFrame(function () { to.classList.remove('is-entering'); }); });
    window.scrollTo(0, 0);
    if (focusEl) focusEl.focus({ preventScroll: true });
  }
  function showNote(text) { note.textContent = text; note.hidden = false; }
  function formError(message) {
    // A problem that is not about one field: show it under the button, plainly
    showNote(message);
    note.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  /* ---------- the details to save: only the fitter's own columns ---------- */
  function details() {
    var f = form.elements;
    var email = f.namedItem('email').value.trim();
    var company = f.namedItem('company_name').value.trim();
    var wantsEmail = f.namedItem('offersEmail').checked;
    var wantsSms = f.namedItem('offersText').checked;
    var d = {
      first_name: f.namedItem('first_name').value.trim(),
      last_name: f.namedItem('last_name').value.trim(),
      company_name: company || null,
      mobile: S.normaliseMobile(f.namedItem('mobile').value),
      email: email || null,
      marketing_email: wantsEmail,
      marketing_sms: wantsSms
    };
    if (wantsEmail || wantsSms) d.marketing_consent_at = new Date().toISOString();
    return d;
  }

  /* ---------- not switched on yet ---------- */
  if (!S.configured()) {
    showNote('Sign up isn’t switched on yet. Give the counter a ring and we’ll set you up.');
    applyBtn.disabled = true;
    return;
  }

  // Sent here after logging in with no account row yet: they are already signed in
  var signedInUser = null;
  S.currentUser().then(function (user) {
    if (!user) return;
    return S.loadAccount(user.id).then(function (account) {
      if (account) { window.location.replace(S.routeFor(account)); return; }
      signedInUser = user;
      showNote('You’re signed in. Fill this in to finish signing up.');
      if (user.phone) {
        var m = form.elements.namedItem('mobile');
        m.value = S.prettyMobile(S.normaliseMobile(user.phone));
        m.readOnly = true;
      }
    });
  }).catch(function () { /* stay on the form; sending will report any problem */ });

  /* ---------- 1 + 2: check the form, text the code ---------- */
  function sendCode(phone) {
    return S.client().auth.signInWithOtp({ phone: phone }); // creates the login if it is new
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (applyBtn.disabled) return;
    note.hidden = true;
    var firstBad = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !rules[el.name]) return;
      if (check(el) && !firstBad) firstBad = el;
    });
    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      return;
    }
    pending = details();

    if (signedInUser) { O.buttonBusy(applyBtn, true, 'Saving'); saveAccount(signedInUser); return; }

    O.buttonBusy(applyBtn, true, 'Sending code');
    sendCode(pending.mobile).then(function (r) {
      O.buttonBusy(applyBtn, false);
      if (r.error) { formError(S.friendlyError(r.error, 'send').message); return; }
      document.getElementById('sentTo').textContent = S.prettyMobile(pending.mobile);
      otp.reset();
      swap(formView, codeView, document.getElementById('f-code'));
      resend.start();
    }, function () {
      O.buttonBusy(applyBtn, false);
      formError(S.friendlyError(null, 'send').message);
    });
  });

  /* ---------- 3: check the code ---------- */
  var otp = O.create({
    root: document.getElementById('otp'),
    input: document.getElementById('f-code'),
    error: document.getElementById('e-code'),
    status: document.getElementById('codeStatus'),
    onComplete: function (code) {
      otp.busy(true);
      S.client().auth.verifyOtp({ phone: pending.mobile, token: code, type: 'sms' }).then(function (r) {
        if (r.error || !r.data || !r.data.user) {
          var f = S.friendlyError(r.error, 'verify');
          otp.wrong(f.kind === 'bad-code' ? f.message + ' Try again, or send a new code.' : f.message);
          return;
        }
        saveAccount(r.data.user);
      }, function () { otp.wrong(S.friendlyError(null, 'verify').message); });
    }
  });

  /* ---------- 4: the account row ---------- */
  function saveAccount(user) {
    S.loadAccount(user.id).then(function (existing) {
      // Already has an account: this is a log in, not a new sign up
      if (existing) { resend.stop(); window.location.replace(S.routeFor(existing)); return null; }
      var row = Object.assign({ id: user.id }, pending);
      return S.client().from('accounts').insert(row).then(function (r) {
        if (r.error) throw r.error;
        resend.stop();
        showReceived(pending.first_name);
      });
    }).catch(function (err) {
      var message = S.friendlyError(err, 'data').message;
      if (!codeView.hidden) { otp.wrong(message); return; }
      O.buttonBusy(applyBtn, false);
      formError(message);
    });
  }

  document.getElementById('codeForm').addEventListener('submit', function (e) { e.preventDefault(); });

  document.getElementById('resendBtn').addEventListener('click', function () {
    if (this.disabled) return;
    resend.sending();
    sendCode(pending.mobile).then(function (r) {
      otp.reset();
      document.getElementById('f-code').focus();
      resend.start();
      if (r.error) { otp.wrong(S.friendlyError(r.error, 'send').message); return; }
      if (window.DCToast) window.DCToast('New code sent to ' + S.prettyMobile(pending.mobile));
    }, function () { resend.start(); otp.wrong(S.friendlyError(null, 'send').message); });
  });

  document.getElementById('wrongNumber').addEventListener('click', function () {
    resend.stop();
    otp.reset();
    swap(codeView, formView, form.elements.namedItem('mobile'));
    form.elements.namedItem('mobile').select();
  });

  /* ---------- 5: received ---------- */
  function showReceived(firstName) {
    document.getElementById('firstName').textContent = firstName;
    var from = codeView.hidden ? formView : codeView;
    swap(from, receivedView, document.getElementById('received-title'));
    document.title = 'Application received | DC Flooring Trade';
  }

  // Verify my ID: still a placeholder panel (the ID check is not built yet)
  var verifyBtn = document.getElementById('verifyBtn');
  var panel = document.getElementById('diditPanel');
  if (verifyBtn && panel) {
    verifyBtn.addEventListener('click', function () {
      var open = verifyBtn.getAttribute('aria-expanded') === 'true';
      verifyBtn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  }
})();
