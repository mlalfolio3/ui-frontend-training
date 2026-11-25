# Performance

Measured on this machine with Node 20. The catalog has 5,000 products.

## 1. Filtering on every keystroke

A loop filtered 5,000 plain product objects 300 times (name includes "duck", one category, in stock).

| | Time |
| --- | --- |
| 300 full scans | 125.7 ms |
| One scan | 0.419 ms |

0.4 ms is cheap once. It is not cheap if every key sends a request that also waits on the network. Short searches are forced to take at least 1100 ms, so a fast typist would stack slow calls.

**Change:** `useDebouncedValue` waits 300 ms after the last key before the URL, and therefore the request, updates. One pause produces one request. The abort controller drops a request that is already in flight when the query changes.

**After:** a word typed without a 300 ms pause causes one scan and one request, not one per letter. The 0.419 ms scan still happens, once.

## 2. Painting every card

At a 720 px tall list, rows are 440 px and there are 3 columns. 5,000 items are about 1,667 rows.

| | Cards in the DOM |
| --- | --- |
| Render every match | up to 5,000 |
| `visibleRowRange` | 5 rows, 15 cards |

**Change:** `VirtualGrid` keeps a spacer for the full height and mounts only the visible slice, plus a little overscan. `src/domain/virtual.ts` is covered by a unit test that the window stays under 20 rows.

**After:** scrolling the shop moves the window. The DOM stays near 15 cards instead of thousands.

React DevTools would show `ProductsPage` and `VirtualGrid` as the list cost, and the card commit should stay small because the row count does not grow with the catalog. The number we can rerun without the profiler is the 15-card window above.

## Skipped on purpose

`React.memo` around `ProductCard` was removed from the plan. A stock tick updates one product, and only the visible cards re-render. Fifteen cards do not need a memo comparison. A 40-row admin table would not need virtualization either. This catalog does, because it is 5,000 rows, not 40.

`useMemo` around the discount was also skipped. `summarizeCart` is a short reduce over the cart, which is a handful of lines, not 5,000.
