/* DC Flooring trade: shared page script.
   Links marked data-todo point at details the business has not supplied yet
   (phone, WhatsApp, address). Until then they show a short note instead of
   going nowhere. Swap each href for the real tel:, WhatsApp or maps link and
   remove data-todo when the details arrive. */
(function () {
  'use strict';

  var toast = document.getElementById('toast');
  var timer;

  var remaining = 0;
  var startedAt = 0;

  function hide() { toast.classList.remove('is-on'); }
  function startTimer(ms) {
    clearTimeout(timer);
    remaining = ms;
    startedAt = Date.now();
    timer = setTimeout(hide, ms);
  }

  function show(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-on');
    startTimer(3200);
  }

  // Pause the toast while the tab is hidden, so it is still there when the fitter comes back.
  document.addEventListener('visibilitychange', function () {
    if (!toast || !toast.classList.contains('is-on')) return;
    if (document.hidden) {
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
    } else {
      startTimer(Math.max(remaining, 1200));
    }
  });

  // Tap the toast to dismiss it straight away.
  if (toast) toast.addEventListener('click', hide);

  // Other page scripts can show a message with window.DCToast('...')
  window.DCToast = show;

  // Signing out is handled by js/session.js ([data-sign-out]).

  // Only let the tea steam while the mug is on screen.
  var kettle = document.querySelector('.kettle');
  if (kettle && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      kettle.classList.toggle('is-visible', entries[0].isIntersecting);
    }).observe(kettle);
  } else if (kettle) {
    kettle.classList.add('is-visible');
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-todo]');
    if (!link) return;
    event.preventDefault();
    show(link.getAttribute('data-todo'));
  });
})();
