/* DC Flooring trade: sign in with a code by text (demo).
   Step 1 takes a mobile number, step 2 takes the 6-digit code.
   Everything that talks to a real login service lives in demoAuth() below. */
(function () {
  'use strict';

  /* ==================================================================
   * DEMO AUTH: swap this one function for Supabase phone login later.
   *
   *   demoAuth('send',   { phone })        -> { ok: true } or { ok: false, reason: 'unknown' }
   *   demoAuth('verify', { phone, code })  -> { ok: true } or { ok: false, reason: 'wrong-code' }
   *
   * SUPABASE LATER (phone is E.164, e.g. +447700900123):
   *   send:   const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } })
   *           error means the number is not an approved account -> { ok: false, reason: 'unknown' }
   *   verify: const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
   *           error -> { ok: false, reason: 'wrong-code' }
   *
   * Demo rules: nothing is sent. Any UK mobile is accepted, code 123456 signs in,
   * any other code is wrong. Add ?demo=unknown to the URL to see the
   * "We don't recognise that number" message.
   * ================================================================== */
  function demoAuth(action, data) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (action === 'send') {
          var unknown = /[?&]demo=unknown\b/.test(window.location.search);
          resolve(unknown ? { ok: false, reason: 'unknown' } : { ok: true });
        } else if (action === 'verify') {
          resolve(data.code === '123456' ? { ok: true } : { ok: false, reason: 'wrong-code' });
        }
      }, action === 'send' ? 650 : 350); // stands in for the network
    });
  }
  /* ===================== end of DEMO AUTH ========================== */

  var RESEND_SECONDS = 30;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var stepMobile = document.getElementById('stepMobile');
  var stepCode = document.getElementById('stepCode');
  var mobileForm = document.getElementById('mobileForm');
  var mobileInput = document.getElementById('f-mobile');
  var mobileError = document.getElementById('e-mobile');
  var sendBtn = document.getElementById('sendBtn');
  var codeForm = document.getElementById('codeForm');
  var codeInput = document.getElementById('f-code');
  var codeError = document.getElementById('e-code');
  var otp = document.getElementById('otp');
  var slots = otp.querySelectorAll('.otp__slot');
  var codeStatus = document.getElementById('codeStatus');
  var resendBtn = document.getElementById('resendBtn');
  var resendCount = document.getElementById('resendCount');
  var sentTo = document.getElementById('sentTo');

  var phone = '';        // E.164, e.g. +447700900123
  var timer = null;
  var checking = false;

  /* ---------- helpers ---------- */
  function toE164(value) {
    var n = value.replace(/[\s\-()]/g, '');
    if (/^07\d{9}$/.test(n)) return '+44' + n.slice(1);
    if (/^\+447\d{9}$/.test(n)) return n;
    if (/^00447\d{9}$/.test(n)) return '+' + n.slice(2);
    return '';
  }
  function pretty(e164) { // +447700900123 -> 07700 900123
    var local = '0' + e164.slice(3);
    return local.slice(0, 5) + ' ' + local.slice(5);
  }
  function showError(box, input, html) {
    box.innerHTML = '<span>' + html + '</span>';
    box.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }
  function clearError(box, input) {
    box.textContent = '';
    box.hidden = true;
    input.removeAttribute('aria-invalid');
  }
  function busy(btn, on, label) {
    btn.disabled = on;
    btn.classList.toggle('is-busy', on);
    btn.setAttribute('aria-busy', String(on));
    if (label) btn.textContent = label;
  }
  function swap(from, to, focusEl) {
    from.hidden = true;
    to.hidden = false;
    to.classList.add('is-entering');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { to.classList.remove('is-entering'); });
    });
    window.scrollTo(0, 0);
    focusEl.focus({ preventScroll: true });
  }

  /* ---------- step 1: send the code ---------- */
  mobileInput.addEventListener('input', function () {
    if (mobileInput.getAttribute('aria-invalid') === 'true') clearError(mobileError, mobileInput);
  });

  mobileForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (sendBtn.disabled) return;
    var raw = mobileInput.value;
    if (!raw.trim()) return showError(mobileError, mobileInput, 'Enter your mobile number');
    var e164 = toE164(raw);
    if (!e164) return showError(mobileError, mobileInput, 'Enter a UK mobile number, like 07700 900123');

    busy(sendBtn, true, 'Sending code');
    demoAuth('send', { phone: e164 }).then(function (res) {
      busy(sendBtn, false, 'Text me a code');
      if (!res.ok) {
        showError(mobileError, mobileInput, 'We don’t recognise that number. <a class="text-link" href="apply.html">Sign up free</a>');
        mobileInput.focus();
        return;
      }
      phone = e164;
      sentTo.textContent = pretty(e164);
      resetCode();
      swap(stepMobile, stepCode, codeInput);
      startResendTimer();
    });
  });

  /* ---------- step 2: the code ---------- */
  function paintSlots() {
    var v = codeInput.value;
    var focused = document.activeElement === codeInput;
    for (var i = 0; i < slots.length; i++) {
      slots[i].textContent = v[i] || '';
      slots[i].classList.toggle('is-filled', !!v[i]);
      slots[i].classList.toggle('is-active', focused && i === Math.min(v.length, 5));
    }
  }
  function resetCode() {
    codeInput.value = '';
    clearError(codeError, codeInput);
    otp.classList.remove('is-wrong', 'is-right');
    codeStatus.textContent = '';
    paintSlots();
  }

  codeInput.addEventListener('input', function () {
    // Keep digits only, so a pasted "123 456" or "Your code is 123456" still works
    var digits = codeInput.value.replace(/\D/g, '').slice(0, 6);
    if (digits !== codeInput.value) codeInput.value = digits;
    if (codeInput.getAttribute('aria-invalid') === 'true') {
      clearError(codeError, codeInput);
      otp.classList.remove('is-wrong');
    }
    paintSlots();
    if (digits.length === 6) verify(digits);
  });
  codeInput.addEventListener('paste', function (event) {
    var text = (event.clipboardData || window.clipboardData).getData('text') || '';
    var digits = text.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    codeInput.value = digits;
    codeInput.dispatchEvent(new Event('input'));
  });
  codeInput.addEventListener('focus', paintSlots);
  codeInput.addEventListener('blur', paintSlots);
  codeForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (codeInput.value.length === 6) verify(codeInput.value);
    else showError(codeError, codeInput, 'Enter all 6 digits from the text');
  });

  function verify(code) {
    if (checking) return;
    checking = true;
    codeStatus.textContent = 'Checking';
    otp.classList.add('is-checking');
    demoAuth('verify', { phone: phone, code: code }).then(function (res) {
      checking = false;
      otp.classList.remove('is-checking');
      if (res.ok) {
        otp.classList.add('is-right');
        codeStatus.textContent = 'You’re in';
        stopResendTimer();
        // DEMO: remember the session so the price list can greet them
        try { sessionStorage.setItem('dc-signed-in', phone); } catch (e) { /* private mode */ }
        setTimeout(function () { window.location.href = 'app.html'; }, reduceMotion.matches ? 150 : 450);
        return;
      }
      codeStatus.textContent = '';
      showError(codeError, codeInput, 'That code’s not right. Try again.');
      shake();
      codeInput.select();
    });
  }

  // A small horizontal shake, like a head shaking no. Reduced motion: no movement, the red border and message do the job.
  function shake() {
    otp.classList.add('is-wrong');
    if (reduceMotion.matches || !otp.animate) return;
    otp.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(2px)' },
        { transform: 'translateX(0)' }
      ],
      { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    );
  }

  /* ---------- resend ---------- */
  function startResendTimer() {
    stopResendTimer();
    var left = RESEND_SECONDS;
    resendBtn.disabled = true;
    resendBtn.classList.remove('is-busy');
    resendBtn.removeAttribute('aria-busy');
    resendBtn.innerHTML = '<span>Resend code in <span class="num" id="resendCount">' + left + '</span>s</span>';
    resendCount = document.getElementById('resendCount');
    timer = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        stopResendTimer();
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend code';
        return;
      }
      resendCount.textContent = left;
    }, 1000);
  }
  function stopResendTimer() { if (timer) { clearInterval(timer); timer = null; } }

  resendBtn.addEventListener('click', function () {
    if (resendBtn.disabled) return;
    busy(resendBtn, true, 'Sending code');
    demoAuth('send', { phone: phone }).then(function () {
      resetCode();
      codeInput.focus();
      startResendTimer();
      if (window.DCToast) window.DCToast('New code sent to ' + pretty(phone));
    });
  });

  /* ---------- wrong number ---------- */
  document.getElementById('wrongNumber').addEventListener('click', function () {
    stopResendTimer();
    resetCode();
    swap(stepCode, stepMobile, mobileInput);
    mobileInput.select();
  });

  paintSlots();
})();
