/* DC Flooring trade: site settings. The ONLY place these values live.

   Paste your values between the quotes:
   - SUPABASE_URL:      Supabase dashboard > Project Settings > API > Project URL
                        (looks like https://abcdefghijkl.supabase.co)
   - SUPABASE_ANON_KEY: Supabase dashboard > Project Settings > API > the "anon" "public" key
                        (or the new "publishable" key). It is safe in a web page because
                        Row Level Security decides what it can see.
   - SITE_URL:          the live address of the site, with a trailing slash. Change this one
                        line when the site moves to Cloudflare.

   NEVER put the service_role key, a secret key or the database password in this file
   or anywhere else in this site. They would be visible to anyone. */

var SUPABASE_URL = 'https://modysflptentjxzwmzwu.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_m_CCtyHnZpOqMjdcJceAvQ_9zhFVxC8';
var SITE_URL = 'https://dc-flooring.github.io/tradeprice/';

window.DC_CONFIG = {
  SUPABASE_URL: SUPABASE_URL,
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
  SITE_URL: SITE_URL
};
