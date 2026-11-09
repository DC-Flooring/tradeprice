/* DC Flooring trade: sign-up form (demo).
   Nothing is sent or stored. A valid submit swaps the form for the
   received screen on the same page.
   SUPABASE LATER: insert the application, then show the received screen. */
(function () {
  'use strict';

  var form = document.getElementById('applyForm');
  if (!form) return;
  var formView = document.getElementById('formView');
  var receivedView = document.getElementById('receivedView');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // UK mobile: 07... or +44 7..., spaces and dashes allowed
  var MOBILE = /^(?:\+44|0044|0)7\d{9}$/;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // UK postcode, with or without the space
  var POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

  var rules = {
    name: function (v) { return v.trim().length < 2 ? 'Enter your name' : ''; },
    business: function (v) { return v.trim() ? '' : 'Enter your business or trading name. Use your own name if you trade as yourself'; },
    trade: function (v) { return v ? '' : 'Choose what you do'; },
    mobile: function (v) {
      var n = v.replace(/[\s\-()]/g, '');
      if (!n) return 'Enter your mobile number. Your login code comes here';
      return MOBILE.test(n) ? '' : 'Enter a UK mobile number, like 07700 900123';
    },
    email: function (v) {
      if (!v.trim()) return 'Enter your email address';
      return EMAIL.test(v.trim()) ? '' : 'Enter an email address like name@example.co.uk';
    },
    postcode: function (v) {
      if (!v.trim()) return 'Enter your business postcode';
      return POSTCODE.test(v.trim()) ? '' : 'Enter a full UK postcode, like TS1 2AB';
    },
    company: function (v) {
      var n = v.replace(/\s/g, '');
      if (!n) return '';
      return /^[A-Z0-9]{6,14}$/i.test(n) ? '' : 'Check the number, or leave it blank if you are a sole trader';
    },
    terms: function (v, el) { return el.checked ? '' : 'Tick to agree to the trade account terms'; }
  };

  function setError(el, message) {
    var box = document.getElementById('e-' + (el.name === 'terms' ? 'terms' : el.name));
    if (!box) return;
    if (message) {
      box.textContent = message;
      box.hidden = false;
      el.setAttribute('aria-invalid', 'true');
    } else {
      box.textContent = '';
      box.hidden = true;
      el.removeAttribute('aria-invalid');
    }
  }

  function check(el) {
    var rule = rules[el.name];
    if (!rule) return '';
    var message = rule(el.value, el);
    setError(el, message);
    return message;
  }

  // Clear a field's message as soon as they start fixing it
  function clearOnEdit(event) {
    var el = event.target;
    if (el.getAttribute('aria-invalid') === 'true') setError(el, '');
  }
  form.addEventListener('input', clearOnEdit);
  form.addEventListener('change', clearOnEdit);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
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
    showReceived(form.elements.namedItem('name').value);
  });

  function showReceived(fullName) {
    var first = fullName.trim().split(/\s+/)[0];
    first = first.charAt(0).toUpperCase() + first.slice(1);
    document.getElementById('firstName').textContent = first;

    formView.hidden = true;
    receivedView.hidden = false;
    receivedView.classList.add('is-entering');
    window.scrollTo(0, 0);
    // Let the hidden state paint, then let the screen settle in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { receivedView.classList.remove('is-entering'); });
    });
    document.getElementById('received-title').focus({ preventScroll: true });
    document.title = 'Application received | DC Flooring Trade';
  }

  // Verify my ID: in this demo it opens a short placeholder panel under the button
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
