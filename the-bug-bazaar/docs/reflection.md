# Reflection

Scores are out of 10 for this repo, not for a whole career. Two gaps have a next step each.

| Topic | Score | Note |
| --- | --- | --- |
| TypeScript | 8 | Strict mode, no `any`. JSON is narrowed in the adapter. |
| HTTP and errors | 8 | Status codes match the contract. Raw server text stays off the screen. |
| UI states | 8 | Shop, detail, account, and desk can show loading, empty, error, and success. |
| Redux | 7 | Cart and session only. Totals are selectors. |
| Testing | 7 | Pricing, cart, API, card, and form. Fewer browser tests than unit tests. |
| Accessibility | 7 | Labels, alerts, menu keys, modal trap. Not yet checked with a screen reader. |
| Performance | 7 | Virtual window and debounce are measured. No React Profiler screenshot. |
| Auth | 7 | sessionStorage is explained, including why a cookie would be better. |

## Gaps

1. **Screen reader pass.** Keyboard paths are in the desk modal and the header menu. Next step: run VoiceOver or NVDA on the login form and the cart, and fix the first name or focus bug that shows up.
2. **Host routing.** Refresh works in Vite because the dev server serves `index.html` for unknown paths. Next step: on the real host, add the same fallback and load `/products/p-0001` in a fresh tab before calling the route done in production.
