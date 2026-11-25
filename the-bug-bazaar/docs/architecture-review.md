# Architecture review

There is no partner repo in this workspace, so this review is of The Bug Bazaar itself, in the shape a partner review should take.

## Strengths

1. **One pricing module.** Count, subtotal, discount, and payable total all come from `summarizeCart`. The header badge cannot drift from the cart page because neither stores a count.
2. **The URL is the filter source.** Refresh and Back do not need a custom cache. The request state union also makes "loading and empty at once" unrepresentable.

## Risks

1. **The mock API and the UI agree only by convention.** `handleApi` returns plain objects. A renamed field would still compile in the server file and fail later in the adapter. A runtime check exists, but only after the response is parsed.
2. **Stock in the cart is a copy.** A tick updates it if that product is on screen. A tick for a product that is not in the current React tree still updates the server, and the cart copy can stay high until the next tick for that id. Checkout then 409s, which is safe, but the cart warning can be late.

## Recommendation

Add a contract test that builds one product through `handleApi` and runs it through `readProduct`. That locks the server shape to the adapter without a second handwritten fixture.
