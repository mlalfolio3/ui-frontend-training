# Auth

## Where the token lives

`POST /api/login` returns `{ token, user }`. The session slice stores both, and `src/store/store.ts` writes them to `sessionStorage` under `bug-bazaar-session`. The cart stays in `localStorage` because it should survive a new tab. The session should not.

Every later call sends `Authorization: Bearer <token>`.

## Why sessionStorage, and the trade-off

`sessionStorage` keeps the token on this browser tab until the tab closes. It is simple, and a refresh stays logged in.

The cost: any script that runs on the page can read it. An httpOnly cookie cannot be read by JavaScript, so a stolen script cannot lift the token as easily. A cookie needs the server to set `Set-Cookie` and to check it on every request. This mock has no such server. If this became a real API, the token would move to an httpOnly, Secure, SameSite cookie, and the client would stop storing it.

Closing the tab clears `sessionStorage`. A cookie with an expiry would last longer, which is another reason to choose it only when the server owns the session.

## What the UI does

- Account and checkout are behind `ProtectedRoute`. No token sends you to `/login?returnTo=...`.
- `returnTo` must start with a single `/`. A value like `//evil.example` is ignored so login cannot redirect off the site.
- The login button is disabled while the request is in flight, and the handler returns immediately if a submit is already running.
- A 401 from any API call runs `clearSession`. The login form's own 401 is the bad-password case and uses different copy: "Email or password is incorrect." A 401 on checkout or account says the session expired.
- Logging out only removes the token locally. The mock does not have a logout endpoint. A real server would also revoke the session.

## What is not a permission check

Hiding the checkout button is not authorization. The order endpoint returns 401 when the token is missing. A viewer who can craft a request must still be rejected by the server. This app does not have roles beyond `customer`, so it does not demo 403. The mapper still has copy for 403: "You do not have permission to do that."
