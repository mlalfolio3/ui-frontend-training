# API contract

Prices are integers in cents. The UI divides by 100 and shows rupees. Every error body uses this shape, and screens map the status code themselves. They do not print `error.message`.

```ts
type Product = {
  id: string
  name: string
  price: number
  category: 'keyboards' | 'ducks' | 'coffee' | 'stickers'
  stock: number
  rating: number
  imageUrl: string
}

type ApiError = {
  error: {
    code: string
    message: string
    details?: Record<string, string>
  }
}
```

## Shared endpoints

| Method | Endpoint | Success | Errors |
| --- | --- | --- | --- |
| GET | `/api/products?search=&category=&sort=&page=` | 200 `{ items: Product[], total: number }` | 500 |
| GET | `/api/products/:id` | 200 Product | 404 |
| POST | `/api/login` | 200 `{ token, user }` | 400, 401 |
| GET | `/api/me` | 200 user | 401 |
| POST | `/api/orders` | 201 `{ id, status: "queued" }` | 400, 401, 409 |
| GET | `/api/orders/:id` | 200 `{ id, status }` | 401, 404 |

Optional query params used by the shop: `inStock=1` and `pageSize` (default 24, max 5000). `sort` is `rating`, `name`, `price-asc`, or `price-desc`.

## How to force an error

| Goal | Request |
| --- | --- |
| 500 on the catalog | `search=__500` or product id `__500` |
| 404 product | any unknown id, including `__missing` |
| 400 login | empty email or password. `details.email` / `details.password` are `required` |
| 401 login | wrong password. UI copy is "Email or password is incorrect." |
| 401 session | call `/api/me` or `/api/orders` without a bearer token. The app clears the session. |
| 409 order | quantity above current stock. `details.item` is the product name. |
| 400 coupon | body `coupon` other than blank or `DUCK` |

A repeated POST with the same `Idempotency-Key` returns the original order and does not decrement stock again. The first response is 201. The retry is 200 with the same id.

## Extra desk endpoints

These are not part of the shopper contract. They exist so the team desk can show customers, partial failure, and export jobs.

| Method | Endpoint | Success | Errors |
| --- | --- | --- | --- |
| GET | `/api/customers?search=` | 200 `{ items, total }` | 500 when `search=__500` |
| GET | `/api/customers/:id` | 200 customer | 404 |
| POST | `/api/customers` | 201 customer | 400, including `details.email = taken` |
| PATCH | `/api/customers/:id` | 200 customer | 400, 404 |
| DELETE | `/api/customers/:id` | 204 | 404 |
| GET | `/api/inventory` | 200 `{ items }` | 500 when header `x-demo-fail: 1` |
| GET | `/api/stock-ticks` | 200 `{ id, stock }` | |
| POST | `/api/exports` | 202 `{ id, status: "pending" }` | |
| GET | `/api/exports/:id` | 200 pending, then ready, failed, or expired | 404 |
| GET | `/api/exports/:id/file` | 200 CSV | 404 |
| POST | `/api/suggestions` | 201 `{ id }` | 400 field codes |

Catalog responses send `Cache-Control: public, max-age=30` and an `ETag`. Orders, login, and the account send `Cache-Control: no-store`.

Live stock is a WebSocket at `/api/stock-ws`. Each message is `{ id, stock }`. A `{ type: "hello" }` frame is ignored.
