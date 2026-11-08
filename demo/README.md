# DC Flooring trade site: clickable demo

Static HTML, CSS and vanilla JavaScript. No backend, no network calls (other than the Barlow font from Google Fonts), no real emails.
All data is invented sample data and lives in the browser's localStorage. Every page has `noindex` and a "Demo: sample data only" banner.

Open `demo/index.html` in a browser, or serve the folder: `python3 -m http.server -d demo`.

| File | What it is |
| --- | --- |
| `index.html` | One-page marketing site, with a logged-out sample list of ranges at Trade level |
| `apply.html` | Trade account application (saved as pending) |
| `login.html` | Fake customer sign-in (pick a demo customer) |
| `pricelist.html` | Signed-in list view: search, category chips, one row per range |
| `range.html` | Signed-in range page: colourways, price for the viewed tier, stock (`range.html?id=harbour-twist`) |
| `staff.html` | Fake staff login, review and approve, walk-ins, reset |
| `assets/data/ranges.js` | Sample ranges, structured by range so Lightspeed data can be mapped in later |
| `data.js` | Other sample data: tiers, offers, guides, 6 customers, 3 applications |
| `app.js` | Logic. `getPricesForTier`, `getRange`, `approveApplication`, `currentUser` etc. each carry a `SUPABASE LATER` comment |
| `assets/ranges/` | Placeholder hero images (swap for real photos and update `heroImage`) |

The "Demo: view as" switcher on the list and range pages is demo only (`getEffectiveTier` / `setViewAsTier` in `app.js`).
The repo root `index.html` just redirects to `demo/`, so the plain GitHub Pages address works.

Square-bracket text such as `[PHONE]` marks content still to be supplied.

## Checks

`node demo/tests/journey.js` (needs Playwright) walks apply, staff approval as Trade Plus, Trade Plus prices, then a Trade Gold customer at 390px and 1280px,
checks for horizontal scroll and 44px tap targets, and writes screenshots to `demo/tests/screenshots`.
