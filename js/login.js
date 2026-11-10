/* DC Flooring trade: log in with a code by text (Supabase phone sign-in).
   Step 1: mobile number -> Supabase sends a 6-digit code (only to numbers that
           already have a login; this never creates a new one).
   Step 2: the code -> Supabase checks it and signs them in.
   Then the fitter's own row in public.accounts decides where they go:
     approved -> app.html; pending, rejected or suspended -> account-status.html;
     no row yet -> apply.html to finish signing up.
   Never logs phone numbers, codes or tokens. */
(function () {
  'use strict';

  var S = window.DCSession, O = window.DCOtp;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var stepMobile = document.getElementById('stepMobile');
  var stepCode = document.getElementById('stepCode');
  var mobileForm = document.getElementById('mobileForm');
  var mobileInput = document.getElementById('f-mobile');
  var mobileError = document.getElementById('e-mobile');
  var sendBtn = document.getElementById('sendBtn');
  var note = document.getElementById('loginNote');
  var sentTo = document.getElementById('sentTo');
  var resend = O.resendTimer(document.getElementById('resendBtn'), 30);
  var phone = '';

  var otp = O.create({
    root: document.getElementById('otp'),
    input: document.getElementById('f-code'),
    error: document.getElementById('e-code'),
    status: document.getElementById('codeStatus'),
    onComplete: verify
  });

  function showMobileError(html) {
    mobileError.innerHTML = '<span>' + html + '</span>';
    mobileError.hidden = false;
    mobileInput.setAttribute('aria-invalid', 'true');
  }
  function clearMobileError() {
    mobileError.textContent = '';
    mobileError.hidden = true;
    mobileInput.removeAttribute('aria-invalid');
  }
  function swap(from, to, focusEl) {
    from.hidden = true;
    to.hidden = false;
    to.classList.add('is-entering');
    requestAnimationFrame(function () { requestAnimationFrame(function () { to.classList.remove('is-entering'); }); });
    window.scrollTo(0, 0);
    focusEl.focus({ preventScroll: true });
  }
  function go(account) { window.location.replace(S.routeFor(account)); }

  /* ---------- not switched on yet, or already signed in ---------- */
  if (!S.configured()) {
    note.textContent = 'Sign in isn’t switched on yet. Give the counter a ring.';
    note.hidden = false;
    sendBtn.disabled = true;
    return;
  }
  S.currentUser().then(function (user) {
    if (!user) return;
    // Already signed in on this phone: skip straight to the right place
    O.buttonBusy(sendBtn, true, 'Signing you in');
    return S.loadAccount(user.id).then(go);
  }).catch(function () { O.buttonBusy(sendBtn, false); });

  /* ---------- step 1: send the code ---------- */
  mobileInput.addEventListener('input', function () {
    if (mobileInput.getAttribute('aria-invalid') === 'true') clearMobileError();
  });

  function sendCode() {
    return S.client().auth.signInWithOtp({ phone: phone, options: { shouldCreateUser: false } });
  }

  mobileForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (sendBtn.disabled) return;
    if (!mobileInput.value.trim()) return showMobileError('Enter your mobile number');
    var e164 = S.normaliseMobile(mobileInput.value);
    if (!e164) return showMobileError('That doesn’t look like a UK mobile. Try one like 07700 900123');

    phone = e164;
    O.buttonBusy(sendBtn, true, 'Sending code');
    sendCode().then(function (r) {
      O.buttonBusy(sendBtn, false);
      if (r.error) {
        var f = S.friendlyError(r.error, 'send');
        if (f.kind === 'unknown-number') showMobileError(f.message + ' <a class="text-link" href="apply.html">Sign up free</a>');
        else showMobileError(f.message);
        mobileInput.focus();
        return;
      }
      sentTo.textContent = S.prettyMobile(phone);
      otp.reset();
      swap(stepMobile, stepCode, document.getElementById('f-code'));
      resend.start();
    }, function () {
      O.buttonBusy(sendBtn, false);
      showMobileError(S.friendlyError(null, 'send').message);
    });
  });

  /* ---------- step 2: check the code ---------- */
  function verify(code) {
    otp.busy(true);
    S.client().auth.verifyOtp({ phone: phone, token: code, type: 'sms' }).then(function (r) {
      if (r.error || !r.data || !r.data.user) {
        var f = S.friendlyError(r.error, 'verify');
        otp.wrong(f.kind === 'bad-code' ? f.message + ' Try again, or send a new code.' : f.message);
        return;
      }
      return S.loadAccount(r.data.user.id).then(function (account) {
        otp.done();
        setTimeout(function () { go(account); }, reduceMotion.matches ? 100 : 350);
      });
    }).catch(function (err) {
      otp.wrong(S.friendlyError(err, 'data').message);
    });
  }

  document.getElementById('codeForm').addEventListener('submit', function (e) { e.preventDefault(); });

  document.getElementById('resendBtn').addEventListener('click', function () {
    var btn = this;
    if (btn.disabled) return;
    resend.sending();
    sendCode().then(function (r) {
      otp.reset();
      document.getElementById('f-code').focus();
      if (r.error) {
        resend.start();
        otp.wrong(S.friendlyError(r.error, 'send').message);
        return;
      }
      resend.start();
      if (window.DCToast) window.DCToast('New code sent to ' + S.prettyMobile(phone));
    }, function () {
      resend.start();
      otp.wrong(S.friendlyError(null, 'send').message);
    });
  });

  document.getElementById('wrongNumber').addEventListener('click', function () {
    resend.stop();
    otp.reset();
    swap(stepCode, stepMobile, mobileInput);
    mobileInput.select();
  });
})();
