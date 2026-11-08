/*
 * End-to-end check of the DC Flooring trade site demo.
 *
 * Run (from the repo root):
 *   node demo/tests/journey.js
 * It starts its own static server on a free port, so nothing else is needed
 * except Playwright (npm i -D playwright, or the one preinstalled in CI images).
 *
 * Walks: apply -> staff approves as Trade Plus -> sign in as that customer and see
 * Trade Plus prices -> open a range page -> flip the demo tier switcher -> sign in as a
 * Trade Gold customer and see different prices. Runs at 390px and 1280px.
 * Also audits typography (prices), colour contrast, horizontal scroll, tap targets,
 * and the style rules (no em dashes, no gradients, no uppercase transforms).
 * Screenshots go to demo/tests/screenshots.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEMO_DIR = path.join(ROOT, 'demo');
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.ttf': 'font/ttf' };
// Serves the repo root, like GitHub Pages does, so the demo lives at /demo/.
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  let file = path.join(ROOT, rel);
  if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(
    () => { results.push([true, name]); console.log('PASS ' + name); },
    (e) => { results.push([false, name + ' -> ' + e.message.split('\n').slice(0, 3).join(' | ')]); console.log('FAIL ' + name + ' -> ' + e.message.split('\n').slice(0, 3).join(' | ')); }
  );
}

const PAGES = ['index', 'apply', 'login', 'pricelist', 'range', 'staff'];
const APPLICANT = { business: 'Demo Applicant Flooring', name: 'Alex Applicant' };

const priceOf = async (page, rangeName) =>
  (await page.locator('.range-row').filter({ hasText: rangeName }).locator('.price').first().innerText()).replace(/[^\d.]/g, '');

async function noHorizontalScroll(page) {
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert.ok(m.sw <= m.cw, `horizontal scroll: scrollWidth ${m.sw} > clientWidth ${m.cw}`);
}

async function smallTargets(page) {
  return page.evaluate(() => {
    const sel = 'a.btn, button, .nav-link, .footer-links a, .back-link, a.range-row, input:not([type=hidden]), select, textarea, .chip';
    return [...document.querySelectorAll(sel)].filter((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[hidden]') && !el.closest('dialog:not([open])') && !el.closest('.skip-link');
    }).filter((el) => {
      const box = el.type === 'checkbox' ? (el.closest('label') || el).getBoundingClientRect() : el.getBoundingClientRect();
      return box.height < 43.5 || box.width < 43.5;
    }).map((el) => `${el.tagName}.${el.className} "${(el.innerText || el.id || el.name || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
  });
}

// Prices and numbers: one sans-serif, tabular figures, weight 500, size floors.
async function typographyAudit(page, { rangePage = false } = {}) {
  return page.evaluate((rangePage) => {
    const bad = [];
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
    for (const el of document.querySelectorAll('.price, .price-unit, .count, .now, .was')) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el); const tag = `${el.className} "${el.innerText.trim().slice(0, 20)}"`;
      if (/auttera|singel/i.test(cs.fontFamily)) bad.push('display font on ' + tag);
      if (!/tabular-nums/.test(cs.fontVariantNumeric)) bad.push('no tabular-nums on ' + tag);
      if (/\b(price|count|now|was)\b/.test(el.className) && !el.classList.contains('price-unit') && cs.fontWeight !== '500') bad.push('weight ' + cs.fontWeight + ' on ' + tag);
      if (parseFloat(cs.fontSize) < 14) bad.push(cs.fontSize + ' on ' + tag);
      if (rangePage && el.matches('.price-xl .price') && parseFloat(cs.fontSize) < 24) bad.push('range price under 24px: ' + cs.fontSize);
    }
    if (rangePage && !document.querySelector('.price-xl .price')) bad.push('no main price found');
    return bad;
  }, rangePage);
}

// WCAG AA contrast for every visible text element. Large text (24px, or 18.66px bold) needs 3:1, the rest 4.5:1.
async function contrastAudit(page) {
  return page.evaluate(() => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0.95) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || el.closest('[hidden], dialog:not([open]), .sr-only, .skip-link, script, style, option')) continue;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') continue;
      const fg = parse(cs.color); const bg = bgOf(el); if (!fg) continue;
      const l1 = lum(fg), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (ratio < need) bad.push(`${ratio.toFixed(2)} < ${need} on ${el.tagName}.${el.className} "${el.innerText.trim().slice(0, 24)}"`);
    }
    return bad;
  });
}

async function runViewport(browser, origin, width, height) {
  const base = origin + '/demo';
  const tag = String(width);
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  const hosts = new Set(); const consoleErrors = [];
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    hosts.add(u.host);
    if (u.host.startsWith('127.0.0.1') || u.host.startsWith('localhost')) return route.continue();
    return route.abort(); // Google Fonts only; blocked in the sandbox, layout does not need it
  });
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource/.test(m.text())) consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  const shot = (name, opts) => page.screenshot({ path: path.join(SHOTS, `${tag}-${name}.png`), fullPage: true, ...opts });
  const T = (name) => `[${tag}px] ${name}`;
  const signInAs = async (label) => {
    await page.goto(base + '/login.html');
    await page.getByLabel('Demo customer').selectOption({ label });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/pricelist.html');
    await page.waitForSelector('.range-row');
  };
  const viewAs = (name) => page.getByRole('radiogroup', { name: 'Demo: view as' }).getByRole('radio', { name, exact: true }).check();

  // ---------- Root link ----------
  if (tag === '1280') {
    await check(T('root: the plain GitHub Pages link redirects to the demo'), async () => {
      await page.goto(origin + '/');
      await page.waitForURL('**/demo/');
      await page.getByRole('heading', { level: 1, name: /Flooring for the trade/ }).waitFor();
    });
  }

  // ---------- Home ----------
  await page.goto(base + '/index.html');
  await page.waitForSelector('#sampleList .range-row');
  await check(T('home: hero, 6 category tiles, 5 sample ranges at Trade level, 3 offers, 3 guides, placeholders'), async () => {
    assert.ok(await page.getByRole('heading', { level: 1, name: /Flooring for the trade\. Ready when you are\./ }).isVisible());
    assert.strictEqual(await page.locator('#tiles .tile').count(), 6);
    assert.strictEqual(await page.locator('#sampleList .range-row').count(), 5);
    assert.strictEqual(await page.locator('#sampleList a').count(), 0, 'sample rows must not link while logged out');
    assert.strictEqual(await priceOf(page, 'Harbour twist'), '11.40');
    assert.strictEqual(await page.locator('#switcher, .demo-switch').count(), 0, 'no tier switcher for logged-out visitors');
    assert.strictEqual(await page.locator('#offerCards .offer-card').count(), 3);
    assert.strictEqual(await page.locator('#guideCards .guide-card').count(), 3);
    assert.ok(await page.getByRole('link', { name: 'Open an account to see the full list' }).isVisible());
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const p of ['[PHONE]', '[ADDRESS]', '[OPENING HOURS]', '[TRADE OFFER WORDING]', 'Ends [DATE]']) assert.ok(body.includes(p.toLowerCase()), 'missing ' + p);
  });
  await check(T('home: offers show unit and ex VAT'), async () => {
    const t = await page.locator('#offerCards').innerText();
    assert.ok(/per roll ex VAT/.test(t) && /per m² ex VAT/.test(t) && /each ex VAT/.test(t), t);
  });
  await shot('home');

  // ---------- Apply ----------
  await page.goto(base + '/apply.html');
  await check(T('apply: marketing box is unticked, terms required, no ID/document fields'), async () => {
    assert.strictEqual(await page.getByLabel(/Send me offers/).isChecked(), false);
    assert.notStrictEqual(await page.getByLabel(/I agree to the/).getAttribute('required'), null);
    assert.strictEqual(await page.locator('input[type=file]').count(), 0);
    assert.strictEqual(await page.getByLabel(/VAT number/).getAttribute('required'), null);
  });
  await check(T('apply: submitting without ticking terms does not save'), async () => {
    await page.getByLabel('Business name').fill('Should Not Save');
    await page.getByRole('button', { name: 'Send my application' }).click();
    assert.ok(await page.locator('#applyForm').isVisible());
    assert.ok(!(await page.evaluate(() => localStorage.getItem('dcDemo.state.v2') || '')).includes('Should Not Save'));
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
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dcDemo.state.v2')).accounts.find((a) => a.businessName === 'Demo Applicant Flooring'));
    assert.strictEqual(saved.status, 'pending');
    assert.strictEqual(saved.marketingOptIn, false);
    assert.strictEqual(saved.termsAccepted, true);
    assert.strictEqual(saved.postcode, 'AB1 2CD');
  });
  await check(T('apply: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('apply-thanks');

  // ---------- Guards ----------
  await check(T('pricelist and range pages redirect to login when nobody is signed in'), async () => {
    await page.goto(base + '/pricelist.html'); await page.waitForURL('**/login.html');
    await page.goto(base + '/range.html?id=harbour-twist'); await page.waitForURL('**/login.html');
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
    await card.getByLabel('Tier').selectOption('tradePlus');
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
    assert.ok(await approved.locator('.badge-tradePlus').isVisible());
    assert.ok((await approved.innerText()).includes('by Staff member'));
  });
  await check(T('staff: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('staff-approved');

  // ---------- The approved Trade Plus customer ----------
  const prices = {};
  await check(T('list: approved applicant sees Trade Plus prices with unit and ex VAT'), async () => {
    await signInAs(`${APPLICANT.name}, ${APPLICANT.business} (Trade Plus)`);
    assert.ok(await page.getByRole('heading', { level: 1, name: /Welcome, Alex Applicant/ }).isVisible());
    assert.ok(await page.locator('.account-card .badge-tradePlus').isVisible());
    prices.plus = await priceOf(page, 'Harbour twist');
    assert.strictEqual(prices.plus, '10.85');
    assert.strictEqual(await priceOf(page, 'Comfort 9mm foam underlay'), '27.10');
    const row = await page.locator('.range-row').filter({ hasText: 'Harbour twist' }).innerText();
    assert.ok(/£10\.85\s+per m² ex VAT/.test(row), row);
    assert.ok(/per roll ex VAT/.test(await page.locator('.range-row').filter({ hasText: 'Comfort' }).innerText()));
    assert.ok(/each ex VAT/.test(await page.locator('.range-row').filter({ hasText: 'door bars' }).innerText()));
  });
  await check(T('list: row shows swatch, bold name, category + two specs + colour count, price, stock'), async () => {
    const row = page.locator('.range-row').filter({ hasText: 'Harbour twist' });
    const sw = await row.locator('.swatch').boundingBox();
    assert.ok(Math.round(sw.width) === 40 && Math.round(sw.height) === 40, `swatch ${sw.width}x${sw.height}`);
    assert.strictEqual(await row.locator('.swatch').evaluate((e) => getComputedStyle(e).backgroundColor), 'rgb(217, 205, 182)'); // first colourway #d9cdb6
    assert.ok(Number(await row.locator('.range-name').evaluate((e) => getComputedStyle(e).fontWeight)) >= 600);
    assert.strictEqual((await row.locator('.range-sub').innerText()).trim(), 'Carpet · 4m and 5m widths · Heavy domestic · 8 colours');
    assert.strictEqual(await page.locator('.range-row').count(), 8);
  });
  await check(T('list: row layout (wide: one line of columns; narrow: price and stock stacked under the name)'), async () => {
    const row = page.locator('.range-row').filter({ hasText: 'Harbour twist' });
    const n = await row.locator('.range-name').boundingBox(), p = await row.locator('.range-price').boundingBox(), s = await row.locator('.range-stock').boundingBox();
    if (width >= 760) {
      assert.ok(p.x > n.x + n.width - 1 && s.x > p.x, 'columns should sit side by side');
    } else {
      const sub = await row.locator('.range-sub').boundingBox();
      assert.ok(p.y >= sub.y + sub.height - 1 && s.y >= p.y + p.height - 1, 'price then stock should stack under the name');
      assert.ok(Math.abs(p.x - n.x) < 2 && Math.abs(s.x - n.x) < 2, 'stacked items align with the name');
    }
  });
  await check(T('list: stock wording and colours (green in stock, amber order in, grey out of stock)'), async () => {
    const t = await page.locator('main').innerText();
    for (const s of ['In stock, cut today', 'Order in 5 days', 'Order in 3 days', 'Order in 10 days', 'Out of stock']) assert.ok(t.includes(s), s);
    const colour = (sel) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).color);
    const [g, a, o] = [await colour('.stock-in'), await colour('.stock-order'), await colour('.stock-out')];
    assert.strictEqual(new Set([g, a, o]).size, 3, [g, a, o].join(' / '));
    assert.strictEqual(await page.locator('.stock-in').count(), 4);
    assert.strictEqual(await page.locator('.stock-order').count(), 3);
    assert.strictEqual(await page.locator('.stock-out').count(), 1);
  });
  await check(T('list: next-tier nudge shows spend left to Trade Gold'), async () => {
    const t = await page.locator('#nudge').innerText();
    assert.ok(/Spend £15,000 more to unlock Trade Gold/.test(t), t);
    assert.strictEqual(await page.locator('#nudge [role=progressbar]').getAttribute('aria-valuenow'), '0');
  });
  await check(T('list: name search, category chips with counts, empty state'), async () => {
    await page.getByLabel('Search ranges').fill('laminate');
    assert.ok(await page.getByText('Showing 2 of 8 ranges').isVisible());
    assert.ok(await page.getByRole('button', { name: /^Laminate\s*2$/ }).isVisible());
    assert.ok(await page.getByRole('button', { name: /^Carpet\s*0$/ }).isVisible());
    await page.getByLabel('Search ranges').fill('');
    await page.getByRole('button', { name: /^LVT/ }).click();
    assert.ok(await page.getByText('Showing 1 of 8 ranges').isVisible());
    await page.getByRole('button', { name: /^Carpet/ }).click();
    assert.ok(await page.getByText('Showing 2 of 8 ranges').isVisible());
    await page.getByLabel('Search ranges').fill('zzzz');
    await page.getByText('No ranges match').waitFor();
    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    assert.ok(await page.getByText('Showing 8 of 8 ranges').isVisible());
  });
  await check(T('list: filter bar stays stuck while scrolling'), async () => {
    await page.evaluate(() => window.scrollTo(0, 900));
    assert.strictEqual(await page.locator('.filter-bar').evaluate((el) => Math.round(el.getBoundingClientRect().top)), 0);
    await shot('list-scrolled', { fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 0));
  });
  await check(T('list: typography and contrast'), async () => {
    assert.deepStrictEqual(await typographyAudit(page), []);
    assert.deepStrictEqual(await contrastAudit(page), []);
  });
  await check(T('list: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('list-tradeplus');

  // ---------- Range page ----------
  await check(T('range: clicking a row opens the range page with details'), async () => {
    await page.locator('.range-row').filter({ hasText: 'Harbour twist' }).click();
    await page.waitForURL('**/range.html?id=harbour-twist');
    assert.ok(await page.getByRole('heading', { level: 1, name: 'Harbour twist' }).isVisible());
    assert.strictEqual((await page.locator('.category-label').innerText()).trim(), 'Carpet');
    const chips = await page.locator('.spec-chips li').allInnerTexts();
    assert.deepStrictEqual(chips, ['4m and 5m widths', 'Heavy domestic', 'Action back']);
    assert.ok(await page.getByRole('heading', { name: '8 colourways' }).isVisible());
    assert.strictEqual(await page.locator('.sw-btn').count(), 8);
    assert.ok(await page.getByRole('link', { name: 'Back to the list' }).isVisible());
  });
  await check(T('range: two columns on wide screens, stacked on narrow'), async () => {
    const h = await page.locator('#hero').boundingBox(), d = await page.locator('.range-detail').boundingBox();
    if (width >= 860) assert.ok(d.x > h.x + h.width - 1 && Math.abs(d.y - h.y) < 40, 'hero left, details right');
    else assert.ok(d.y >= h.y + h.height - 1 && Math.abs(d.x - h.x) < 2, 'details under hero');
  });
  await check(T('range: swatches are clickable, selected one is outlined and named'), async () => {
    assert.ok(await page.locator('.colour-name').innerText().then((t) => /Colour: Oatmeal/.test(t)));
    await page.getByRole('button', { name: 'Mink', exact: true }).click();
    assert.ok(/Colour: Mink/.test(await page.locator('.colour-name').innerText()));
    assert.strictEqual(await page.locator('.sw-btn[aria-pressed="true"]').count(), 1);
    assert.strictEqual(await page.getByRole('button', { name: 'Mink', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.ok((await page.getByRole('button', { name: 'Mink', exact: true }).evaluate((e) => getComputedStyle(e).boxShadow)) !== 'none');
    assert.strictEqual(await page.locator('#hero').evaluate((e) => getComputedStyle(e).backgroundColor), 'rgb(142, 124, 107)'); // #8e7c6b falls back to the hex
  });
  await check(T('range: big price with unit and ex VAT, "Your price · tier" pill, stock'), async () => {
    const t = await page.locator('.range-detail').innerText();
    assert.ok(/£10\.85/.test(t) && /per m² ex VAT/.test(t), t);
    assert.ok(await page.locator('.tier-pill').innerText().then((x) => x.trim() === 'Your price · Trade Plus'));
    assert.ok(/In stock, cut today/.test(t));
    assert.deepStrictEqual(await typographyAudit(page, { rangePage: true }), []);
  });
  await check(T('range: contrast'), async () => assert.deepStrictEqual(await contrastAudit(page), []));
  await check(T('range: no horizontal scroll'), () => noHorizontalScroll(page));
  await shot('range');

  // ---------- Demo tier switcher ----------
  await check(T('switcher: "Demo: view as" flips tier and price on the range page'), async () => {
    assert.ok(await page.getByText('Demo: view as').isVisible());
    await viewAs('Trade Gold');
    assert.ok(/£10\.30/.test(await page.locator('.range-detail').innerText()));
    assert.strictEqual((await page.locator('.tier-pill').innerText()).trim(), 'Your price · Trade Gold');
    assert.ok(/Colour: Mink/.test(await page.locator('.colour-name').innerText()), 'selected colour survives a tier change');
    await viewAs('Trade');
    assert.ok(/£11\.40/.test(await page.locator('.range-detail').innerText()));
    assert.strictEqual((await page.locator('.tier-pill').innerText()).trim(), 'Your price · Trade');
    prices.trade = '11.40';
  });
  await check(T('switcher: choice carries back to the list; nudge follows the viewed tier'), async () => {
    await page.getByRole('link', { name: 'Back to the list' }).click();
    await page.waitForURL('**/pricelist.html');
    await page.waitForSelector('.range-row');
    assert.strictEqual(await priceOf(page, 'Harbour twist'), '11.40');
    assert.ok(await page.locator('.account-card .badge-trade').isVisible());
    assert.ok(/this account is really Trade Plus/.test(await page.locator('#account').innerText()));
    await viewAs('Trade Gold');
    assert.strictEqual(await priceOf(page, 'Harbour twist'), '10.30');
    assert.ok(await page.getByText('You are on our top tier').isVisible());
    await viewAs('Trade Plus');
    assert.strictEqual(await priceOf(page, 'Harbour twist'), '10.85');
  });
  await shot('list-switcher', { fullPage: false });

  // ---------- Sign out, then Gold and Trade for comparison ----------
  await check(T('Sign out link works, the list is protected again, switcher choice is cleared'), async () => {
    await viewAs('Trade Gold');
    await page.getByRole('link', { name: 'Sign out' }).click();
    await page.waitForURL('**/index.html');
    await page.goto(base + '/pricelist.html'); await page.waitForURL('**/login.html');
  });
  await check(T('Trade Gold customer sees different (lower) prices and the top-tier message'), async () => {
    await signInAs('Dan Okafor, Northgate Lettings and Maintenance (Trade Gold)');
    prices.gold = await priceOf(page, 'Harbour twist');
    assert.strictEqual(prices.gold, '10.30', 'a fresh sign-in starts on the real tier, not the earlier demo choice');
    assert.notStrictEqual(prices.gold, prices.plus);
    assert.ok(Number(prices.gold) < Number(prices.plus));
    assert.ok(await page.getByText('You are on our top tier').isVisible());
    assert.ok(await page.locator('.account-card .badge-tradeGold').isVisible());
  });
  await shot('list-gold');
  await check(T('Trade customer sees entry prices and a nudge'), async () => {
    await page.getByRole('link', { name: 'Sign out' }).click();
    await signInAs('Jo Bennett, Ridgeway Property Services (Trade)');
    assert.strictEqual(await priceOf(page, 'Harbour twist'), '11.40');
    assert.ok(/Spend £400 more to unlock Trade Plus/.test(await page.locator('#nudge').innerText()));
    await page.getByRole('link', { name: 'Sign out' }).click();
  });
  await check(T('range page: unknown id shows a friendly message'), async () => {
    await signInAs('Priya Shah, Mapleleaf Builders (Trade Plus)');
    await page.goto(base + '/range.html?id=nope');
    await page.getByText('We could not find that range').waitFor();
    await page.getByRole('link', { name: 'Back to the list' }).first().click();
    await page.waitForURL('**/pricelist.html');
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
    await d.getByLabel('Tier').selectOption('tradeGold');
    await shot('staff-add-panel', { fullPage: false });
    await d.getByRole('button', { name: 'Approve and add' }).click();
    assert.ok(await d.getByText('Tick "ID and proof of trade checked" before approving.').isVisible());
    await d.getByLabel('ID and proof of trade checked').check();
    await d.getByRole('button', { name: 'Approve and add' }).click();
    await page.locator('li.acct', { hasText: 'Walk In Tiling' }).locator('.badge-tradeGold').waitFor();
    await page.getByRole('button', { name: 'Reset demo data' }).click();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('button', { name: /^All\s*9$/ }).waitFor();
    assert.ok(!(await page.locator('main').innerText()).includes('Walk In Tiling'));
  });

  // ---------- Page-wide checks ----------
  for (const name of PAGES) {
    const url = name === 'range' ? `${base}/range.html?id=harbour-twist` : `${base}/${name}.html`;
    await page.goto(url);
    if (name === 'pricelist' || name === 'range') {
      await page.evaluate(() => localStorage.setItem('dcDemo.session.v2', JSON.stringify({ accountId: 'c-plus' })));
      await page.goto(url);
      await page.waitForSelector(name === 'range' ? '.range-detail' : '.range-row');
    }
    await page.waitForTimeout(150);
    await check(T(`${name}: noindex meta, demo banner, <html lang>`), async () => {
      assert.strictEqual(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex');
      assert.strictEqual((await page.locator('.demo-banner').innerText()).trim(), 'Demo: sample data only');
      assert.strictEqual(await page.locator('html').getAttribute('lang'), 'en-GB');
    });
    await check(T(`${name}: no horizontal scroll`), () => noHorizontalScroll(page));
    await check(T(`${name}: tap targets at least 44px`), async () => assert.deepStrictEqual(await smallTargets(page), []));
    await check(T(`${name}: visible keyboard focus ring`), async () => {
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return cs.outlineStyle + ' ' + cs.outlineWidth; });
      assert.ok(/solid 3px/.test(ring), ring);
    });
    await check(T(`${name}: text contrast meets WCAG AA`), async () => assert.deepStrictEqual(await contrastAudit(page), []));
    await check(T(`${name}: one sans-serif, no gradients, no uppercase transforms, no em dashes in copy`), async () => {
      const r = await page.evaluate(() => {
        const out = { gradients: 0, upper: 0, fonts: new Set(), dash: document.body.innerText.includes('—') };
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          if (/gradient/.test(cs.backgroundImage)) out.gradients++;
          if (cs.textTransform === 'uppercase') out.upper++;
          if (el.getBoundingClientRect().width > 0 && el.innerText) out.fonts.add(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
        }
        out.fonts = [...out.fonts]; return out;
      });
      assert.strictEqual(r.gradients, 0); assert.strictEqual(r.upper, 0); assert.strictEqual(r.dash, false);
      assert.deepStrictEqual(r.fonts, ['Inter'], 'fonts in use: ' + r.fonts.join(', '));
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
  // Source-level style rules, run once.
  await check('source: no em dashes, display fonts, gradients or uppercase transforms; every page has noindex + banner', async () => {
    const files = fs.readdirSync(DEMO_DIR).filter((f) => /\.(html|js|css|md)$/.test(f)).map((f) => path.join(DEMO_DIR, f))
      .concat([path.join(DEMO_DIR, 'assets/data/ranges.js'), path.join(ROOT, 'index.html')]);
    for (const f of files) {
      const t = fs.readFileSync(f, 'utf8');
      assert.ok(!/—|&mdash;/.test(t), 'em dash in ' + path.relative(ROOT, f));
      if (/\.(html|css|js)$/.test(f) && !f.endsWith('tests/journey.js')) {
        assert.ok(!/Auttera|Singel/i.test(t), 'display font referenced in ' + path.relative(ROOT, f));
      }
      if (f.endsWith('.html')) {
        assert.ok(/name="robots" content="noindex"/.test(t), 'noindex missing in ' + path.relative(ROOT, f));
        assert.ok(/Demo: sample data only/.test(t), 'banner missing in ' + path.relative(ROOT, f));
      }
    }
    const css = fs.readFileSync(path.join(DEMO_DIR, 'styles.css'), 'utf8');
    assert.ok(!/gradient/.test(css) && !/text-transform:\s*uppercase/.test(css));
  });
  await check('data: 8 ranges across the 6 categories, every shape field present, tiers get cheaper, no real brands', async () => {
    global.window = {}; require(path.join(DEMO_DIR, 'assets/data/ranges.js'));
    const { categories, ranges } = global.window.DC_DEMO_RANGES;
    assert.deepStrictEqual(categories, ['Carpet', 'Vinyl', 'LVT', 'Laminate', 'Underlay', 'Accessories']);
    assert.ok(ranges.length >= 8 && ranges.length <= 10);
    assert.deepStrictEqual([...new Set(ranges.map((r) => r.category))].sort(), [...categories].sort());
    const statuses = new Set();
    for (const r of ranges) {
      assert.ok(r.id && r.name && r.category && r.heroImage && r.unit, r.id);
      assert.ok(r.specs.length >= 2 && r.specs.length <= 3, r.id + ' specs');
      assert.ok(r.colourways.length >= 1 && r.colourways.every((c) => c.name && /^#[0-9a-f]{6}$/i.test(c.hex)), r.id + ' colourways');
      assert.ok(r.prices.trade > r.prices.tradePlus && r.prices.tradePlus > r.prices.tradeGold, r.id + ' prices');
      assert.ok(['m²', 'roll', 'each'].includes(r.unit));
      assert.ok(['in_stock', 'order_in', 'out_of_stock'].includes(r.stock.status));
      if (r.stock.status === 'order_in') assert.ok(r.stock.leadDays > 0);
      assert.ok(fs.existsSync(path.join(DEMO_DIR, r.heroImage)), 'missing ' + r.heroImage);
      statuses.add(r.stock.status);
    }
    assert.strictEqual(statuses.size, 3);
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    for (const [w, h] of [[390, 844], [1280, 800]]) await runViewport(browser, origin, w, h);
  } finally {
    await browser.close(); server.close();
  }
  const failed = results.filter((r) => !r[0]);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
