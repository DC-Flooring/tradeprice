---
name: DC Flooring Trade
description: Trade prices in your pocket. A van-cab dark trade counter with DC gold tape-measure marks.
colors:
  van-cab-black: "#0B0A09"
  raised: "#171512"
  raised-press: "#211E1A"
  hairline: "#2A2622"
  outline: "#3A352E"
  off-white: "#F5F1E8"
  text-secondary: "#A8A196"
  text-lede: "#D6D0C4"
  dc-gold: "#B8924A"
  gold-press: "#A8833D"
  on-gold-secondary: "#2A2520"
  paper: "#F5F1E8"
  paper-stub: "#EDE6D8"
  on-paper-secondary: "#4A443B"
  brass-ink: "#6B5A33"
  in-stock-green: "#8FD18F"
  pencil: "#C9C1B0"
  chat-out: "#0F5A45"
  chat-in: "#24211D"
  tier-plus: "#4A3D27"
  tier-plus-deal: "#E2C58A"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(4rem, 2.6rem + 6vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  headline-xl:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(2.75rem, 1.8rem + 4.2vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(2.25rem, 1.6rem + 2.8vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "0em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.005em"
  title-index:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.02em"
  script:
    fontFamily: "Auttera, Segoe Script, Bradley Hand, cursive"
    fontSize: "clamp(2.5rem, 1.7rem + 3.4vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.1
  script-note:
    fontFamily: "Auttera, Segoe Script, Bradley Hand, cursive"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.06em"
  numeral:
    fontFamily: "Barlow, Inter, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 0.9
    fontFeature: "tnum, lnum"
  price:
    fontFamily: "Barlow, Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    fontFeature: "tnum, lnum"
  lede:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "tnum"
  body-strong:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.15
  button:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  edge: "6px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  pill: "999px"
spacing:
  gutter: "20px"
  gutter-wide: "32px"
  tap: "44px"
  head: "32px"
  section: "64px"
  section-wide: "112px"
  max: "1160px"
components:
  button-gold:
    backgroundColor: "{colors.dc-gold}"
    textColor: "{colors.van-cab-black}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "{spacing.tap}"
  button-gold-hover:
    backgroundColor: "{colors.gold-press}"
  button-gold-lg:
    backgroundColor: "{colors.dc-gold}"
    textColor: "{colors.van-cab-black}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "58px"
  button-outline-sm:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "{spacing.tap}"
  button-outline-hover:
    backgroundColor: "{colors.raised}"
  button-ink:
    backgroundColor: "{colors.van-cab-black}"
    textColor: "{colors.dc-gold}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "58px"
  header:
    backgroundColor: "rgba(11, 10, 9, 0.72)"
    height: "68px"
  price-screen:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.lg}"
    padding: "18px 18px 6px"
  tier-pill:
    backgroundColor: "{colors.dc-gold}"
    textColor: "{colors.van-cab-black}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  product-row:
    textColor: "{colors.off-white}"
    padding: "14px 0"
  swatch:
    rounded: "{rounded.sm}"
    size: "52px"
  sticker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.van-cab-black}"
    rounded: "50%"
    size: "88px"
  chat-out:
    backgroundColor: "{colors.chat-out}"
    textColor: "{colors.off-white}"
    rounded: "10px"
    padding: "7px 10px 8px 12px"
  chat-in:
    backgroundColor: "{colors.chat-in}"
    textColor: "{colors.off-white}"
    rounded: "10px"
    padding: "7px 10px 8px 12px"
  tier-trade:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.edge}"
    padding: "18px"
  tier-plus:
    backgroundColor: "{colors.tier-plus}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.edge}"
    padding: "18px"
  tier-gold:
    backgroundColor: "{colors.dc-gold}"
    textColor: "{colors.van-cab-black}"
    rounded: "{rounded.edge}"
    padding: "18px"
  voucher:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.van-cab-black}"
    rounded: "20px"
    padding: "20px"
  voucher-stub:
    backgroundColor: "{colors.paper-stub}"
    textColor: "{colors.van-cab-black}"
    width: "76px"
  visit-action:
    textColor: "{colors.off-white}"
    height: "72px"
  visit-action-pressed:
    backgroundColor: "{colors.raised}"
  closer-band:
    backgroundColor: "{colors.dc-gold}"
    textColor: "{colors.van-cab-black}"
    padding: "64px 0 72px"
  toast:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.van-cab-black}"
    rounded: "{rounded.md}"
    padding: "14px 18px"
    width: "min(440px, calc(100% - 32px))"
---

# Design System: DC Flooring Trade

## Overview

**Creative North Star: "The Counter in Your Pocket"**

The system is a trade counter seen from the van cab: a near-black ground, warm off-white type, and DC gold used the way a tape measure uses it, as rulings, ticks, numerals and dimension lines. Big Barlow Condensed capitals do the shouting, Barlow carries every number a fitter compares, Inter does the plain talking, and Auttera adds the odd pencil mark, as if someone at the counter jotted sizes on an offcut.

Layout is open and ruled, not boxed. Sections sit straight on the dark ground and are separated by hairlines, gold top rules and the tape-measure ruler. The only framed things are things that are objects in real life: the price screen, the voucher, the sticker, the chat bubbles and the photos. The page ends on one solid band of gold. Density is generous on phones (designed at 390px) and opens into asymmetric two-column grids on desktop.

Motion is almost absent. Controls give a small press response, the toast slides in, and the steam off the mug is the only thing that moves on its own.

**Key Characteristics:**
- Near-black van-cab ground (`van-cab-black`) with warm off-white text; dark colour scheme only.
- DC gold as lines, ticks and numerals; solid gold reserved for the main action, the tier pill, the Trade Gold tier and the closing band.
- Barlow Condensed 700 capitals for headlines; Barlow 600 tabular lining figures for prices and numerals; Inter for body; Auttera for short hand-written accents.
- Hairlines instead of cards; frames only for real-world objects.
- Real trade photos, rounded inline or full-bleed with fades.
- Press feedback only; the steam is the only loop.

## Colors

A warm near-black palette with one metal accent and a warm paper for things you could hold.

### Primary
- **DC Gold** (`dc-gold`): the brand accent and binding brand colour. Tape-measure ruler, dimension lines, step numerals and their connecting line, gold top rules on the "why" list, action icons, links, focus rings, chat sender name, quote marks, the "Kettle on" line, the script headline accents. Solid gold fills: the Sign up button, the tier pill, the Trade Gold tier, the closing band and text selection. Measured 6.8:1 on the page and 6.3:1 on raised surfaces.
- **Gold Press** (`gold-press`): pressed and hovered gold button. Black text on it measures 5.6:1.
- **On-gold Secondary** (`on-gold-secondary`): secondary text on gold, such as the Trade Gold "who" line (5.2:1).

### Secondary
- **Warm Paper** (`paper`): the voucher, the sticker and the toast. Black text on it measures 17.5:1. It shares its value with the off-white text colour on purpose.
- **Paper Stub** (`paper-stub`): the voucher's tear-off stub (black on it 15.9:1).
- **On-paper Secondary** (`on-paper-secondary`): body text on paper (8.5:1).
- **Brass Ink** (`brass-ink`): the small bold label on the voucher (5.9:1 on paper). Hard-coded in the CSS, not yet a custom property.

### Tertiary
- **In-stock Green** (`in-stock-green`): stock status only ("In stock", "cut today"). 10.1:1 on raised.
- **Chat Out** (`chat-out`): the fitter's outgoing chat bubble. Off-white on it measures 7.3:1; the 82% off-white timestamp measures 5.5:1.
- **Chat In** (`chat-in`): the counter's incoming bubble. Off-white 14.2:1; gold sender name 5.5:1.
- **Tier Plus** (`tier-plus`) and **Tier Plus Deal** (`tier-plus-deal`): the middle tier step and its deal line (6.3:1). Lede text on Tier Plus measures 6.9:1. Both are hard-coded in the CSS.

### Neutral
- **Van-cab Black** (`van-cab-black`): page ground, theme colour, and the text colour on gold and paper. Binding brand colour.
- **Raised** (`raised`): the price screen, the tiers section band, photo placeholders, pressed outline buttons and actions.
- **Raised Press** (`raised-press`): pressed or hovered state on a raised surface.
- **Hairline** (`hairline`): every divider rule; also the Trade tier step fill. 1.3:1 on the page, so it is decoration, never the only signal.
- **Outline** (`outline`): control outlines such as the Sign in button. 1.6:1 on the page; the button is identified by its label. Under the higher-contrast preference it rises to `#8C877C` (5.5:1).
- **Off-white** (`off-white`): primary text. 17.5:1 on the page, 16.2:1 on raised.
- **Text Secondary** (`text-secondary`): captions, ledes under headings, supporting lines. 7.7:1 on the page, 7.1:1 on raised. Under higher contrast it becomes the lede colour (11.9:1 on raised).
- **Text Lede** (`text-lede`): hero lede and tier text (12.9:1 on the page, 9.8:1 on the Trade tier).
- **Pencil** (`pencil`): hand-written notes above the price screen (11.1:1) and the voucher stub's dashed tear line.

### Named Rules
**The Tape-Measure Rule.** Gold is a line, a tick or a numeral first. Solid gold fills are limited to the main action, the tier pill, the top tier, text selection and the one closing band.

**The One Band Rule.** A page ends on a single solid gold band holding its call to action. There is never a second gold band.

**The AA Floor Rule.** Every text pairing measures at least 4.5:1. The lowest shipped text pairing is 5.2:1 (secondary text on gold). New pairings get measured before they ship.

## Typography

**Display Font:** Barlow Condensed 700 (with Arial Narrow, Roboto Condensed)
**Number Font:** Barlow 600 (with Inter, system-ui)
**Body Font:** Inter 400, 500, 600, 700 (with system-ui, Segoe UI, Roboto)
**Script Font:** Auttera 400, self-hosted WOFF2 (with Segoe Script, Bradley Hand)

**Character:** Condensed capitals like signage over a trade counter, set against a neutral, legible sans for the plain talk, with an occasional pencil hand to make it feel local.

### Hierarchy
- **Display** (Barlow Condensed 700, clamp 4rem to 6rem, line-height 0.9, -0.01em, capitals): the hero headline and the closer headline (closer runs clamp 3.5rem to 6rem).
- **Headline XL** (700, clamp 2.75rem to 4.75rem, 0.98, capitals): section headlines that carry a section on their own ("Quicker than a brew.").
- **Headline** (700, clamp 2.25rem to 3.5rem, 0.98, capitals, balanced wrap): standard section headlines.
- **Title** (700, 1.75rem, 1, capitals): small headings such as "Come and see us". Voucher title 1.875rem rising to 2.125rem at 960px.
- **Index Title** (700, 1.625rem rising to 1.875rem, 1.05, 0.02em, capitals): rows of the feature index; tier names use the same treatment at 1.375rem rising to 1.75rem.
- **Script** (Auttera 400, clamp 2.5rem to 4rem, 1.1, rotated -2deg): the second line of a display headline, in gold (black on the gold band).
- **Script Note** (Auttera 400, 1.5rem, 1, 0.06em): pencil notes and dimension labels.
- **Numeral** (Barlow 600, 3.5rem rising to 4.75rem, 0.9, gold): step numbers.
- **Price** (Barlow 600, 1.5rem, -0.01em, tabular lining): prices. Short facts like "2 minutes" set their figure in Barlow 600 too.
- **Lede** (Inter 400, 1.1875rem, 1.5, max 30ch to 34ch): the hero lede; the closer lede is weight 500.
- **Body** (Inter 400, 1rem, 1.55, tabular figures on): all running text. Section ledes 1.0625rem, max 40ch.
- **Body Strong** (Inter 600, 1.0625rem, 1.3): product names. Step headings are Inter 600 at 1.25rem rising to 1.5rem; "why" headings Inter 700 at 1.125rem.
- **Label** (Inter 600, 0.9375rem): the price screen's bar, unit lines, the voucher label.
- **Button** (Inter 600, 1rem, line-height 1): buttons; large buttons are 700 at 1.125rem.

### Named Rules
**The Capitals Rule.** Barlow Condensed is only ever 700, only ever in capitals, only ever a headline or a name.

**The Figures Rule.** Any number someone compares (prices, quantities, step numbers, minutes) is set in Barlow with tabular lining figures.

**The Pencil Rule.** Auttera is for short hand-written accents of one to three words: a script headline line, pencil notes, dimension labels, the voucher stub, the sticker. Never body text, never a button, never the only carrier of information a fitter needs.

**The 16px Floor Rule.** Body and supporting text is at least 1rem (16px).

## Layout

Mobile first, designed at 390px, with breakpoints at 600px (tier staircase), 640px (tablet) and 960px (desktop).

- **Container:** centred, width `min(1160px, 100% - 2 × gutter)`. Gutter is 20px on phones and 32px from 640px.
- **Section rhythm:** sections pad 64px top and bottom on phones and 112px from 960px. A section head sits 32px above its content. Section ledes sit 12px under the headline. The hero pads 20px / 56px, then 48px / 96px on desktop. The closer pads 64px / 72px, then 112px / 120px.
- **Separators between sections:** the tape-measure ruler (after the hero and above the footer), a change of ground (the tiers section sits on `raised`), the full-bleed photo banner, or the gold band. Never a boxed card.
- **Desktop grids:** asymmetric two-column splits, usually 5fr / 7fr (headline left, content right) or 1.1fr / 1fr (hero copy and price screen). The feature index headline is sticky at 112px from the top. The "why" list goes 2 columns on phones, 4 columns at 640px, then 2 columns beside the headline at 960px.
- **Sticky header offset:** anchored scrolling leaves 88px of padding.
- **No horizontal scroll at 390px.** The body clips overflow on the x axis.

## Elevation & Depth

Depth is mostly tonal: the page ground, then `raised`, then `raised-press`. Shadows exist only under the real-world objects that sit on the page, and they are soft, dark and pulled in, like an object resting on a dark counter.

### Shadow Vocabulary
- **Screen** (`box-shadow: 0 24px 60px -24px rgba(0,0,0,0.9), 0 2px 0 rgba(255,255,255,0.03) inset`): the price screen.
- **Ticket** (`box-shadow: 0 20px 40px -20px rgba(0,0,0,0.8)`): the voucher.
- **Sticker** (`box-shadow: 0 10px 24px -8px rgba(0,0,0,0.7)`): the rotated sticker.
- **Swatch edge** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08)`): a faint inner edge on product swatches.

The sticky header is translucent (`rgba(11,10,9,0.72)` with an 18px blur and 160% saturation) and ends in a 16px soft fade instead of a hard rule.

### Named Rules
**The Real Object Rule.** Only things that exist as objects in life get a frame, radius and shadow: screens, vouchers, stickers, chat bubbles, photos. Everything else sits flat on hairlines.

## Shapes

Corners are soft and friendly on objects and almost square on structure.

- **Edge** (6px): tier steps (top corners only in the staircase), the focus ring and the logo link.
- **Small** (12px): product swatches, the skip link.
- **Medium** (16px): buttons and the toast.
- **Large** (24px): the price screen, inline photos and photo placeholders.
- **Pill** (999px): the small Sign in button and the tier pill.
- One-off object shapes: the voucher at 20px with two 20px half-circle notches cut at the stub; chat bubbles at 10px with a 3px corner and a small tail on the speaker's side; the sticker as a full circle.
- Hand-drawn marks (pencil arrow, dimension ends, mug) use round caps and joins. The mug is roughened with an SVG turbulence filter.
- Rotations are small and deliberate: script headlines -2deg, pencil notes -4deg and 3deg, the sticker 10deg, the mug 5deg.

## Components

### Buttons
Big, plain and easy to hit with a thumb.
- **Shape:** gently rounded (16px); the small header button is a pill.
- **Gold (primary):** gold fill, black text, Inter 600, 44px minimum height, 20px side padding. One per screen. The large size is 58px tall, 28px padding, 1.125rem bold, and full width on phones (from 640px the hero button becomes inline, at least 280px wide).
- **Outline (secondary):** transparent with an `outline` border and off-white text. Used for Sign in in the header.
- **Ink:** black fill with gold text; the only button allowed on the gold band.
- **Press:** scale to 0.97 in 100ms; released with a 160ms strong ease-out. Colour changes over 200ms. Gold goes to Gold Press; outline fills with `raised`.
- **Hover:** only on devices with a fine pointer that can hover. Outline border lifts to secondary text colour.
- **Focus:** 2px gold outline, 3px offset, 6px radius. On the gold band the ring turns black.

### Header
- Sticky, translucent black with backdrop blur, safe-area aware, 68px tall (84px from 960px). Logo left (42px tall, 50px on desktop), the outline Sign in pill right. A 16px soft fade replaces a bottom border.
- Reduced transparency: solid page black, no blur. Higher contrast: solid black, an `outline` bottom border, no fade.

### The Ruler
The signature divider: a full-width tape measure in gold at 85% opacity, 14px tall. Major ticks every 50px (2px wide, full height), minor ticks every 10px (1px, 6px tall) on a 1px baseline. Decorative and hidden from assistive tech. Used after the hero and at the top of the footer.

### Price Screen and Product Rows
- **Screen:** `raised` fill, 1px hairline border, 24px radius, Screen shadow, 18px padding. A top bar carries the label ("Your prices") and the gold tier pill (Inter 700, 13px).
- **Product row:** three columns: 52px swatch, name and stock, price. Rows are split by hairlines with 14px vertical padding. Name in Body Strong, stock in green Inter 500 at 16px, price in Barlow 600 1.5rem right aligned, unit ("per m²") in Label secondary.
- **Around it:** pencil notes above, the dimension line under it (gold ends and line, Auttera label), and a caption that marks prices as examples, ex VAT.

### Sticker
An 88px paper circle stuck on the corner of the price screen, rotated 10deg, with the Sticker shadow. A small capitalised word in Inter over an Auttera word in black. Its visible text is decorative; a screen-reader-only line carries the meaning.

### Chat Bubbles
A real-looking message exchange, max 360px wide, bubbles up to 88% of it. Outgoing bubbles are green, right aligned, tail top right; incoming are `chat-in`, left aligned, tail top left, with the sender's name in gold bold. A small timestamp floats bottom right; read ticks are a light blue SVG. Text is 16px Inter at 1.35. Screen-reader-only prefixes name the speaker.

### Steps
A numbered list with large gold Barlow numerals (3.5rem, 4.75rem on desktop) in a 44px column (64px on desktop), joined by a single 1px gold line at 50% opacity running behind them. Each numeral sits on a page-black knockout so the line breaks around it. Step heading in Inter 600, detail in secondary text.

### Tiers
Three solid steps rising in tone: Trade (`hairline` fill), Trade Plus (`tier-plus`), Trade Gold (gold with black text). Each carries a condensed capital name, a "who" line and a deal line.
- **Under 600px:** stacked full width, 3px apart, 6px corners, name and "who" on the left with the deal on the right.
- **From 600px:** a staircase of three columns aligned to the bottom, square-bottomed with 6px top corners, heights 172px / 232px / 300px (190 / 264 / 340 from 640px, 160 / 220 / 280 beside the voucher from 960px). The deal line drops to the foot of each step.

### Voucher
A tear-off paper ticket: body plus a 76px stub, 20px radius, Ticket shadow. Body holds a condensed capital title, body text in On-paper Secondary and a bold Brass Ink label. The stub is Paper Stub with a 2px dashed pencil tear line and two half-circle notches punched in the colour of the surface behind. The stub's value is Auttera rotated -90deg. A secondary "fine print" line sits under it.

### Why List
Short reasons set as text on a ruled grid: each item has a 2px gold top rule and 14px top padding, a bold Inter heading and a secondary line. Two columns on phones, four at 640px, two beside the headline at 960px.

### Visit Actions
A row of three equal actions (Call, WhatsApp, Directions) between top and bottom hairlines, split by vertical hairlines. Each is 72px tall with a 22px gold line icon (2px stroke, round caps) above an Inter 600 label. Press: scale 0.97 and `raised` fill; hover fills `raised` on fine pointers. Links whose details are not supplied yet show a toast instead of going nowhere.

### Closer Band
The single gold band that ends a page: gold ground, black text, centred. A black dimension line (80% opacity, max 300px, 360px on desktop), a display headline with an Auttera last word, a 500-weight lede, then a full-width (max 420px) Ink button and a 44px "Already got an account? Sign in" text link with the action word underlined and bold.

### Footer
Opens with the ruler, then a centred column: the logo at 60px and the legal lines in secondary text. Bottom padding respects the safe area.

### Toast
A paper slip fixed at the bottom centre, up to 440px wide, 16px radius, black Inter 500 text, a polite live region. Slides up from below in 260ms with the strong ease-out and fades in over 200ms; leaves in 180ms. Stays for 3.2 seconds, pauses while the tab is hidden, and dismisses on tap. Reduced motion: no slide, opacity only.

### Photography
- Real photos from the trade only, supplied by the business. No stock imagery.
- Served as WebP with a JPG fallback inside `picture`, at 800px wide plus the full-size original, with `srcset`, `sizes`, explicit width and height, `loading="lazy"` and `decoding="async"`.
- **Inline photos:** 24px radius, `raised` behind while loading, `object-fit: cover` with a tuned focal point; the tea photo is 4:3 on phones and 4:5 beside the steps on desktop.
- **Full-bleed banner:** edge to edge, 4:3 on phones and 16:9 from 640px, with a light warm grade (`sepia(0.16) saturate(1.05)`) and 24% fades at the top (from the surface above) and bottom (into the page black).
- Photo placeholders are `raised` boxes at the photo's radius and aspect ratio, labelled with what the photo will show.

### Motion and Preferences
- **Easing:** strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for anything entering or responding to a press; press timing 160ms (100ms on the way down).
- **The steam:** three wisps rise and fade on a 2.4s loop, staggered by 0.8s, and pause when the mug is off screen. It runs only when reduced motion is not requested.
- **Reduced motion:** no smooth scroll, no steam, no press scale, toast fades without sliding.
- **Reduced transparency:** the header turns solid black without blur.
- **Higher contrast:** secondary text lifts to `#D6D0C4`, hairlines to `#6B6459`, outlines to `#8C877C`; the header turns solid with a visible bottom border.

## Do's and Don'ts

### Do:
- **Do** keep every tap target at least 44px tall (the `tap` spacing token), including text links.
- **Do** keep body and supporting text at 16px or more and every text pairing at WCAG AA (4.5:1) or better, measured.
- **Do** use one gold primary button per screen, and end the page on one gold band with an Ink button.
- **Do** separate content with hairlines, gold top rules, the ruler or a change of ground.
- **Do** set every comparable number in Barlow 600 with tabular lining figures.
- **Do** limit press feedback to scale 0.97 and a colour change, and gate hover styles to fine pointers.
- **Do** ship photos as WebP plus JPG at 800px and full size, lazy-loaded, with width and height set.
- **Do** write in British English, in short sentences, with no em dashes. Unknown facts stay as visible [square bracket] placeholders, such as [Phone] or [7:30am].
- **Do** honour reduced motion, reduced transparency and higher contrast as described above.

### Don't:
- **Don't** wrap sections or lists in rounded cards. Frames, radius and shadow belong only to real-world objects.
- **Don't** add eyebrow labels or small kicker text above headlines.
- **Don't** set Barlow Condensed in lower case or at any weight but 700.
- **Don't** use Auttera for body copy, buttons or anything a fitter needs to read to act.
- **Don't** animate anything except the tea steam.
- **Don't** use stock photos, real manufacturer names, logos or club badges.
- **Don't** add a second solid gold band or fill large areas with gold.
- **Don't** invent quotes, reviews, prices or stock figures; show sample data as examples.
