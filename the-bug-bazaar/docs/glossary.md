# Glossary

Plain definitions, each with an example from this shop.

**Latency.** How long one step takes. A 1-letter search waits about 1100 ms before the list updates. That wait is latency we added so a race is visible.

**Idempotency.** Doing the same request again does not do the work twice. The checkout key makes a retry return the same queued order.

**Horizontal scaling.** Add more copies of a service instead of a bigger machine. Two order-service copies can both take checkouts. They must share the idempotency store or both might charge.

**CDN.** A network of caches close to the shopper for static files. The product SVGs and the built JS could sit on a CDN. Stock numbers should not, or a shopper would see yesterday's quantity.

**Cache invalidation.** Deciding the saved copy is no longer good. After a successful order we drop the product cache, and a stock tick patches the cached quantity. Forgetting either one shows a sold-out item as available.

**Eventual consistency.** Two readers may disagree for a short time, then catch up. The WebSocket moves the on-screen stock toward the server stock. Until the next tick, the card can be a moment behind the warehouse.
