# Orders

```text
Shopper
  -> POST /api/orders  (Idempotency-Key)
    -> Order service writes one queued order
      -> queue
        -> payment worker
        -> inventory worker
        -> email worker
  <- 201 { id, status: "queued" }
```

## Why a queue

Payment, stock, and email are slow and fail differently. The shopper should get a queued id quickly. Workers pull jobs when they can. The confirmation page shows `queued` and tells the shopper the rest happens after that response.

## If email is down

The order and the stock change can still succeed. The email worker retries. The shop does not roll back a paid order because a mailbox timed out. The shopper still has the order id on screen.

## Why this checkout does not double-charge

The browser creates one idempotency key for the current cart signature (`productId:quantity` joined together). The key stays in `sessionStorage` until the order succeeds. A retry, including a second click after a timeout, sends that same key.

The mock API stores the key only after stock is reserved. A second call with the same key returns the original id and does not decrement stock again. A 409 does not store the key, so a later retry can succeed if the shopper lowers the quantity.

The button is also disabled while the request runs. That stops a double click. It does not stop two browsers. The key, and a unique constraint on the server, is the real protection. The disabled button is only a courtesy.

A 409 body includes `details.item`. The screen says "Not enough stock for {name}." It does not show the server's `stock conflict` string.
