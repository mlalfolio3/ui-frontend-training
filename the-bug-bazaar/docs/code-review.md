# Code review notes

Five comments on this store, plus one thing that is in good shape. Line numbers move; the file and the behavior are the point.

## Correctness

`src/store/cartSlice.ts`, `addItem`. A second add finds the existing row and increments it. Replacing this with `items.push({ product, quantity: 1 })` every time would break the "one row per product" rule. The test "increases quantity when the same product is added again" is the evidence to keep.

`src/domain/pricing.ts`, `discountFor`. The comparison is `totalRupees > 5000`, not `>=`. Rs. 5,000 must stay undiscounted. The tests cover 5000 and 5001.

## Readability

`src/pages/ProductsPage.tsx`. The fetch effect, the debounce effect, and the stock callback are all in one component. A reader can follow them, but a comment at the top of the fetch effect stating "URL is the source, this effect only loads" would make the next edit safer.

## Accessibility

`src/components/ProductCard.tsx`. The image alt is empty because the product name is in the heading inside the same link. That avoids a double announcement. The add button is outside the link, so keyboard users can open the product and add it as two stops. Keep the button out of the link. Nesting them is invalid HTML and a bad name for the link.

`src/pages/LoginPage.tsx`. Errors use `role="alert"` on the summary and `aria-invalid` on the fields. Do not remove the alert when tightening the layout, or a screen reader will not hear a failed login.

## Praise

`src/api/client.ts` maps status codes in one place and never assigns `error.message` from the server onto the screen. The 404 and 500 tests lock that in.
