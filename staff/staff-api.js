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
   - Staff notes live in public.account_staff and the change history in
     public.account_history (005); only staff can read either. The history is
     written by the database itself, never by this page.
   Staff log in with email and password; fitters use mobile + code elsewhere.
   Only the anon key from config.js is used. */
(function () {
  'use strict';

  var S = window.DCSession;
  function db() { return S.client(); }

  // Only the columns the screen shows or edits
  var COLUMNS = 'id, created_at, first_name, last_name, company_name, mobile, email, tier, discount_override, status, ' +
    'lightspeed_code, id_check, marketing_email, marketing_sms, marketing_consent_at, approved_by, approved_at';

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

  /* Staff log in with email and password (created by hand in Supabase).
     Returns { data: user } or { error: 'bad-login' | 'rate' | 'network' | 'other' }. */
  function signIn(email, password) {
    return Promise.resolve(db().auth.signInWithPassword({ email: email, password: password })).then(function (r) {
      if (!r.error && r.data && r.data.user) return { data: r.data.user };
      return { error: authKind(r.error) };
    }, function (e) { return { error: authKind(e) }; });
  }
  function authKind(error) {
    if (!error) return 'other';
    var status = typeof error.status === 'number' ? error.status : 0;
    var code = String(error.code || '').toLowerCase();
    var msg = String(error.message || '').toLowerCase();
    if (status === 429 || /rate_limit|too_many/.test(code) || /rate limit|too many/.test(msg)) return 'rate';
    if (/invalid_credentials|email_not_confirmed|user_not_found/.test(code) || /invalid login|not confirmed/.test(msg) || status === 400) return 'bad-login';
    if (/fetch|network|failed to/.test(msg) || !status) return 'network';
    return 'other';
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

  function accountRow(fields) {
    return {
      tier: fields.tier,
      discount_override: fields.discount_override,
      lightspeed_code: fields.lightspeed_code,
      id_check: fields.id_check
    };
  }

  /* Staff-only notes for one account ('' when there are none yet) */
  function getNotes(id) {
    return wrap(db().from('account_staff').select('notes').eq('account_id', id).maybeSingle()).then(function (r) {
      return r.error ? r : { data: (r.data && r.data.notes) || '' };
    });
  }
  function saveNotes(id, notes, staffUserId) {
    return wrap(db().from('account_staff').upsert(
      { account_id: id, notes: notes || null, updated_by: staffUserId, updated_at: new Date().toISOString() },
      { onConflict: 'account_id' }));
  }

  /* After the account row is saved, save the notes too, but only if they changed.
     Gives { data: account, notes } or, if only the notes failed, { data, notesError }. */
  function withNotes(id, fields, staffUserId) {
    return function (r) {
      if (r.error || !fields || fields.notes === undefined || fields.notes === fields.notesBefore) return r;
      return saveNotes(id, fields.notes, staffUserId).then(function (n) {
        return n.error ? { data: r.data, notesError: n.error } : { data: r.data, notes: fields.notes || '' };
      });
    };
  }

  /* Save the fields staff can edit. Only these columns are ever sent. */
  function saveAccount(id, fields, staffUserId) {
    return wrap(db().from('accounts').update(accountRow(fields)).eq('id', id).select(COLUMNS).single())
      .then(withNotes(id, fields, staffUserId));
  }

  /* Change status. Approving (or reactivating, which sets it back to approved) also
     records who approved it and when. fields: the editable fields as they are on
     screen, saved at the same time so nothing typed is lost. */
  function setStatus(id, status, staffUserId, fields) {
    var row = fields ? accountRow(fields) : {};
    row.status = status;
    if (status === 'approved') {
      row.approved_by = staffUserId;
      row.approved_at = new Date().toISOString();
    }
    return wrap(db().from('accounts').update(row).eq('id', id).select(COLUMNS).single())
      .then(withNotes(id, fields, staffUserId));
  }

  /* Everything that has happened to one account, newest first */
  function getHistory(id) {
    return wrap(db().from('account_history').select('id, changed_at, changed_by, action, changes')
      .eq('account_id', id).order('changed_at', { ascending: false }).order('id', { ascending: false }).limit(200));
  }

  /* Staff names, so the screen can say who did what */
  function listStaff() {
    return wrap(db().from('staff').select('id, name'));
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
    signIn: signIn,
    amIStaff: amIStaff,
    listAccounts: listAccounts,
    getAccount: getAccount,
    saveAccount: saveAccount,
    getNotes: getNotes,
    getHistory: getHistory,
    listStaff: listStaff,
    setStatus: setStatus,
    nextDcCode: nextDcCode,
    currentUserId: currentUserId
  };
})();
