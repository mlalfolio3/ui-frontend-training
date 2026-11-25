# Decisions

Each note says what we used, what else we considered, and why.

## Mock API inside Vite

The handlers live in `src/api/backend.ts`. `vite.config.ts` exposes them on `/api` during `dev` and `preview`. Another option was a separate Express process, or a fetch fake that never hits the network. The Vite middleware keeps one `npm run dev` command and still shows method, URL, status, and headers in the Network panel. Tests call `handleApi` directly so they do not need a port.

## 5,000 generated products

The shop seeds 5,000 products in `src/data/catalog.ts`. A handwritten list of 20 would be easier to read, but the catalog has to stay smooth at the larger size. Names, prices, stock, and ratings are a formula, so the data is the same on every run.

## Cents in the API, rupees on screen

The contract stores prices in cents. The training discount rule is "10% above Rs. 5,000". `discountFor` in `src/domain/pricing.ts` takes rupees. The cart converts cents to rupees, calls that one function, and converts the discount back to cents. Rs. 5,000 is not discounted. Rs. 5,001 is.

## Redux only for cart and session

Filters live in the URL. A product page's loading state lives in that page. We considered putting filters in Redux too. That would copy the URL and could drift. The header and the product page both need the cart, and those screens are not parent and child, so the cart is shared state.

## Request status is a union

`RequestState<T>` is loading, empty, error, or success. A screen cannot be loading and successful at the same time because those are different objects, not two booleans.

## Search race

Short searches are slower than longer ones. The shop aborts the previous request and ignores a response whose id is not the latest. The team desk has a checkbox that turns that guard off so the old bug can be seen: the label "Results for" can disagree with the box. Abort plus the id check is the fix. Debounce only reduces how often we send.

## WebSocket with a polling fallback

Stock changes are pushed on `/api/stock-ws`. The hook states are connecting, connected, lost, reconnecting, and closed. If the socket never opens, the hook polls `GET /api/stock-ticks` instead and shows "polling". The socket and the poll timer are cleared when the page unmounts. Server-sent events would also work. Polling alone would be simpler, but the task is to show a feed that recovers after a drop.

## Token in sessionStorage

See `docs/auth.md`. An httpOnly cookie is safer and needs a real server that can set it. This mock cannot.

## Client memory cache

GET product lists without a `search` param are cached for 15 seconds. Search results are not cached, or a slow old query could look "fresh" from the cache. Stock ticks patch the cached stock. A successful order drops the product cache. We did not add a second cache library.

## Virtualized grid, not page buttons

The API still accepts `page` and `pageSize`. The shop asks for the full filtered set and paints only the visible rows. Page buttons would also be smooth, and they would hide most of the 5,000 rows. Virtualization keeps one scrolling list. `React.memo` on every card was skipped: about 15 cards are mounted, so the extra comparison is not worth a second copy of the component contract.

## One pricing function

Discount and payable total are only calculated in `src/domain/pricing.ts`. The cart selectors call `summarizeCart`. Checkout reads those selectors. There is no second copy of the 5,000 rule.

## No automatic deploy

CI runs lint, types, tests, and build on every pull request. A failing test fails the job. Deploying `main` would need a host and a fallback rule for client-side routes. That host is not part of this repo, so the bonus deploy is not wired up.
