/*
 * End-to-end check of the DC Flooring trade site demo.
 *
 * Run (from the repo root):
 *   node demo/tests/journey.js
 * It starts its own static server on a free port, so nothing else is needed
 * except Playwright (npm i -D playwright, or the one preinstalled in CI images).
 *
 * Walks: apply -> staff approves as Trade Plus -> sign in as that customer and see
 * Trade Plus prices -> sign in as a Trade Gold customer and see different prices.
 * Runs at 390px and 1280px, checks for horizontal scroll and 44px tap targets,
 * and saves screenshots to demo/tests/screenshots.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const DEMO_DIR = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.otf': 'font/otf', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(DEMO_DIR, rel);
  if (!file.startsWith(DEMO_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(
    () => { results.push([true, name]); console.log('PASS ' + name); },
    (e) => { results.push([false, name + ' -> ' + e.message.split('\n')[0]]); console.log('FAIL ' + name + ' -> ' + e.message.split('\n')[0]); }
  );
}

const PAGES = ['index', 'apply', 'login', 'pricelist', 'staff'];
const APPLICANT = { business: 'Demo Applicant Flooring', name: 'Alex Applicant' };

async function priceOf(page, sku) {
  const text = await page.locator('tr:visible, li.pcard:visible').filter({ hasText: sku }).locator('.price').first().innerText();
  return text.replace(/[^\d.]/g, '');
}

async function noHorizontalScroll(page) {
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert.ok(m.sw <= m.cw, `horizontal scroll: scrollWidth ${m.sw} > clientWidth ${m.cw}`);
}

async function smallTargets(page) {
  return page.evaluate(() => {
    const sel = 'a.btn, button, .nav-link, .footer-links a, input:not([type=hidden]), select, textarea, .chip, summary';
    return [...document.querySelectorAll(sel)].filter((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[hidden]') && !el.closest('dialog:not([open])') && !el.closest('.skip-link');
    }).filter((el) => {
      // Checkboxes are 24px but their label row is the tap target.
      const box = el.type === 'checkbox' ? (el.closest('label') || el).getBoundingClientRect() : el.getBoundingClientRect();
      return box.height < 43.5 || box.width < 43.5;
    }).map((el) => (el.tagName + '.' + el.className + ' "' + (el.innerText || el.id || el.name || '').trim().slice(0, 30) + '" ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height)));
  });
}

async function runViewport(browser, base, width, height) {
  const tag = String(width);
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  const hosts = new Set(); const consoleErrors = [];
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    hosts.add(u.host);
    if (u.host.startsWith('127.0.0.1') || u.host.startsWith('localhost')) return route.continue();
    // Only Google Fonts is allowed. Abort it in the sandbox (no real fonts needed to test layout).
    return route.abort();
  });
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  const shot = (name, opts) => page.screenshot({ path: path.join(SHOTS, `${tag}-${name}.png`), fullPage: true, ...opts });
  const T = (name) => `[${tag}px] ${name}`;

  // ---------- Home ----------
  await page.goto(base + '/index.html');
  await page.waitForSelector('#sampleList .ptable tbody tr', { state: 'attached' });
  await check(T('home: hero, 5 category tiles, 5 sample rows, 3 offers, 3 guides, placeholders'), async () => {
    assert.ok(await page.getByRole('heading', { level: 1, name: /Flooring for the trade\. Ready when you are\./ }).isVisible());
    assert.strictEqual(await page.locator('#tiles .tile').count(), 5);
    assert.strictEqual(await page.locator('#sampleList .ptable tbody tr').count(), 5);
    assert.strictEqual(await page.locator('#offerCards .offer-card').count(), 3);
    assert.strictEqual(await page.locator('#guideCards .guide-card').count(), 3);
    assert.ok(await page.getByRole('link', { name: 'Open an account to see the full list' }).isVisible());
    const body = await page.locator('body').innerText();
    // innerText applies CSS text-transform, so compare case-insensitively.
    for (const p of ['[PHONE]', '[ADDRESS]', '[OPENING HOURS]', '[TRADE OFFER WORDING]', 'Ends [DATE]']) assert.ok(body.toLowerCase().includes(p.toLowerCase()), 'missing ' + p);
  });
  await shot('index');

  // ---------- Apply ----------
  await page.goto(base + '/apply.html');
  await check(T('apply: marketing box is unticked, terms required, no ID/document fields'), async () => {
    assert.strictEqual(await page.getByLabel(/Send me offers/).isChecked(), false);
    assert.strictEqual(await page.getByLabel(/I agree to the/).getAttribute('required') !== null, true);
    assert.strictEqual(await page.locator('input[type=file]').count(), 0);
    assert.strictEqual(await page.getByLabel(/VAT number/).getAttribute('required'), null);
  });
  await check(T('apply: submitting without ticking terms does not save'), async () => {
    await page.getByLabel('Business name').fill('Should Not Save');
    await page.getByRole('button', { name: 'Send my application' }).click();
    assert.ok(await page.locator('#applyForm').isVisible());
    assert.ok(!(await page.evaluate(() => localStorage.getItem('dcDemo.state.v1') || '')).includes('Should Not Save'));
  });
  await page.getByLabel('Business name').fill(APPLICANT.business);
  await page.getByLabel('Trade type').selectOption('fitter');
  await page.getByLabel('Contact name').fill(APPLICANT.name);
  await page.getByLabel('Phone').fill('07700 900999');
  await page.getByLabel('Email', { exact: true }).fill('alex@example.com');
  await page.getByLabel('Postcode').fill('ab1 2cd');
  await page.getByLabel('Expected monthly spend').selectOption('£500 to £1,500');
  await page.getByLabel(/I agree to the/).check();
  await shot('apply');
  await page.getByRole('button', { name: 'Send my application' }).click();
  await check(T('apply: thank-you shown, saved as pending in localStorage'), async () => {
    await page.getByRole('heading', { name: /Thank you, Alex Applicant/ }).waitFor();
    assert.ok(await page.getByText('What happens next').isVisible());
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dcDemo.state.v1')).accounts.find((a) => a.businessName === 'Demo Applicant Flooring'));
    assert.strictEqual(saved.status, 'pending');
    assert.strictEqual(saved.marketingOptIn, false);
    assert.strictEqual(saved.termsAccepted, true);
    assert.strictEqual(saved.postcode, 'AB1 2CD');
  });
  await check(T('apply: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('apply-thanks');

  // ---------- Pricelist guard ----------
  await check(T('pricelist: redirects to login when nobody is signed in'), async () => {
    await page.goto(base + '/pricelist.html');
    await page.waitForURL('**/login.html');
  });

  // ---------- Login: pending / rejected ----------
  await check(T('login: pending shows waiting message; rejected shows polite message'), async () => {
    await page.goto(base + '/login.html');
    assert.ok(await page.locator('#customer optgroup').count() >= 3);
    await page.getByLabel('Demo customer').selectOption({ label: 'Lee Wong, Willow Lane Flooring' });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('Your account is waiting for approval').waitFor();
    await shot('login-pending');
    await page.getByLabel('Demo customer').selectOption({ label: 'Chris Fenwick, Fenwick Home Improvements' });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText(/not able to set up a trade account/).waitFor();
    assert.ok(!page.url().includes('pricelist'));
  });
  await page.goto(base + '/login.html');
  await check(T('login: the new applicant is still pending before approval'), async () => {
    await page.getByLabel('Demo customer').selectOption({ label: `${APPLICANT.name}, ${APPLICANT.business}` });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('Your account is waiting for approval').waitFor();
  });
  await check(T('login: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('login');

  // ---------- Staff ----------
  await page.goto(base + '/staff.html');
  await check(T('staff: labelled "Demo staff login"; any password works'), async () => {
    assert.ok(await page.getByText('Demo staff login').first().isVisible());
    await shot('staff-login');
    await page.locator('#staffForm').getByLabel('Email').fill('anyone@example.com');
    await page.locator('#staffForm').getByLabel('Password').fill('literally anything');
    await page.locator('#staffForm').getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('heading', { name: 'Trade applications' }).waitFor();
  });
  await check(T('staff: 5 pending (4 seeded + new), tabs show counts'), async () => {
    assert.strictEqual(await page.locator('li.acct').count(), 5);
    assert.ok(await page.getByRole('button', { name: /^Pending\s*5$/ }).isVisible());
    assert.ok(await page.getByRole('button', { name: /^All\s*10$/ }).isVisible());
  });
  await shot('staff');
  const card = page.locator('li.acct', { hasText: APPLICANT.business });
  await check(T('staff: approve is blocked until ID check is ticked'), async () => {
    await card.getByLabel('Tier').selectOption('plus');
    await card.getByRole('button', { name: /^Approve/ }).click();
    await card.getByText(/Tick "ID and proof of trade checked"/).waitFor();
    assert.strictEqual(await card.locator('.status-pending').count(), 1);
  });
  await check(T('staff: ticking ID check stamps today and "Staff member"'), async () => {
    await card.getByLabel('ID and proof of trade checked').check();
    const stamp = await card.locator('[data-stamp]').innerText();
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    assert.ok(stamp.includes(today) && stamp.includes('Staff member'), stamp);
    await card.getByLabel(/Notes/).fill('Seen van and insurance. Demo note.');
  });
  await shot('staff-review');
  await check(T('staff: approve as Trade Plus moves it to Approved'), async () => {
    await card.getByRole('button', { name: /^Approve/ }).click();
    await page.getByRole('button', { name: /^Pending\s*4$/ }).waitFor();
    await page.getByRole('button', { name: /^Approved/ }).click();
    const approved = page.locator('li.acct', { hasText: APPLICANT.business });
    assert.ok(await approved.locator('.status-approved').isVisible());
    assert.ok(await approved.locator('.badge-plus').isVisible());
    assert.ok((await approved.innerText()).includes('by Staff member'));
  });
  await check(T('staff: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('staff-approved');

  // ---------- Sign in as the Trade Plus applicant ----------
  const prices = {};
  await check(T('pricelist: approved applicant sees Trade Plus prices'), async () => {
    await page.goto(base + '/login.html');
    await page.getByLabel('Demo customer').selectOption({ label: `${APPLICANT.name}, ${APPLICANT.business} (Trade Plus)` });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/pricelist.html');
    await page.waitForSelector('tr:visible, li.pcard:visible');
    assert.ok(await page.getByRole('heading', { level: 1, name: /Welcome, Alex Applicant/ }).isVisible());
    assert.ok(await page.locator('.account-card .badge-plus').isVisible());
    prices.plus = await priceOf(page, 'SMP-001');
    assert.strictEqual(prices.plus, '14.20');
    assert.strictEqual(await priceOf(page, 'SMP-011'), '27.10');
  });
  await check(T('pricelist: next-tier nudge shows spend left to Trade Gold'), async () => {
    const t = await page.locator('#nudge').innerText();
    assert.ok(/Spend £15,000 more to unlock Trade Gold/.test(t), t);
    assert.strictEqual(await page.locator('#nudge [role=progressbar]').getAttribute('aria-valuenow'), '0');
  });
  await check(T('pricelist: search, chips with counts, empty state'), async () => {
    await page.getByLabel('Search products').fill('oak');
    // Oak: Oak Plank LVT, Natural Oak, Grey Oak = 3 products
    assert.ok(await page.getByText('Showing 3 of 14 products').isVisible());
    assert.ok(await page.getByRole('button', { name: /^Laminate\s*2$/ }).isVisible());
    assert.ok(await page.getByRole('button', { name: /^Carpet\s*0$/ }).isVisible());
    await page.getByRole('button', { name: /^Laminate/ }).click();
    assert.ok(await page.getByText('Showing 2 of 14 products').isVisible());
    await page.getByLabel('Search products').fill('zzzz');
    await page.getByText('No products match').waitFor();
    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    assert.ok(await page.getByText('Showing 14 of 14 products').isVisible());
  });
  await check(T('pricelist: stock tags use words, all three kinds present'), async () => {
    const t = await page.locator('main').innerText();
    for (const s of ['In stock', 'Low stock', 'Order in']) assert.ok(t.includes(s), s);
  });
  await check(T('pricelist: filter bar stays stuck while scrolling'), async () => {
    await page.evaluate(() => window.scrollTo(0, 900));
    const top = await page.locator('.filter-bar').evaluate((el) => Math.round(el.getBoundingClientRect().top));
    assert.strictEqual(top, 0);
    await shot('pricelist-scrolled', { fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 0));
  });
  await check(T('pricelist: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('pricelist-plus');

  // ---------- Sign out, then Gold and Trade for comparison ----------
  await check(T('pricelist: Sign out link works and the list is protected again'), async () => {
    await page.getByRole('link', { name: 'Sign out' }).click();
    await page.waitForURL('**/index.html');
    await page.goto(base + '/pricelist.html');
    await page.waitForURL('**/login.html');
  });
  await check(T('pricelist: Trade Gold customer sees different (lower) prices, top-tier message'), async () => {
    await page.getByLabel('Demo customer').selectOption({ label: 'Dan Okafor, Northgate Lettings and Maintenance (Trade Gold)' });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/pricelist.html');
    await page.waitForSelector('tr:visible, li.pcard:visible');
    prices.gold = await priceOf(page, 'SMP-001');
    assert.strictEqual(prices.gold, '13.50');
    assert.notStrictEqual(prices.gold, prices.plus);
    assert.ok(Number(prices.gold) < Number(prices.plus));
    assert.ok(await page.getByText('You are on our top tier').isVisible());
    assert.ok(await page.locator('.account-card .badge-gold').isVisible());
  });
  await shot('pricelist-gold');
  await check(T('pricelist: Trade customer sees entry prices and a nudge'), async () => {
    await page.getByRole('link', { name: 'Sign out' }).click();
    await page.goto(base + '/login.html');
    await page.getByLabel('Demo customer').selectOption({ label: 'Jo Bennett, Ridgeway Property Services (Trade)' });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/pricelist.html');
    await page.waitForSelector('tr:visible, li.pcard:visible');
    assert.strictEqual(await priceOf(page, 'SMP-001'), '14.90');
    assert.ok(/Spend £400 more to unlock Trade Plus/.test(await page.locator('#nudge').innerText()));
    await page.getByRole('link', { name: 'Sign out' }).click();
  });

  // ---------- Staff: walk-in and reset ----------
  await check(T('staff: Add account (walk-in) approves straight away; Reset demo data restores seed'), async () => {
    await page.goto(base + '/staff.html');
    await page.getByRole('button', { name: 'Add account' }).click();
    const d = page.locator('#addDialog');
    await d.getByLabel('Business name').fill('Walk In Tiling');
    await d.getByLabel('Trade type').selectOption('builder');
    await d.getByLabel('Contact name').fill('Pat Walker');
    await d.getByLabel('Phone').fill('07700 900888');
    await d.getByLabel('Email').fill('pat@example.com');
    await d.getByLabel('Postcode').fill('AB9 9ZZ');
    await d.getByLabel('Expected monthly spend').selectOption('Under £500');
    await d.getByLabel('Tier').selectOption('gold');
    await shot('staff-add-panel', { fullPage: false });
    await d.getByRole('button', { name: 'Approve and add' }).click();
    await d.getByText(/Tick|ID and proof/).first().waitFor();
    assert.ok(await d.getByText('Tick "ID and proof of trade checked" before approving.').isVisible());
    await d.getByLabel('ID and proof of trade checked').check();
    await d.getByRole('button', { name: 'Approve and add' }).click();
    await page.locator('li.acct', { hasText: 'Walk In Tiling' }).locator('.badge-gold').waitFor();
    await page.getByRole('button', { name: 'Reset demo data' }).click();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('button', { name: /^All\s*9$/ }).waitFor();
    assert.ok(!(await page.locator('main').innerText()).includes('Walk In Tiling'));
  });

  // ---------- Page-wide checks ----------
  for (const name of PAGES) {
    await page.goto(`${base}/${name}.html`);
    if (name === 'pricelist') { // needs a session for this check
      await page.evaluate(() => localStorage.setItem('dcDemo.session.v1', JSON.stringify({ accountId: 'c-plus' })));
      await page.goto(`${base}/pricelist.html`);
    }
    await page.waitForTimeout(150);
    await check(T(`${name}: noindex meta, demo banner, <html lang>`), async () => {
      assert.strictEqual(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex');
      assert.strictEqual((await page.locator('.demo-banner').innerText()).trim(), 'Demo: sample data only');
      assert.strictEqual(await page.locator('html').getAttribute('lang'), 'en-GB');
    });
    await check(T(`${name}: no horizontal scroll`), () => noHorizontalScroll(page));
    await check(T(`${name}: tap targets at least 44px`), async () => {
      const small = await smallTargets(page);
      assert.deepStrictEqual(small, []);
    });
    await check(T(`${name}: visible keyboard focus ring`), async () => {
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return cs.outlineStyle + ' ' + cs.outlineWidth; });
      assert.ok(/solid 3px/.test(ring), ring);
    });
    if (name === 'staff') await shot('staff-signed-in-reset');
  }

  await check(T('no requests except this site and Google Fonts; no console or page errors'), async () => {
    const outside = [...hosts].filter((h) => !/^(127\.0\.0\.1|localhost)/.test(h) && !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    assert.deepStrictEqual(outside, []);
    assert.deepStrictEqual(consoleErrors, []);
  });
  await ctx.close();
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    for (const [w, h] of [[390, 844], [1280, 800]]) await runViewport(browser, base, w, h);
  } finally {
    await browser.close(); server.close();
  }
  const failed = results.filter((r) => !r[0]);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
