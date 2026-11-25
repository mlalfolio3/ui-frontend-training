# AI notes

The store was drafted with an AI coding assistant from the Bug Bazaar brief and the two training guides. Three uses are logged below.

## 1. Project skeleton

**Prompt.** Build the Bug Bazaar store from the PDFs: React, TypeScript, mock API, filters in the URL, cart, checkout, tests, and the written docs.

**Kept.** Vite, React Router, Redux Toolkit for the cart and session, one `apiRequest` wrapper, and `discountFor` as the only discount rule.

**Changed.** The first sketch stored a filtered array in state beside the URL. That can drift. The page keeps the URL as the filter source and renders the latest response. No second list.

**Why.** The brief says the visible products are derived, and a copied link must reproduce the view.

## 2. Checkout idempotency

**Prompt.** Retrying a checkout must not create a second order, and a 409 must name the item.

**Kept.** `Idempotency-Key` stored with the cart signature, 409 `details.item`, and a disabled submit button.

**Changed.** An early idea cleared the cart before the response came back. A failed request would empty the cart and the retry would have nothing to send. The cart now clears only after a 201 or 200.

**Why.** The retry has to send the same items and the same key.

## 3. Live stock

**Prompt.** Show stock changes without a refresh, recover after a disconnect, and stop when the page closes.

**Kept.** A real WebSocket on `/api/stock-ws`, status text, and cleanup in the hook.

**Changed.** The assistant's sketch updated stock only in React state. Checkout would still see the old server stock and could not return 409. The server now changes stock first, then pushes the tick. The client patches the card and the cart's stored stock, but it does not silently lower the quantity, so checkout can still be rejected.

**Why.** The 409 has to be a server answer, not only a disabled button.

## One mistake and how it was caught

A generated product-card link used `<a href>`, which reloads the page and drops client state. The tests rendered, but a shopper would lose the in-memory session timing on a slow navigation. It was changed to React Router's `Link`. The typecheck did not catch it because both are valid JSX.

## What not to hand to AI

The discount boundary and the idempotency rule. They are short, and a confident wrong version (discount at exactly Rs. 5,000, or `setCart([...cart, product])` on every add) looks fine in a demo. Those stay in `pricing.ts` and `cartSlice.ts` with tests that fail if the boundary or the row count moves.

## Tests run while building

`npm test`, `npm run typecheck`, and `npm run lint`. The form test failed once because two forms shared the document. Cleanup in the test setup fixed it. That failure is why the form test types a name, leaves the price empty, and checks the name is still there.
