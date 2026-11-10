/* DC Flooring trade: the 6-digit code entry, shared by sign up and log in.
   One real input (autocomplete="one-time-code", so phones offer the code from
   the text, and paste works) drawn as six boxes. It checks itself when the
   sixth digit goes in. Also the 30 second "Send a new code" wait.

   DCOtp.create({ root, input, error, status, onComplete(code) }) returns
   { reset, focus, wrong(message), busy(on), done(), clearError } */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function create(o) {
    var root = o.root, input = o.input, errorEl = o.error, statusEl = o.status;
    var slots = root.querySelectorAll('.otp__slot');
    var locked = false;

    function paint() {
      var v = input.value;
      var focused = document.activeElement === input;
      for (var i = 0; i < slots.length; i++) {
        slots[i].textContent = v[i] || '';
        slots[i].classList.toggle('is-filled', !!v[i]);
        slots[i].classList.toggle('is-active', focused && i === Math.min(v.length, 5));
      }
    }
    function clearError() {
      errorEl.textContent = '';
      errorEl.hidden = true;
      input.removeAttribute('aria-invalid');
      root.classList.remove('is-wrong');
    }
    function reset() {
      input.value = '';
      locked = false;
      clearError();
      root.classList.remove('is-right', 'is-checking');
      if (statusEl) statusEl.textContent = '';
      paint();
    }
    function busy(on) {
      locked = on;
      input.readOnly = on;
      root.classList.toggle('is-checking', on);
      if (statusEl) statusEl.textContent = on ? 'Checking' : '';
    }
    function done() {
      root.classList.remove('is-checking');
      root.classList.add('is-right');
      if (statusEl) statusEl.textContent = 'You’re in';
    }
    // A small horizontal shake. Reduced motion: no movement, the red border and message do the job.
    function wrong(html) {
      busy(false);
      errorEl.innerHTML = '<span>' + html + '</span>';
      errorEl.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      root.classList.add('is-wrong');
      if (!reduceMotion.matches && root.animate) {
        root.animate([
          { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' },
          { transform: 'translateX(-3px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }
        ], { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      input.select();
    }

    input.addEventListener('input', function () {
      if (locked) return;
      // Digits only, so a pasted "123 456" or a whole text message still works
      var digits = input.value.replace(/\D/g, '').slice(0, 6);
      if (digits !== input.value) input.value = digits;
      if (input.getAttribute('aria-invalid') === 'true') clearError();
      paint();
      if (digits.length === 6 && o.onComplete) o.onComplete(digits);
    });
    input.addEventListener('paste', function (event) {
      var text = (event.clipboardData || window.clipboardData).getData('text') || '';
      var digits = text.replace(/\D/g, '').slice(0, 6);
      if (!digits || locked) return;
      event.preventDefault();
      input.value = digits;
      input.dispatchEvent(new Event('input'));
    });
    input.addEventListener('focus', paint);
    input.addEventListener('blur', paint);
    paint();

    return { reset: reset, focus: function () { input.focus({ preventScroll: true }); paint(); }, wrong: wrong, busy: busy, done: done, clearError: clearError };
  }

  /* "Send a new code" with a wait before it can be used again */
  function resendTimer(btn, seconds) {
    var timer = null;
    function label(left) {
      btn.innerHTML = left > 0
        ? '<span>Send a new code in <span class="num">' + left + '</span>s</span>'
        : '<span>Send a new code</span>';
    }
    return {
      start: function () {
        clearInterval(timer);
        var left = seconds;
        btn.disabled = true;
        btn.classList.remove('is-busy');
        btn.removeAttribute('aria-busy');
        label(left);
        timer = setInterval(function () {
          left -= 1;
          label(left);
          if (left <= 0) { clearInterval(timer); timer = null; btn.disabled = false; }
        }, 1000);
      },
      stop: function () { clearInterval(timer); timer = null; },
      sending: function () {
        btn.disabled = true;
        btn.classList.add('is-busy');
        btn.setAttribute('aria-busy', 'true');
        btn.innerHTML = '<span>Sending code</span>';
      }
    };
  }

  /* Loading state on any button: disabled (no double taps) and a plain label */
  function buttonBusy(btn, on, busyLabel) {
    if (on) {
      if (!btn.dataset.label) btn.dataset.label = btn.textContent;
      btn.textContent = busyLabel;
    } else if (btn.dataset.label) {
      btn.textContent = btn.dataset.label;
    }
    btn.disabled = on;
    btn.classList.toggle('is-busy', on);
    btn.setAttribute('aria-busy', String(on));
  }

  window.DCOtp = { create: create, resendTimer: resendTimer, buttonBusy: buttonBusy };
})();
