# Training notes

Short answers tied to this shop. They are here so the written parts of the guides sit next to the code.

## Types

`Number('')` is `0`, `Number('abc')` is `NaN`, `Number('0')` is `0`, `Number('-5')` is `-5`, `Number('250')` is `250`. `validatePrice` rejects the first four and accepts `'250'`.

Empty string means the shopper typed nothing. `null` means we know the value is empty on purpose. `undefined` means we never set it. This app uses `null` for "not logged in" (`token: null`) and `''` for "no category chosen".

Falsy values: `false`, `0`, `''`, `null`, `undefined`, `NaN`. A disabled Add button is a courtesy. The server still checks stock. Hiding a button is not a security rule.

## Functions

A parameter is the name in the function (`total` in `discountFor`). An argument is the value at the call (`discountFor(5001)`). `discountFor` is pure: the same input always returns the same number and it changes nothing else. Throw when the program cannot continue, such as a response that is not a product list. A bad price is not a throw. It is a message, because the shopper can fix it.

`lineTotal(price, quantity)` should be pure. It should throw only if `quantity` is not a number we can multiply, not when the shopper simply ordered zero.

## Scope

A cart total in the module is module scope. A total inside `summarizeCart` is function scope. A `const` inside an `if` is block scope. A `let` on `window` would be global. This app does not keep the cart total on `window`, because two scripts would share it and overwrite each other.

## Hoisting and closures

`console.log(a); var a = 7` prints `undefined` because `var` is hoisted and set to `undefined`. `console.log(b); let b = 7` throws because `b` is in the temporal dead zone. `for (var i = 0; i < 3; i++)` with `setTimeout` prints `3 3 3` because every callback sees the one `i`. `let` or a factory `function makePrinter(n) { return () => n }` prints `0 1 2`.

`onClick={save}` passes the function. `onClick={save()}` calls it during render. A stale closure happens when an effect or timer captured an old `cart` and a later click still sees that old array. The cart slice avoids that by reading state inside the reducer. The stock hook keeps the latest callback in a ref so the socket effect does not restart, and does not call the first callback forever.

## Event loop

`console.log('A'); Promise.resolve().then(() => console.log('B')); setTimeout(() => console.log('C'), 0); console.log('D')` prints `A D B C`. A and D run on the stack. B is a microtask. C is a task and runs after microtasks.

`fetch` rejects on a network failure, not on 404 or 500. `response.ok` is how `apiRequest` notices those statuses.

## Web request

```text
Browser (shop page)
  -> API request /api/products?search=duck
    -> server handler (mock in Vite, or a real order service)
      -> database or in-memory catalog
    <- JSON
  <- UI renders cards
```

| Layer | One failure | One check |
| --- | --- | --- |
| Browser | Old JS from cache | Network response body vs the cards on screen |
| API | 500 or a dropped socket | Status code and whether the latest request was aborted |
| Server | Handler throws | Server log, not the shopper's alert text |
| Database | Catalog query times out | The same request against the database without the UI |

## Client and server

Client-owned: layout, search draft, debounce, cart editing, loading spinners, focus, empty states, formatting cents as rupees, disabling a button, the idempotency key in the tab.

Server-owned: the product list, stock, login check, order id, 409 when stock is gone, unique email, the real charge.

Client checks are for a fast message. Server checks are the rule. A disabled button does not stop a hand-written request.

## DOM

Clicks bubble from the button to the list. The desk customer list uses one listener and reads `data-action` so Edit and Delete share it. A form `submit` fires when Enter is pressed in a field. A button `click` does not submit unless it is `type="submit"`. `preventDefault` on submit stops a full page reload.

## 401 and 403

401 means we do not know who you are, or the session died. The app clears the token and asks you to log in. 403 means we know who you are and you still may not do it. Hiding the button is not either of those.

## Architecture terms

| Term | One sentence | What the shopper notices |
| --- | --- | --- |
| Backend | The program behind `/api`, not the React page. | The list is empty if it is down, even when the JS loaded. |
| Database | Stored products, users, and orders. | A bad query looks like a 500 or a missing product. |
| Cache | A saved copy so we skip work. | A card can show an old stock count until it is patched or dropped. |
| CDN | Servers near the shopper that store static files. | The page can be fast while the API is slow, or stale after a release. |
| Load balancer | Sends each request to one of several servers. | A retry might hit a different copy, so the order key must be shared. |
| Microservices | Catalog, inventory, and email as separate programs. | Coffee can load while the inventory panel fails. |
| API gateway | One front door that routes and checks tokens. | The browser talks to one host, not to every worker. |
| Serverless | A function that runs per request and can scale to zero. | The first search after a quiet period can be slower. |
| Queue | A line of jobs for later workers. | The order is `queued` before the email exists. |
| Cron | A clock that starts work on a schedule. | An expired export link is a job the clock marked old. |
| Sharding | Splitting data across databases, often by id. | A product id must know which shard to read, or the detail page 404s. |

## WebSocket states

The pill on the shop shows connecting, connected, lost, reconnecting, or polling. Polling is the fallback when the socket never opens. Reconnect sends the same `{ id, stock }` shape. Rows are updated by id, not appended, so a repeat tick does not duplicate a product.

## Scenarios

- One desk panel returns 500: that panel shows Retry. The catalog panel stays up. See Team desk, "Make inventory fail".
- Double save: the submit button disables immediately, and the server rejects a duplicate email. The button alone is not enough.
- Search for `a` returns after `apple`: abort the old request or ignore it with a request id. Both are in the shop. The desk can turn the guard off.
- Refresh 404 in production: the host must serve `index.html` for client routes. Vite already does this locally.
- AI says `setCart([...cart, product])`: reject it. A repeat add must increment quantity. The cart test checks the row count.
