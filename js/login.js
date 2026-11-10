/* DC Flooring trade: fitter log in (login.html).
   The mobile + code steps live in js/login-flow.js (shared with the staff page).
   After sign in, the fitter's own row in public.accounts decides where they go:
     approved -> app.html; pending, rejected or suspended -> account-status.html;
     no row yet -> apply.html to finish signing up. */
(function () {
  'use strict';
  var S = window.DCSession;
  window.DCLoginFlow.mount({
    onSignedIn: function (user) {
      return S.loadAccount(user.id).then(function (account) {
        window.location.replace(S.routeFor(account));
      });
    }
  });
})();
