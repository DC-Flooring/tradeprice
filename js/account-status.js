/* DC Flooring trade: the screen for signed-in fitters whose account is not approved.
   pending: "we're checking"; rejected or suspended: a neutral line, never the reason. */
(function () {
  'use strict';
  window.DCAccount.ready().then(function () {
    var status = window.DC_USER.status;
    if (status === 'approved') { window.location.replace('app.html'); return; }
    var pending = status === 'pending';
    document.getElementById('statusPending').hidden = !pending;
    document.getElementById('statusClosed').hidden = pending;
    document.title = (pending ? 'Nearly there' : 'Your account') + ' | DC Trade';
  });
})();
