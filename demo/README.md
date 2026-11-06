# DC Flooring trade site: clickable demo

Static HTML, CSS and vanilla JavaScript. No backend, no network calls (other than the Barlow font from Google Fonts), no real emails.
All data is invented sample data and lives in the browser's localStorage. Every page has `noindex` and a "Demo: sample data only" banner.

Open `demo/index.html` in a browser, or serve the folder: `python3 -m http.server -d demo`.

| File | What it is |
| --- | --- |
| `index.html` | One-page marketing site |
| `apply.html` | Trade account application (saved as pending) |
| `login.html` | Fake customer sign-in (pick a demo customer) |
| `pricelist.html` | Signed-in price list for the customer's tier |
| `staff.html` | Fake staff login, review and approve, walk-ins, reset |
| `data.js` | All sample data: 14 products, 3 offers, 6 customers, 3 applications |
| `app.js` | Logic. `getPricesForTier`, `approveApplication`, `currentUser` etc. each carry a `SUPABASE LATER` comment |
| `assets/` | Logo and brand fonts |

Square-bracket text such as `[PHONE]` marks content still to be supplied.

## Checks

`node demo/tests/journey.js` (needs Playwright) walks apply, staff approval as Trade Plus, Trade Plus prices, then a Trade Gold customer at 390px and 1280px,
checks for horizontal scroll and 44px tap targets, and writes screenshots to `demo/tests/screenshots`.
