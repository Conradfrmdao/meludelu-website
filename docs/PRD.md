# Meludelu: Product Requirements

Version 0.2 · 2 October 2026 · Owner: Meludelu founder

One shared source of truth for what we are building and why. Read this at the start of every working session.
The original PDFs are kept locally in `docs/source/` (not committed).

**Changes from v0.1**

- **Payments decided:** MTN Mobile Money and Airtel Money through **merchant USSD codes**, confirmed by hand in the
  admin. There is no payment gateway for now (section 9).
- **Database:** Neon Postgres instead of Supabase. Admin sign-in is built in (email + password, signed session
  cookie). Supabase can still be adopted later; the schema is plain Postgres.
- **Guest checkout first** (from the Kiwuka Kids PRD): no customer accounts in v1. Cart and wishlist are kept in the
  browser; customers find orders again with order number + phone.
- **Stock is reserved when the order is placed**, and put back automatically if the order is cancelled or refunded.

## 1. Overview

Meludelu is a premium online boutique selling **women's clothing** and **baby clothing** in Uganda. Some products are
physically stocked by Meludelu; others are sourced from external suppliers (including in China) and shipped on
order. Meludelu always controls the final retail price, and customers only ever see that price.

**Vision:** when someone opens the site, their first thought is "That looks expensive, modern and trustworthy."
**Positioning:** a premium fashion boutique with a soft feminine and baby aesthetic. It must not look like a
dropshipping store.

## 2. Goals and non-goals

Goals

1. A beautiful, fast, mobile-first storefront that builds trust.
2. A simple checkout that works for customers in Uganda (Mobile Money, no account).
3. An admin dashboard that lets the owner run the shop without a developer.
4. A data model that supports stocked and externally sourced products, with supplier cost kept private.
5. A codebase a beginner can understand and keep extending with AI.

Non-goals (for now): scraping supplier websites (never), supplier automation without an official API, a native app,
marketplace features, fake urgency, a payment gateway integration.

## 3. Users

| User | Needs |
| --- | --- |
| Shopper (mostly on a phone) | Browse beautifully, trust the shop, check out in under two minutes, know what she will pay and when it arrives. |
| Gift buyer | Find baby items quickly, see sizes clearly, easy delivery details. |
| Owner / admin | Add products fast, set prices, see stock, confirm payments, fulfil orders, understand sales. |
| Staff | View orders and update status, without seeing supplier costs. |

## 4. Design principles

- **Feel:** elegant, minimal, premium, soft, warm, extremely clean.
- **Layout:** generous whitespace, large photography, subtle borders, soft shadows, large rounded corners, glass/blur
  used sparingly (header on scroll, tab bar).
- **Motion:** subtle and fast; respects `prefers-reduced-motion`.
- **Colour:** ivory, cream, charcoal as primary; blush, beige, taupe as accents. Baby sections slightly softer.
  All colours are tokens in `src/app/globals.css`.
- **Type:** Instrument Serif for headlines, Figtree for body. Nothing else.
- **Mobile-first:** floating tab bar, thumb-friendly buttons, swipeable rows, sticky add-to-bag.
- **Avoid:** gradients for decoration, crowded layouts, big text blocks, template-looking components, popups,
  emoji, invented statistics or testimonials, over-bright colours.

## 5. Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Neon Postgres (`@neondatabase/serverless`) · Vercel.

## 6. Scope by stage

| Stage | Deliverable | Status |
| --- | --- | --- |
| 1 | Foundation, design system, navigation, homepage | Done |
| 2 | Database: schema, constraints, indexes, seed data, data layer | Done |
| 3 | Catalog pages, filters, sorting, empty/loading states | Done |
| 4 | Product page: gallery, variants, stock messaging, size guide, related, SEO | Done |
| 5 | Cart (drawer + page), saved in the browser | Done |
| 6 | Checkout, order creation with stock check, USSD payment step | Done |
| 7 | Customer accounts, saved addresses, account wishlist | Later (guest checkout in v1) |
| 8 | Admin: products, pricing, inventory, orders, customers, stats, settings | Done (v1) |
| 9 | Notifications (SMS/WhatsApp/email), payment gateway if needed | Planned |
| 10 | Polish: performance, accessibility audit, launch checklist | Planned |

## 7. Functional requirements

### 7.1 Navigation
Desktop: wordmark; Women, Baby, New arrivals, Collections, About; Search, Account (order tracking), Bag.
Mobile: compact top bar (menu, wordmark, search) plus a floating bottom tab bar (Home, Women, Baby, Wishlist, Bag).
Header turns frosted on scroll. Skip-to-content link.

### 7.2 Homepage
Hero (the two arches link to Women and Baby) › Women feature › Baby feature › New arrivals › Most loved › editorial ›
brand story › newsletter › footer.

### 7.3 Catalog and cards
Cards: image, name, price, previous price + discount, sizes, colour dots, stock status only when it matters,
wishlist button. Sold-out items stay visible and are marked. Catalog: `/women`, `/baby`, `/women/dresses`, …;
sort (newest, price); filters (size, colour, price, availability); "Show more"; skeletons; empty states.

### 7.4 Product page
Gallery (swipe on phones), name, price, size and colour selectors, quantity, stock status, Add to bag, Buy now,
delivery information, details, care, size guide link, related products, sticky add-to-bag bar on phones.
Sold-out variants are crossed out with an explanation.

### 7.5 Cart
Drawer and full page. Lines show image, name, size, colour, quantity, unit price and line total. Quantity is capped
by available stock for stocked items. Prices and availability are re-checked when the cart page and checkout load,
and again on the server when the order is placed.

### 7.6 Checkout (guest)
Name, phone (validated as a Ugandan number), optional email, delivery area (fees configurable in admin), address,
town/area, notes, payment method (MTN or Airtel). Pieces ordered in from abroad must be acknowledged before paying.
The order is created in one database transaction (`place_order`): prices come from the database, stocked items are
locked and deducted, so two people cannot buy the last piece.

### 7.7 Accounts and wishlist
v1: no accounts. Wishlist and bag live in the browser. "Track an order" finds an order by number + phone.

### 7.8 Admin dashboard
Protected, role-based (owner / staff). Owner sees supplier cost and margin; staff never do.
Products (create, edit, archive; images by URL; variants with size, colour, cost, price, compare-at price, stock or
availability status), pricing mode (manual or markup with rounding), inventory with movement log, orders (status,
payment confirmation, customer contact by call or WhatsApp, timeline), customers, sales stats, settings (merchant
codes, USSD strings, delivery zones, contact numbers, lead times).

### 7.9 Product sources
`supplier_type`: `MELUDELU_STOCK` (exact quantity tracked) or `EXTERNAL_SUPPLIER` (shipped on order).

### 7.10 Pricing rules
Customers only ever see `retail_price`. Supplier cost never appears in any storefront query, page or payload:
the storefront reads only the `storefront_products` / `storefront_variants` views, which do not contain cost.
Markup mode suggests `cost × multiplier` rounded to 500 or 1,000 UGX; the owner applies it and the result is stored
in `retail_price`, so later cost changes never silently change live prices (the admin flags "price needs review").

### 7.11 Inventory rules
Stocked items: exact quantity per variant; deducted when the order is placed; restored if cancelled/refunded;
every change is logged in `inventory_movements`. Status from quantity: In stock, Low stock (at or below threshold),
Sold out. External items: Made to order / Ships from abroad / Sold out, set by the owner. `SupplierAdapter`
(`src/lib/suppliers/adapter.ts`) is where an official supplier API can plug in later. No scraping.

### 7.12 SEO
Per product: slug, SEO title/description, schema.org Product data. Sitemap, robots, canonical URLs, Open Graph images.

### 7.13 Images
One `ProductImage` component. Interim photography is from Unsplash (free licence) and must be replaced with
Meludelu's own photography before launch. Supplier images only with permission.

## 8. Data model

See `db/migrations/`. Tables: categories, suppliers, products, product_variants, inventory, inventory_movements,
product_images, customers, addresses, wishlists, orders, order_items (snapshot incl. unit_cost), order_status_history,
payments, admin_users, login_attempts, store_settings, newsletter_subscribers. Money is integer UGX.

## 9. Payments: merchant USSD (decided)

1. Customer places the order and chooses MTN or Airtel. No money moves; stock is reserved.
2. The order page shows the network's merchant code, the exact amount and the order number as reference, and a
   **Dial** button. The button is a `tel:` link (with `#` encoded as `%23`) that opens the phone's dialler with the
   USSD string filled in. The customer presses call, follows the menu and enters their PIN on their own phone.
3. The customer taps **I've paid** (optionally adding the transaction ID from their SMS). The order is flagged
   "Customer says paid". It is **not** marked paid automatically.
4. Staff check the merchant account, then **Confirm payment** in the admin, which marks the order paid. They call
   the customer to confirm delivery.

The USSD string per network is a template in Admin › Settings, e.g. `*165*3#` (MTN MoMoPay menu) or
`*185*9#` (Airtel Pay menu). `{merchant}` and `{amount}` placeholders are filled per order, so if a network supports
a direct string such as `*165*3*{merchant}*{amount}#` it can be enabled without code changes. **Confirm the exact
codes with MTN and Airtel when the merchant accounts are opened.** Until a merchant code is saved, the order page
tells the customer we will call them to arrange payment.

Known limits: iPhones and desktop browsers do not open USSD codes from links, so the page also shows the code,
merchant number, amount and reference with copy buttons. A gateway (MTN MoMo API, Airtel Money API, Flutterwave,
Pesapal) can be added later behind `PaymentProvider` in `src/lib/payments/`.

## 10. Order lifecycle

`pending_payment` › `paid` › `processing` (or `ordered_from_supplier`) › `shipped` › `delivered`. Also `cancelled`
and `refunded`. Payment status is separate: `pending`, `reported`, `confirmed`, `refunded`. Every change is logged with
who and when.

## 11. Non-functional requirements

Performance (server-rendered catalog and product pages, optimised images), accessibility (WCAG 2.1 AA aims),
security (server-side validation, role-checked admin, rate limits on login and checkout, secrets only in env vars),
privacy (collect only what checkout needs), reliability (orders created atomically), maintainability (small files,
typed data layer, this document kept current).

## 12. Open decisions

| # | Decision |
| --- | --- |
| 1 | MTN and Airtel merchant codes, and whether direct-dial USSD strings are supported |
| 2 | Delivery zones and fees (defaults are placeholders) |
| 3 | Lead time for China-sourced items (default "14–21 days") |
| 4 | Returns and exchange policy (draft text on /help/returns) |
| 5 | Owner WhatsApp and phone numbers for the order page |
| 6 | Real brand story, photography and logo |
| 7 | Size guide measurements (draft on /help/size-guide) |
| 8 | Domain name |
| 9 | Order notifications to the owner (SMS / WhatsApp / email provider) |
