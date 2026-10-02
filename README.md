# Meludelu

Online boutique for women's and baby clothing in Uganda. Guest checkout, payment by MTN or Airtel Mobile Money
through merchant USSD codes, and an admin dashboard for products, stock and orders.

Product decisions live in [docs/PRD.md](docs/PRD.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Neon Postgres · Vercel

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and AUTH_SECRET
npm run db:migrate           # creates tables, views and functions
npm run db:seed              # sample catalogue, settings, and the owner login from SEED_OWNER_*
npm run dev                  # http://localhost:3000
```

Admin: http://localhost:3000/admin (sign in with the owner email and password used for the seed).

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | Generates route types and runs TypeScript |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Applies new files in `db/migrations` |
| `npm run db:seed` | Adds sample data (safe to re-run) |

## Where things are

```
db/migrations/          SQL schema, storefront views, place_order / set_order_status / adjust_stock functions
scripts/                migrate and seed scripts
src/app/(shop)/         storefront pages
src/app/admin/          admin dashboard
src/app/actions/        server actions (checkout, orders, newsletter, admin)
src/components/ui/      buttons, form fields, icons, price, stock badge
src/components/shop/    storefront components (header, tab bar, cart, product card, checkout…)
src/components/admin/   admin components
src/lib/catalog.ts      storefront queries (reads only the cost-free storefront views)
src/lib/admin/          admin queries (cost visible to owners only)
src/lib/payments/       PaymentProvider interface and the merchant USSD implementation
src/lib/settings.ts     store settings (merchant codes, delivery zones, contacts)
```

## How payment works

1. The customer places an order and picks MTN or Airtel. Stock is reserved; no money moves.
2. The order page shows a **Dial** button that opens the phone's dialler with the merchant USSD code, plus the
   merchant code, amount and reference with copy buttons.
3. The customer pays on their phone and taps **I've paid**.
4. In the admin, staff check the merchant account and press **Confirm payment**, then call the customer.

Set the merchant codes and USSD strings in **Admin › Settings**. Until a merchant code is saved, customers are told
we will call them to arrange payment.

## Before launch

- Add real MTN and Airtel merchant codes and check the USSD strings with each network.
- Replace the interim Unsplash photography with Meludelu's own photos.
- Confirm delivery zones and fees, the China lead time, and the returns and size guide text.
- Add owner WhatsApp and phone numbers in Settings.
