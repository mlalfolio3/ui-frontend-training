# Monitoring

Unexpected render errors are caught by `ErrorBoundary`. The page shows "Something went wrong" and a link back to the shop. `reportError` in `src/monitoring.ts` appends a line to `monitoringLog` and writes it with `console.error`. The fallback prints that log so a reviewer can see it was recorded. The footer link "Preview the error fallback" throws on purpose.

Try it, then go back to the shop. The boundary is keyed by the path, so leaving the crash page mounts a fresh boundary and the shop renders again.

## Three things to track in a real store

1. **JavaScript errors**, with the page path and the release id. The boundary is the local version of this. A hosted app would send the same line to an error tracker.
2. **API latency and status**, especially `POST /api/orders` and `GET /api/products`. A jump in 500s or a slow catalog is a shop outage even when the page still loads.
3. **Failed checkouts**, split by 409 (stock) and network failure. 409 is a stock problem. A timeout is a payments or gateway problem. They need different alerts.

Images that fail to load do not throw. `ProductImage` swaps in an "Image unavailable" box. Some catalog rows point at `/images/missing.svg` so the fallback is visible without breaking the card.
