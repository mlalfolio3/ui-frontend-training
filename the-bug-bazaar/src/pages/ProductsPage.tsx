import { useCallback, useEffect, useRef, useState } from 'react'
import { getProducts } from '../api/products.ts'
import { ProductCard } from '../components/ProductCard.tsx'
import { LoadingBlock, StatusPanel } from '../components/StatusPanel.tsx'
import { VirtualGrid } from '../components/VirtualGrid.tsx'
import { isApiError, messageFrom } from '../domain/errors.ts'
import { categoryLabel, PAGE_SIZE, readFilters } from '../domain/products.ts'
import { isAbortError, isLatestRequest } from '../domain/requests.ts'
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts'
import { useStockFeed, type FeedStatus } from '../hooks/useStockFeed.ts'
import { useAppDispatch } from '../store/hooks.ts'
import { addItem, syncStock } from '../store/cartSlice.ts'
import { CATEGORIES, type Product, type RequestState, type StockTick } from '../types.ts'
import { useSearchParams } from 'react-router-dom'

function ProductPager({
  page,
  pageCount,
  pages,
  onPage,
}: {
  page: number
  pageCount: number
  pages: Array<number | 'gap'>
  onPage: (page: number) => void
}) {
  return (
    <nav className="pager" aria-label="Pagination">
      <button type="button" className="pager-step" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Previous
      </button>
      <div className="pager-pages">
        {pages.map((entry, index) =>
          entry === 'gap' ? (
            <span key={`gap-${index}`} className="pager-gap" aria-hidden="true">…</span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? 'page' : undefined}
              onClick={() => onPage(entry)}
            >
              {entry}
            </button>
          ),
        )}
      </div>
      <button type="button" className="pager-step" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
        Next
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </nav>
  )
}

function visiblePages(current: number, count: number): Array<number | 'gap'> {
  const wanted = new Set([1, count, current - 1, current, current + 1])
  if (current <= 2) wanted.add(3)
  if (current >= count - 1) wanted.add(count - 2)
  const pages = [...wanted].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b)
  const list: Array<number | 'gap'> = []
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) list.push('gap')
    list.push(page)
  })
  return list
}

function feedLabel(status: FeedStatus): string {
  if (status === 'connected') return 'Live stock connected'
  if (status === 'connecting') return 'Connecting to live stock'
  if (status === 'reconnecting') return 'Reconnecting to live stock'
  if (status === 'lost') return 'Live stock connection lost'
  if (status === 'polling') return 'Live stock using polling fallback'
  return 'Live stock closed'
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFilters(searchParams)
  const [draft, setDraft] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(draft, 300)
  const [requestState, setRequestState] = useState<RequestState<{ items: Product[]; total: number }>>({
    state: 'loading',
  })
  const [notice, setNotice] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const requestId = useRef(0)
  const dispatch = useAppDispatch()

  useEffect(() => {
    setDraft(filters.search)
  }, [filters.search])

  useEffect(() => {
    if (debouncedSearch === filters.search) return
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) next.set('search', debouncedSearch)
    else next.delete('search')
    next.delete('page')
    setSearchParams(next, { replace: true })
  }, [debouncedSearch, filters.search, searchParams, setSearchParams])

  const queryKey = searchParams.toString()

  useEffect(() => {
    const id = requestId.current + 1
    requestId.current = id
    const controller = new AbortController()
    setRequestState({ state: 'loading' })
    getProducts(readFilters(new URLSearchParams(queryKey)), controller.signal)
      .then((data) => {
        if (!isLatestRequest(id, requestId.current)) return
        if (data.total === 0) setRequestState({ state: 'empty' })
        else setRequestState({ state: 'success', data })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        if (!isLatestRequest(id, requestId.current)) return
        setRequestState({ state: 'error', message: isApiError(error) ? error.userMessage : messageFrom(error) })
      })
    return () => controller.abort()
  }, [queryKey, retryToken])

  const onTick = useCallback((tick: StockTick) => {
    setRequestState((current) => {
      if (current.state !== 'success') return current
      return {
        state: 'success',
        data: {
          ...current.data,
          items: current.data.items.map((item) => (item.id === tick.id ? { ...item, stock: tick.stock } : item)),
        },
      }
    })
    dispatch(syncStock(tick))
  }, [dispatch])

  const feed = useStockFeed(onTick)

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams)
    if (page <= 1) next.delete('page')
    else next.set('page', String(page))
    setSearchParams(next)
  }

  const pageCount =
    requestState.state === 'success' ? Math.max(1, Math.ceil(requestState.data.total / PAGE_SIZE)) : 1
  const rangeStart = requestState.state === 'success' ? (filters.page - 1) * PAGE_SIZE + 1 : 0
  const rangeEnd =
    requestState.state === 'success' ? rangeStart + requestState.data.items.length - 1 : 0
  const totalLabel =
    requestState.state === 'success'
      ? `Showing ${rangeStart}–${rangeEnd} of ${requestState.data.total} products`
      : requestState.state === 'empty'
        ? '0 products'
        : 'Updating products'
  const pageNumbers = visiblePages(filters.page, pageCount)

  return (
    <section className="page">
      <div className="shop-body">
      <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <h2 className="filters-title">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Filters
        </h2>
        <div className="search-field">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            value={draft}
            placeholder="Try shirt, dress, blazer"
            onChange={(event) => setDraft(event.target.value)}
          />
          <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={filters.category}
            onChange={(event) => updateParam('category', event.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{categoryLabel(category)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort">Sort</label>
          <select id="sort" value={filters.sort} onChange={(event) => updateParam('sort', event.target.value)}>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div className="filter-actions">
          <label className="check">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(event) => updateParam('inStock', event.target.checked ? '1' : '')}
            />
            In stock only
          </label>
          <button type="button" className="soft" onClick={() => setSearchParams(new URLSearchParams())}>
            Clear filters
          </button>
        </div>
      </form>

      <div className="shop-results">
      <div className="page-head">
        <h1>Gear for people who ship bugs and fixes</h1>
        <p className={feed.status === 'connected' ? 'live-pill ok' : 'live-pill'} role="status">{feedLabel(feed.status)}</p>
        <p className="shop-intro">Search, filter, and sort. The list you see is calculated from the catalog and the filters in the address bar.</p>
      </div>
      <div className="results-bar">
        <details className="reviewer">
          <summary>Preview page states</summary>
          <div className="button-row">
            <button type="button" onClick={() => setDraft('__500')}>Error</button>
            <button type="button" onClick={() => setDraft('zzzz-none')}>Empty</button>
            <button type="button" onClick={() => setDraft('')}>Success</button>
            <button type="button" onClick={feed.drop}>Simulate disconnect</button>
          </div>
          <p>Loading shows on its own while a search request is still in flight. A short search is deliberately slower than a longer one.</p>
        </details>
        <p className="result-count" aria-live="polite">{totalLabel}</p>
      </div>
      <p className="sr-only" aria-live="polite">{notice}</p>

      {requestState.state === 'loading' ? <LoadingBlock label="Loading products" /> : null}
      {requestState.state === 'error' ? (
        <StatusPanel
          tone="error"
          title="We could not load the shop"
          message={requestState.message}
          actionLabel="Retry"
          onAction={() => setRetryToken((value) => value + 1)}
        />
      ) : null}
      {requestState.state === 'empty' ? (
        <StatusPanel
          title="No gear matches"
          message="Try another search, or clear the filters to see the full catalog."
          actionLabel="Clear filters"
          onAction={() => setSearchParams(new URLSearchParams())}
        />
      ) : null}
      {requestState.state === 'success' ? (
        <VirtualGrid
          items={requestState.data.items}
          resetKey={queryKey}
          renderItem={(product) => (
            <ProductCard
              product={product}
              onAdd={(item) => {
                dispatch(addItem(item))
                setNotice(`Added ${item.name} to the cart.`)
              }}
            />
          )}
        />
      ) : null}
      {requestState.state === 'success' && pageCount > 1 ? (
        <ProductPager
          page={filters.page}
          pageCount={pageCount}
          pages={pageNumbers}
          onPage={goToPage}
        />
      ) : null}
      </div>
      </div>
    </section>
  )
}
