/* DC Flooring trade: Buy again (placeholder). Lists the account's starred
   favourites with the price for the account's own tier. */
(function () {
  'use strict';
  var A = window.DCAccount, U = window.DC_USER;
  var list = document.getElementById('favList');
  if (!list) return;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  A.loadProducts().then(function (products) {
    var byId = {};
    products.forEach(function (p) { byId[p.id] = p; });
    list.innerHTML = U.favourites.map(function (id) { return byId[id]; }).filter(Boolean).map(function (p) {
      return '<li><a class="result" href="pricelist.html?range=' + encodeURIComponent(p.handle) + '">' +
        '<span class="result__main"><span class="result__name">' + esc(p.name) + '</span>' +
        '<span class="result__meta">' + esc([p.brand, p.category].filter(Boolean).join(' · ')) + '</span>' +
        '<span class="result__stock' + (p.stock_status === 'in_stock' ? ' is-in' : '') + '">' + A.stockLabel(p.stock_status) + '</span></span>' +
        '<span class="result__price"><span class="num">' + (p.price_from ? '<small>from </small>' : '') + A.money(A.priceOf(p)) + '</span>' +
        '<span class="result__unit">' + esc(A.unitLabel(p.unit)) + ' · ' + esc(A.tier().label) + '</span></span></a></li>';
    }).join('');
  }).catch(function () {
    list.innerHTML = '<li class="coming-soon">Your favourites could not load. Try again in a minute.</li>';
  });
})();
