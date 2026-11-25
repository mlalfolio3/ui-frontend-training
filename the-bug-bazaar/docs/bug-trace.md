# Bug trace: old search overwrites the new one

| | |
| --- | --- |
| Expected | The customer list matches the latest text in the box. |
| Actual | With "Ignore older search responses" unchecked, a slow short query can finish last and the line "Results for" shows the older text. |
| Evidence | Short searches wait at least 1100 ms (`delayMsFor`). Longer ones use the base delay. The desk leaves the previous request running when the guard is off, so both responses can land. |
| Fix | `CustomerPanel` keeps a request id. When the guard is on, it aborts the previous request and drops a response whose id is not `latestRequest.current`. The shop does this all the time. |

How to see it: open Team desk, uncheck the guard, type `s`, wait until that request has started, then quickly finish `sara`. If the slow response lands last, "Results for" flips back. Check the guard and repeat. The list stays on the latest query.

The same id check is `isLatestRequest` in `src/domain/requests.ts`, with a unit test.
