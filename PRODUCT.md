# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile web first. Most use happens on a phone; the desktop layout must still work (the demo is checked at 390px and 1280px).

## Users

**Primary:** flooring fitters, builders and other trades across the North East (Middlesbrough, Stockton, Hartlepool, Darlington). Mostly men aged from their late 20s to their mid 50s, using a phone in the van or on site. They want speed: their price, whether it is in stock, and whether it can be cut ready. They want plain, simple language and short lines, with no jargon or marketing fluff.

**Secondary:** DC Flooring counter staff. They review trade account applications, approve accounts, set a customer's tier and add walk-in customers (`demo/staff.html`).

## Product Purpose

This is the DC Flooring trade site (trade.dcflooring.co.uk), a mobile-first web app for trade customers of DC Flooring, a trade counter and showroom in Middlesbrough selling carpet, vinyl, LVT, laminate, underlay and accessories. It shows each fitter their trade price for their tier, stock, ring-ahead cutting, member vouchers and quick reorder.

**Home page goals:** first, get new fitters to sign up for a free trade account. Second, let existing customers sign in.

Success means a fitter can find out "what does it cost me, is it in, can it be cut today" in seconds, from the van, without phoning or making a wasted trip.

## Positioning

- **Cut and ready on arrival.** Customers order the cut before they set off, so it is waiting at the counter and they do not queue for it.
- **Live stock on your phone.** Customers see what is in stock before they travel, so they do not drive to the counter for something that isn't there.

The design reference sums this up as "Trade prices. In your pocket." and "Measure. Cut. Collect."

## Operating Context

- Customers use it on a phone, often in a van or on site, sometimes with poor signal, and often with their mind on a job.
- Customers collect from a physical trade counter in Middlesbrough. Walk-in customers exist and staff can add them.
- Tiers are Trade, Trade Plus and Trade Gold. Everyone starts on Trade. Staff grant the higher tiers, and prices drop as customers move up. The spend thresholds are still to be agreed (the demo uses sample figures).
- Prices are shown ex VAT, per unit (m², roll or each). Logged-out visitors only ever see Trade-level sample prices.
- Products are organised by range (with colourways), not by SKU.

## Capabilities and Constraints

- **Current state:** a clickable static demo in `demo/` (HTML, CSS, vanilla JS, localStorage). All data is invented, every page has `noindex`, and every page shows a "Demo: sample data only" banner.
- **Planned backend:** Supabase for accounts, ranges, colourways and tier prices, plus a Lightspeed sync for stock and prices. Pages read prices only through `getPricesForTier()` and `getRange()` (`demo/app.js`, marked `SUPABASE LATER`). Tier prices must never leak across tiers.
- **Sign up:** takes about 2 minutes. Staff then phone the applicant to approve the account before prices unlock.
- **Login:** customers sign in with a code sent by text message. There are no passwords.
- **Fonts:** Singel and Auttera are Fontspring demo fonts. They need web licences before launch.
- **Tap targets** are at least 44px, and there is no horizontal scroll at 390px. `demo/tests/journey.js` enforces both.

## Brand Commitments

- **Name:** DC Flooring (company name DC Flooring Ltd). The logo is white brush lettering with "Carpet, vinyl & more" in gold, at `design/dc-logo.png` and `demo/assets/logo.png`.
- **Colour (binding):** black background `#0B0A09` with DC gold `#B8924A`.
- **Type (binding):** headlines in Barlow Condensed 700, set in capitals; hand-written accents in Auttera; numbers and prices in Barlow; body text in Inter. (Singel was dropped in November 2026.)
- **Personality (binding):** restrained, trade-specific touches for fitters (football, tea, the van): hand-drawn tools, pencil measurements, a tea ring. No real brand names, logos or club badges. Nothing animated except the tea steam, which respects reduced motion.
- **Feel (binding):** a confident local trade business, not a generic template. Easy to scan, generous space, one clear action per screen. No boxes around everything and no repetitive section layouts.
- **Writing rules:** British English, no em dashes, short sentences.
- **Voice:** plain, direct, local trade-counter talk. Examples from the approved reference: "Quicker than a brew.", "A proper local trade counter.", "Two minutes now saves you a wasted trip later."
- **Approved home screen reference:** `design/Home.dc.html`, with a render at `design/home-screenshot.png`. It is the agreed basis for the home screen rebuild.

## Evidence on Hand

- **Sample data only.** All ranges, prices, customers, offers and guides in `demo/data.js` and `demo/assets/data/ranges.js` are invented, and no real manufacturer is named.
- **Placeholders still to be supplied:** address, phone, opening hours, company and VAT numbers, offer wording and dates, the approval turnaround time, and real product photos (the range heroes in `demo/assets/ranges/` are placeholder SVGs). A photo of the counter and staff is also needed.
- **No testimonial yet.** The reference has a slot for "a real line from a fitter". Never invent a quote, customer, review or stock figure.

## Product Principles

1. **Answer the van question fast.** Price, stock and cut-ready status come before anything else.
2. **Only show your own price.** A customer sees their tier's price and nothing that implies another tier's price.
3. **Save the wasted trip.** Every flow should cut down on phone calls, queues and journeys to the counter for stock that isn't there.
4. **Local and human, not a chain.** Talk like the counter does, and never pad with claims the business can't back up.
5. **Never fabricate.** Unknown facts stay as visible `[PLACEHOLDERS]` until the business supplies them.

## Accessibility & Inclusion

Customers use this outdoors on a phone, in bright light, sometimes in gloves, and in a hurry. Keep tap targets at least 44px, keep contrast strong, make prices and stock status readable at a glance, and support keyboard and screen reader use (the demo already has a skip link and ARIA). Aim for WCAG 2.1 AA.
