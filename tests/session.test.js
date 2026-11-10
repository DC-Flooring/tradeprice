/* Tests for the pure sign-in helpers in js/session.js.
   Run from the repo root:  node tests/session.test.js   (no packages needed) */
'use strict';
var assert = require('assert');
var S = require('../js/session.js');

var cases = [
  ['mobile: 07 with spaces', function () { assert.strictEqual(S.normaliseMobile('07700 900123'), '+447700900123'); }],
  ['mobile: 07 no spaces', function () { assert.strictEqual(S.normaliseMobile('07700900123'), '+447700900123'); }],
  ['mobile: 7 without the 0', function () { assert.strictEqual(S.normaliseMobile('7700 900 123'), '+447700900123'); }],
  ['mobile: +447 with spaces', function () { assert.strictEqual(S.normaliseMobile('+44 7700 900123'), '+447700900123'); }],
  ['mobile: 447 and 00447', function () {
    assert.strictEqual(S.normaliseMobile('447700900123'), '+447700900123');
    assert.strictEqual(S.normaliseMobile('0044 7700 900123'), '+447700900123');
  }],
  ['mobile: dashes and brackets', function () { assert.strictEqual(S.normaliseMobile('(07700) 900-123'), '+447700900123'); }],
  ['mobile: landline, short, long and letters are not mobiles', function () {
    ['01642 123456', '0770090012', '077009001234', '+44 1642 123456', '07700 9OO123', '', '   '].forEach(function (v) {
      assert.strictEqual(S.normaliseMobile(v), '', v);
    });
  }],
  ['mobile: result always matches the database rule ^\\+447[0-9]{9}$', function () {
    ['07700 900123', '7700900123', '+447700900123'].forEach(function (v) { assert.ok(/^\+447[0-9]{9}$/.test(S.normaliseMobile(v))); });
  }],
  ['pretty mobile for the screen', function () { assert.strictEqual(S.prettyMobile('+447700900123'), '07700 900123'); }],
  ['route: approved -> home, pending/rejected/suspended -> status, none -> sign up', function () {
    assert.strictEqual(S.routeFor({ status: 'approved' }), 'app.html');
    assert.strictEqual(S.routeFor({ status: 'pending' }), 'account-status.html');
    assert.strictEqual(S.routeFor({ status: 'rejected' }), 'account-status.html');
    assert.strictEqual(S.routeFor({ status: 'suspended' }), 'account-status.html');
    assert.strictEqual(S.routeFor(null), 'apply.html?from=login');
  }],
  ['tiers: database names map to the site names', function () {
    assert.deepStrictEqual(S.TIER_FROM_DB, { trade: 'trade', trade_plus: 'tradePlus', trade_gold: 'tradeGold' });
  }],
  ['errors: wrong or expired code', function () {
    assert.strictEqual(S.friendlyError({ status: 403, code: 'otp_expired', message: 'Token has expired or is invalid' }, 'verify').kind, 'bad-code');
  }],
  ['errors: too many tries', function () {
    assert.strictEqual(S.friendlyError({ status: 429, code: 'over_sms_send_rate_limit', message: 'x' }, 'send').kind, 'rate');
  }],
  ['errors: network failure', function () {
    assert.strictEqual(S.friendlyError({ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' }, 'send').kind, 'network');
    assert.strictEqual(S.friendlyError(null, 'send').kind, 'network');
  }],
  ['errors: unknown number on log in', function () {
    assert.strictEqual(S.friendlyError({ status: 422, code: 'otp_disabled', message: 'Signups not allowed for otp' }, 'send').kind, 'unknown-number');
  }],
  ['errors: mobile already on another account', function () {
    assert.strictEqual(S.friendlyError({ status: 409, code: '23505', message: 'duplicate key value violates unique constraint "accounts_mobile_key"' }, 'data').kind, 'duplicate');
  }],
  ['errors: a database duplicate with no status is not mistaken for no signal', function () {
    assert.strictEqual(S.friendlyError({ code: '23505', message: 'duplicate key value violates unique constraint "accounts_mobile_key"' }, 'data').kind, 'duplicate');
  }],
  ['errors: never show raw error text', function () {
    var raw = { status: 400, code: 'weird', message: 'pq: column "secret" does not exist' };
    var f = S.friendlyError(raw, 'data');
    assert.ok(f.message.indexOf('secret') === -1 && f.message.indexOf('pq') === -1);
  }]
];
var failed = 0;
cases.forEach(function (c) {
  try { c[1](); console.log('PASS  ' + c[0]); } catch (e) { failed++; console.log('FAIL  ' + c[0] + '\n      ' + e.message); }
});
console.log('\n' + (cases.length - failed) + ' of ' + cases.length + ' passed');
process.exit(failed ? 1 : 0);
