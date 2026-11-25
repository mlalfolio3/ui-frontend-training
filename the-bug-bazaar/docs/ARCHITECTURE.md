# Architecture

## Folders

```text
src/pages         one screen each: shop, product, cart, checkout, order, login, account, desk
src/components    cards, grid, forms, modal, boundary
src/api           fetch wrapper plus one function per endpoint
src/api/backend   in-memory API used by Vite and by tests
src/domain        pricing, validation, filters, errors
src/store         cart slice, session slice, selectors
src/hooks         debounce, window width, stock feed
```

Pages do not call `fetch`. They call `src/api/*`, which calls `apiRequest`.

## Data flow

```text
URL filters  --read-->  ProductsPage
                              |
                              | getProducts()
                              v
                           apiRequest  -->  /api/products  -->  queryProducts
                              |
                              v
                        RequestState (loading | empty | error | success)
                              |
                              v
                        VirtualGrid  -->  ProductCard
                              |
                     onAdd    |
                              v
                        cart slice  -->  selectCartCount  -->  header badge
```

Props go down: the page passes a product and `onAdd` into `ProductCard`. Events go up: the card calls `onAdd`, and the page dispatches `addItem`. The card does not know about Redux.

## Where state lives

| Kind | Examples |
| --- | --- |
| URL | search, category, in-stock, sort |
| Server | products, stock, orders, customers, the signed-in user from `/api/me` |
| Shared client | cart items, token and user |
| Local | search draft before debounce, coupon box, modal open, form errors |
| Derived | visible row window, cart count, subtotal, discount, payable total, on-sale badge, low-stock label |

The filtered list is not stored next to the filters. The success payload is the response for the current URL. Cart totals are selectors, not fields in the slice.

## Three patterns

**Container and presentational.** `ProductsPage` loads and dispatches. `ProductCard` only renders and calls `onAdd`. The card is easier to test because it has no store.

**Custom hooks.** `useDebouncedValue` is the search pause on the shop and the desk. `useWindowWidth` is the grid columns and the footer readout, and it removes its resize listener. `useStockFeed` is the socket, the reconnect, and the polling fallback. Each one is used in more than one place or replaces a listener we would otherwise copy.

**Adapter.** `src/api/adapt.ts` is the only place that reads JSON into `Product`, `Customer`, `OrderSummary`, and `ExportJob`. Pages never poke at `response.items` themselves. If the server shape changes, the adapter is the file to edit.

## Hooks we did not add

A `useProducts` hook would only wrap the shop's effect. The desk loads a different query with its own error state. One hook would hide two different screens. The fetch stays in the page so the loading branch is visible.
