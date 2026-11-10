/* Tests for the offers rules in js/offers.js.
   Run from the repo root:  node tests/offers.test.js
   No packages needed. Exits with code 1 if anything fails. */
'use strict';
var assert = require('assert');
var O = require('../js/offers.js');

var product = { id: 'p1', name: 'Windsor (Pack) 2.48m² 7mm', price_trade_plus: 20.0 };
var tierPrice = 20.0; // Trade Plus price from the data
function offer(over) { return Object.assign({ productId: 'p1', offerPrice: 17.99, endDate: '2026-11-15' }, over || {}); }
// Times are written in UTC; the comments give UK time
function at(iso) { return new Date(iso); }

var cases = [
  ['valid offer: a few days before it ends', function () {
    assert.strictEqual(O.isOfferLive(offer(), product, tierPrice, at('2026-11-10T09:00:00Z')), true);
  }],
  ['expired offer: the day after it ended', function () {
    assert.strictEqual(O.offerStatus(offer(), product, tierPrice, at('2026-11-16T09:00:00Z')), 'expired');
    assert.strictEqual(O.isOfferLive(offer(), product, tierPrice, at('2026-11-16T09:00:00Z')), false);
  }],
  ['ends today: still live, and says "Ends today"', function () {
    var now = at('2026-11-15T12:00:00Z');
    assert.strictEqual(O.isOfferLive(offer(), product, tierPrice, now), true);
    assert.strictEqual(O.endsLabel('2026-11-15', now), 'Ends today');
  }],
  ['offer higher than the fitter\'s tier price: hidden', function () {
    assert.strictEqual(O.offerStatus(offer({ offerPrice: 20.5 }), product, tierPrice, at('2026-11-10T09:00:00Z')), 'worse-price');
    assert.strictEqual(O.isOfferLive(offer({ offerPrice: 20.5 }), product, tierPrice, at('2026-11-10T09:00:00Z')), false);
  }],
  ['offer equal to the tier price: shown (not worse), no strike-through needed', function () {
    assert.strictEqual(O.isOfferLive(offer({ offerPrice: 20.0 }), product, tierPrice, at('2026-11-10T09:00:00Z')), true);
  }],
  ['missing product: skipped', function () {
    assert.strictEqual(O.offerStatus(offer({ productId: 'nope' }), undefined, undefined, at('2026-11-10T09:00:00Z')), 'no-product');
    assert.strictEqual(O.isOfferLive(offer({ productId: 'nope' }), undefined, undefined, at('2026-11-10T09:00:00Z')), false);
  }],
  ['bad data: no end date or no price is never shown', function () {
    assert.strictEqual(O.isOfferLive(offer({ endDate: undefined }), product, tierPrice, at('2026-11-10T09:00:00Z')), false);
    assert.strictEqual(O.isOfferLive(offer({ endDate: '15/11/2026' }), product, tierPrice, at('2026-11-10T09:00:00Z')), false);
    assert.strictEqual(O.isOfferLive(offer({ offerPrice: '17.99' }), product, tierPrice, at('2026-11-10T09:00:00Z')), false);
  }],
  ['UK midnight, winter (GMT): live at 23:59:59 Sunday, gone at 00:00 Monday', function () {
    assert.strictEqual(O.isOfferLive(offer(), product, tierPrice, at('2026-11-15T23:59:59Z')), true);  // 23:59:59 Sun UK
    assert.strictEqual(O.isOfferLive(offer(), product, tierPrice, at('2026-11-16T00:00:00Z')), false); // 00:00 Mon UK
  }],
  ['UK midnight, summer (BST): uses UK time, not UTC', function () {
    var summer = offer({ endDate: '2026-07-05' }); // a Sunday in British Summer Time
    assert.strictEqual(O.isOfferLive(summer, product, tierPrice, at('2026-07-05T22:59:59Z')), true);  // 23:59:59 Sun UK
    assert.strictEqual(O.isOfferLive(summer, product, tierPrice, at('2026-07-05T23:00:00Z')), false); // 00:00 Mon UK, still Sunday in UTC
  }],
  ['UK date on a phone set to another time zone: still decided by UK time', function () {
    // 01:30 Monday in Spain is 00:30 Monday in the UK in winter: expired
    assert.strictEqual(O.isOfferLive(offer(), product, tierPrice, at('2026-11-16T00:30:00Z')), false);
  }],
  ['ends label for a later day: "Ends Sun 15 Nov"', function () {
    assert.strictEqual(O.endsLabel('2026-11-15', at('2026-11-10T09:00:00Z')), 'Ends Sun 15 Nov');
    assert.strictEqual(O.endsLabel('2026-11-22', at('2026-11-10T09:00:00Z')), 'Ends Sun 22 Nov');
  }]
];

var failed = 0;
cases.forEach(function (c) {
  try { c[1](); console.log('PASS  ' + c[0]); }
  catch (e) { failed++; console.log('FAIL  ' + c[0] + '\n      ' + e.message); }
});
console.log('\n' + (cases.length - failed) + ' of ' + cases.length + ' passed');
process.exit(failed ? 1 : 0);
