# Checklists

## Pull request

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Shop search, category, in-stock, and sort still share one URL
- [ ] Adding the same product twice does not add a second cart row
- [ ] Discount is unchanged at Rs. 5,000 and appears above it
- [ ] Checkout retry uses the same idempotency key
- [ ] Login errors are announced and the button cannot be double-submitted
- [ ] New UI has a visible focus style and a label
- [ ] `.env` is not in the diff

CI in `.github/workflows/ci.yml` runs lint, types, tests, and build. A failing test fails the job, so the branch should not be merged.

## Five differences that can break staging

1. **Client-route fallback.** Vite serves `index.html` for `/products/p-0001`. A static host may return 404 on refresh.
2. **`API_DELAY_MS` and the API origin.** Local requests go to the Vite middleware. Staging must point at a real host or the shop stays on the mock.
3. **WebSocket proxy.** `/api/stock-ws` needs an upgrade header. A proxy that only forwards HTTP shows "connection lost" and then the polling fallback.
4. **HTTPS.** `wss` is chosen when the page is `https`. A mixed `ws://` socket is blocked by the browser.
5. **Cached assets.** A CDN can keep yesterday's JS. Shoppers then run an old cart rule against a new API. See the stale-data list below.

## Stale data

| Layer | What to inspect | What we do here |
| --- | --- | --- |
| Browser | `Cache-Control` and `ETag` on `/api/products` | Catalog responses are `public, max-age=30`. Orders are `no-store`. |
| CDN | Age of `index.html` and hashed JS | Not used locally. `index.html` must not be cached for a year. |
| API cache | Whether stock is part of the cached body | The client cache lasts 15 seconds and is patched by stock ticks. Search results are not cached. |
| React state | A list left on screen after the server changed | Ticks update the open list. A successful order clears the product cache. |

## Monitoring

See `docs/monitoring.md`: JS errors, API latency and status, failed checkouts. Image failures use the card fallback instead of a blank icon.

## Keyboard notes

- Login: Tab from email to password to Log in. Empty submit announces the alert.
- Header Menu: Enter opens it, Arrow Up and Arrow Down move, Escape closes, Home and End jump.
- Edit customer on the desk: Tab stays inside the dialog, Escape closes, focus returns to the button that opened it.

## Manual cart checks

| Case | Expected |
| --- | --- |
| Add the same product twice | One row, quantity 2 |
| Remove | Row disappears and the badge drops |
| Increase | Stops at the known stock |
| Decrease at quantity 1 | Row is removed |
| Empty cart | Empty message, no payable total |
| Subtotal Rs. 5,000 | Discount Rs. 0.00 |
| Subtotal above Rs. 5,000 | Discount is 10% |
