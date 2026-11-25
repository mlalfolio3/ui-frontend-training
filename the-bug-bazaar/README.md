# The Bug Bazaar

A small shop for developer gear: keyboards, rubber ducks, coffee, and stickers. The app is React + TypeScript, with a mock API that runs inside the Vite dev server. No separate backend is required.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. A teammate only needs Node.js 20 and these two commands. Copy `.env.example` to `.env` if you want to change the mock delay. The app runs with the defaults if you skip that file.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Shop, mock API, and live stock socket |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Serve the production build with the same mock API |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | Oxlint |

## Environment

`API_DELAY_MS` is optional. It is the base wait for mock API responses. Searches shorter than 4 characters wait at least 1100ms so an older response can arrive after a newer one. See `.env.example`.

## Demo login

- Email: `ada@bugbazaar.dev`
- Password: `quack-quack`

Checkout and Account need this login. After login you return to the page you came from.

## Shopping rules

- Prices are stored in cents and shown in rupees.
- Adding the same product again increases its quantity. The cart does not grow a second row.
- Quantity cannot be raised above the stock you last saw.
- 10% off when the subtotal is above Rs. 5,000. Rs. 5,000 itself is full price.
- Checkout sends one idempotency key per cart contents. Retrying does not create a second order.
- Coupon `DUCK` is accepted. `BAD` shows a field error. Blank is fine.

## Trigger each UI state

| State | How |
| --- | --- |
| Loading | Type a 1–3 letter search. It is slower on purpose. |
| Empty | Search for `zzzz-none`, or use Preview page states. |
| Error | Search for `__500`, open `/products/__500`, or choose "Make inventory fail" on the team desk. |
| Success | Clear the search. |
| Not found | Open `/products/__missing` or any unknown address. |
| Offline | Team desk → Simulate offline. |
| Out of stock at checkout | Leave an item in the cart and wait until live stock drops below the quantity, then place the order. |
| Crash fallback | Footer link "Preview the error fallback". |

Filters live in the URL, so refresh, copy, and Back keep the same shop view.

## Layout

```text
src/pages        screens
src/components   reusable UI
src/api          the only place that calls fetch
src/domain       pricing, validation, filters
src/store        cart and session
server is the mock inside vite.config.ts
docs             contracts, decisions, and review notes
```

Written notes for the week are in `docs/`.
