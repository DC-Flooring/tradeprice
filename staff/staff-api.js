/* DC Flooring trade: every Supabase call the staff Approvals screen makes.
   No UI code here. Each function returns a Promise of { data } or { error: kind }
   where kind is a short word the screen turns into plain wording. Raw error text
   never leaves this file, and nothing here logs phone numbers, codes or tokens.

   What protects the data is the database, not this page:
   - RLS on public.accounts lets staff (rows in public.staff) read and update every
     account; a fitter can only ever read their own row.
   - The protect trigger (002) stops anyone but staff changing tier, status,
     lightspeed_code and the other protected columns.
   - am_i_staff() (003) only answers for the signed-in user.
   Only the anon key from config.js is used. */
(function () {
  'use strict';

  var S = window.DCSession;
  function db() { return S.client(); }

  // Only the columns the screen shows or edits
  var COLUMNS = 'id, created_at, first_name, last_name, company_name, mobile, email, tier, discount_override, status, ' +
    'lightspeed_code, id_check, marketing_email, marketing_sms, marketing_consent_at, approved_by, approved_at, staff_notes';

  function kindOf(error) {
    if (!error) return 'other';
    var code = String(error.code || '');
    var msg = String(error.message || '').toLowerCase();
    if (code === '23505' || /duplicate key/.test(msg)) return /lightspeed/.test(msg) ? 'code-taken' : 'duplicate';
    if (code === '23514' || /check constraint/.test(msg)) return 'not-allowed-value';
    if (code === '42501' || /permission denied|row-level security/.test(msg)) return 'not-allowed';
    if (code === 'PGRST116') return 'not-found';
    if (/fetch|network|failed to/.test(msg) || (!code && !error.status)) return 'network';
    return 'other';
  }
  function wrap(promise) {
    return Promise.resolve(promise).then(function (r) {
      if (r.error) return { error: kindOf(r.error) };
      return { data: r.data };
    }, function (e) { return { error: kindOf(e) }; });
  }

  /* Is the signed-in user DC staff? Asks the database, never the page. */
  function amIStaff() {
    return wrap(db().rpc('am_i_staff')).then(function (r) {
      return r.error ? r : { data: r.data === true };
    });
  }

  /* Every account, newest first. RLS returns nothing to non-staff. */
  function listAccounts() {
    return wrap(db().from('accounts').select(COLUMNS).order('created_at', { ascending: false }).limit(1000));
  }

  function getAccount(id) {
    return wrap(db().from('accounts').select(COLUMNS).eq('id', id).single());
  }

  /* Save the fields staff can edit. Only these columns are ever sent. */
  function saveAccount(id, fields) {
    var row = {
      tier: fields.tier,
      discount_override: fields.discount_override,
      lightspeed_code: fields.lightspeed_code,
      id_check: fields.id_check,
      staff_notes: fields.staff_notes
    };
    return wrap(db().from('accounts').update(row).eq('id', id).select(COLUMNS).single());
  }

  /* Change status. Approving (or reactivating, which sets it back to approved) also
     records who approved it and when. fields: the editable fields as they are on
     screen, saved in the same request so nothing typed is lost. */
  function setStatus(id, status, staffUserId, fields) {
    var row = fields ? {
      tier: fields.tier,
      discount_override: fields.discount_override,
      lightspeed_code: fields.lightspeed_code,
      id_check: fields.id_check,
      staff_notes: fields.staff_notes
    } : {};
    row.status = status;
    if (status === 'approved') {
      row.approved_by = staffUserId;
      row.approved_at = new Date().toISOString();
    }
    return wrap(db().from('accounts').update(row).eq('id', id).select(COLUMNS).single());
  }

  /* The next free DC-#### code: one more than the highest DC- code in use.
     Starts at DC-1042 when there are none. */
  function nextDcCode() {
    return wrap(db().from('accounts').select('lightspeed_code').ilike('lightspeed_code', 'DC-%').limit(10000)).then(function (r) {
      if (r.error) return r;
      var max = 0;
      (r.data || []).forEach(function (row) {
        var m = /^DC-(\d+)$/i.exec(String(row.lightspeed_code || '').trim());
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      var next = max ? max + 1 : 1042;
      return { data: 'DC-' + String(next).padStart(4, '0') };
    });
  }

  function currentUserId() {
    return S.currentUser().then(function (u) { return u ? u.id : null; });
  }

  window.StaffAPI = {
    amIStaff: amIStaff,
    listAccounts: listAccounts,
    getAccount: getAccount,
    saveAccount: saveAccount,
    setStatus: setStatus,
    nextDcCode: nextDcCode,
    currentUserId: currentUserId
  };
})();
