/* DC Flooring trade: shared page script.
   Links marked data-todo point at details the business has not supplied yet
   (phone, WhatsApp, address). Until then they show a short note instead of
   going nowhere. Swap each href for the real tel:, WhatsApp or maps link and
   remove data-todo when the details arrive. */
(function () {
  'use strict';

  var toast = document.getElementById('toast');
  var timer;

  function show(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('is-on'); }, 3200);
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-todo]');
    if (!link) return;
    event.preventDefault();
    show(link.getAttribute('data-todo'));
  });
})();
