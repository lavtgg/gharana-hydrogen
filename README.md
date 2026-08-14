# Gharana Heritage — Shopify Theme

A proper Shopify Liquid theme for **Gharana**, the premium traditional grocery brand.

Blinkit-style Q-commerce UX (delivery ETA, location, sticky cart bar, ADD/stepper) wrapped in a **heritage postcard visual language** — rough uneven edges on every card, cream paper texture, saffron & jade palette, traditional Indian typography touches (Fraunces + Yatra One).

---

## What’s inside

```
layout/
  theme.liquid                 — root layout, fonts, SVG filter defs, global CSS/JS
sections/
  header.liquid                — mobile Blinkit-style topbar + desktop nav
  footer.liquid                — branded footer + floating cart bar + bottom tabs
  header-group.json            — section group
  footer-group.json            — section group
  promo-carousel.liquid        — editorial promo cards (saffron/jade/gold)
  category-grid.liquid         — Bento tiles pulled from collections
  product-rail.liquid          — horizontal / grid product rail (any collection)
  offer-strip.liquid           — first-order offer
  trust-badges.liquid          — "The Gharana Promise" grid
  trust-ticker.liquid          — running ticker of purity claims
  main-product.liquid          — product detail page
  main-collection.liquid       — collection with sidebar rail
  main-cart.liquid             — cart with ajax steppers → native Shopify checkout
  main-list-collections.liquid — all categories page
  main-search.liquid           — search results
  main-account.liquid          — customer overview
  main-page.liquid             — static pages
snippets/
  product-card.liquid          — postcard card with ADD/stepper
  icon.liquid                  — all inline SVG icons
templates/
  index.json, product.json, collection.json, cart.json,
  list-collections.json, search.json, page.json, 404.json,
  password.liquid, gift_card.liquid,
  customers/*.liquid           — login, register, account, addresses, order, reset, activate
config/
  settings_schema.json         — Theme Editor global settings (colors, ETA, fonts)
  settings_data.json           — default values
locales/
  en.default.json              — all UI strings
assets/
  theme.css                    — heritage postcard styles, Blinkit UX, responsive
  theme.js                     — AJAX cart, steppers, toast, location, product page
```

---

## Design language

- **Cream paper base** (`#F7F2E7`) with layered noise + warm gradients (fixed background).
- **Postcard cards** use `clip-path` polygons with hand-tuned uneven edges + inner dashed deckle border + paper-grain overlay. Two variants (`.postcard`, `.postcard--soft`) rotate to make each card feel unique.
- Palette: Saffron `#E95F16` (CTA), Jade `#146B3E` (fresh/delivery), Gold `#C08A2E`, Earth `#1B1410`.
- Type: **Fraunces** (heritage serif, all H1/H2), **Plus Jakarta Sans** (body), **Yatra One** (Devanagari touches).
- Devanagari monogram on the logo (घ = "Gha") + "PURE · SHUDDH · शुद्ध" wax-seal stamp on product pages.
- Block-print divider motif between sections.

---

## Blinkit-style Q-commerce features

| Feature | Where | How |
| --- | --- | --- |
| Delivery ETA (dynamic) | Mobile topbar + desktop location chip | `settings.default_eta_minutes` (Theme Editor) |
| Location finder | Topbar button | JS prompts + `localStorage` (extend later with pincode API) |
| Search | Topbar / dedicated `/search` | Native Shopify search |
| Sticky floating cart bar | All pages | Auto-shows when `cart.item_count > 0` |
| ADD button + [− qty +] stepper | Every product card + product page | AJAX to `/cart/add.js`, `/cart/change.js` |
| Bottom tabs (mobile) | Global | Home / Categories / Basket / Account |
| Category rail (drill-down) | Collection page | Sidebar with all collections + active state |
| Native Shopify checkout | Cart page → checkout | `<button name="checkout">` submits to Shopify checkout |

---

## Deploy to your Shopify store

### Option A — Shopify CLI (recommended)

1. Install Shopify CLI: <https://shopify.dev/docs/themes/tools/cli/install>
2. From this folder:
   ```bash
   cd /app/gharana-theme
   shopify theme dev --store your-store.myshopify.com
   ```
   This gives you a hot-reload preview URL.

3. When ready:
   ```bash
   shopify theme push --store your-store.myshopify.com
   ```

### Option B — Upload via Admin

1. Zip the theme folder:
   ```bash
   cd /app && zip -r gharana-heritage.zip gharana-theme -x '*.DS_Store'
   ```
2. In Shopify Admin → **Online Store → Themes → Add theme → Upload zip file**.
3. Preview → Customize → Publish.

---

## Customizing via Theme Editor

- **Theme Settings → Colors** – Adjust cream, saffron, jade, earth.
- **Theme Settings → Q-Commerce** – Delivery ETA minutes, default location label.
- **Theme Settings → Trust & Purity** – Ticker items, purity stamp text.
- **Home page** – All sections (Promo carousel, Category grid, Offer strip, Product rails, Trust badges) are drag-reorderable. Product rails accept any collection via a `collection` picker.
- **Category grid** on home accepts a `collection_list` (choose exactly which categories to feature) or auto-falls back to first 8 collections.

---

## Products / Collections

All product & collection data is pulled from your Shopify store automatically:

- **Product images** → `product.featured_image` + `product.images` (used in gallery)
- **Variants** → shown as pack pills on PDP, cycled on card via arrow (single-variant products show "Pack")
- **Tags** → tags containing `pure`, `organic`, `certified`, `lab-tested` show a **PURE** badge
- **Compare-at price** → automatic `X% OFF` badge
- **Metafield `custom.ingredients`** (optional) → shown on PDP under “Ingredients”

---

## Notes on cart & checkout

- The cart page uses your live Shopify cart. Stepper buttons call `/cart/change.js` (AJAX) and reload the cart to refresh totals.
- “Proceed to checkout” submits to Shopify’s hosted checkout — fully native, PCI-compliant, with all your existing payment methods / apps intact.
- The floating cart bar and header cart badge update automatically after every add.

---

## Version

1.0.0 — Initial heritage build.
