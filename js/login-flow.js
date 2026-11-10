/* DC Flooring trade: the fitter mobile + 6-digit code log in (login.html).
   Staff log in with email and password on their own page instead.
   Step 1: mobile -> Supabase sends a code (only to numbers that already have a login).
   Step 2: the code -> Supabase checks it and signs them in.
   What happens after that is up to the page: DCLoginFlow.mount({ onSignedIn(user) }).
   Never logs phone numbers, codes or tokens. */
(function () {
  'use strict';

  function mount(opts) {
    var S = window.DCSession, O = window.DCOtp;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var $ = function (id) { return document.getElementById(id); };

    var stepMobile = $('stepMobile'), stepCode = $('stepCode');
    var mobileForm = $('mobileForm'), mobileInput = $('f-mobile'), mobileError = $('e-mobile');
    var sendBtn = $('sendBtn'), note = $('loginNote'), sentTo = $('sentTo');
    var resend = O.resendTimer($('resendBtn'), 30);
    var phone = '';
    var unknownHtml = opts.unknownNumberHtml || ' <a class="text-link" href="apply.html">Sign up free</a>';

    var otp = O.create({ root: $('otp'), input: $('f-code'), error: $('e-code'), status: $('codeStatus'), onComplete: verify });

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

    /* not switched on yet, or already signed in */
    if (!S.configured()) {
      note.textContent = opts.notConfiguredText || 'Sign in isn’t switched on yet. Give the counter a ring.';
      note.hidden = false;
      sendBtn.disabled = true;
      return;
    }
    S.currentUser().then(function (user) {
      if (!user) return;
      O.buttonBusy(sendBtn, true, 'Signing you in');
      return Promise.resolve(opts.onSignedIn(user, { existing: true })).then(function () { O.buttonBusy(sendBtn, false); });
    }).catch(function () { O.buttonBusy(sendBtn, false); });

    /* step 1: send the code */
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
          showMobileError(f.kind === 'unknown-number' ? f.message + unknownHtml : f.message);
          mobileInput.focus();
          return;
        }
        sentTo.textContent = S.prettyMobile(phone);
        otp.reset();
        swap(stepMobile, stepCode, $('f-code'));
        resend.start();
      }, function () {
        O.buttonBusy(sendBtn, false);
        showMobileError(S.friendlyError(null, 'send').message);
      });
    });

    /* step 2: check the code */
    function verify(code) {
      otp.busy(true);
      S.client().auth.verifyOtp({ phone: phone, token: code, type: 'sms' }).then(function (r) {
        if (r.error || !r.data || !r.data.user) {
          var f = S.friendlyError(r.error, 'verify');
          otp.wrong(f.kind === 'bad-code' ? f.message + ' Try again, or send a new code.' : f.message);
          return;
        }
        resend.stop();
        otp.done();
        return new Promise(function (res) { setTimeout(res, reduceMotion.matches ? 100 : 350); })
          .then(function () { return opts.onSignedIn(r.data.user, { existing: false }); });
      }).catch(function (err) {
        otp.wrong(S.friendlyError(err, 'data').message);
      });
    }
    $('codeForm').addEventListener('submit', function (e) { e.preventDefault(); });

    $('resendBtn').addEventListener('click', function () {
      if (this.disabled) return;
      resend.sending();
      sendCode().then(function (r) {
        otp.reset();
        $('f-code').focus();
        resend.start();
        if (r.error) { otp.wrong(S.friendlyError(r.error, 'send').message); return; }
        if (window.DCToast) window.DCToast('New code sent to ' + S.prettyMobile(phone));
      }, function () { resend.start(); otp.wrong(S.friendlyError(null, 'send').message); });
    });

    $('wrongNumber').addEventListener('click', function () {
      resend.stop();
      otp.reset();
      swap(stepCode, stepMobile, mobileInput);
      mobileInput.select();
    });
  }

  window.DCLoginFlow = { mount: mount };
})();
