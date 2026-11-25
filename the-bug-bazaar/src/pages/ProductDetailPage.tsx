import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct } from '../api/products.ts'
import { BackToTop } from '../components/BackToTop.tsx'
import { ProductImage } from '../components/ProductImage.tsx'
import { LoadingBlock, StatusPanel } from '../components/StatusPanel.tsx'
import { isApiError } from '../domain/errors.ts'
import { categoryLabel, isOnSale, productStatus } from '../domain/products.ts'
import { formatRupeesFromCents } from '../domain/pricing.ts'
import { isAbortError } from '../domain/requests.ts'
import { useStockFeed } from '../hooks/useStockFeed.ts'
import { useAppDispatch } from '../store/hooks.ts'
import { addItem, syncStock } from '../store/cartSlice.ts'
import type { Product, RequestState, StockTick } from '../types.ts'

export function ProductDetailPage() {
  const { id = '' } = useParams()
  const dispatch = useAppDispatch()
  const [requestState, setRequestState] = useState<RequestState<Product>>({ state: 'loading' })
  const [seconds, setSeconds] = useState(0)
  const [retryToken, setRetryToken] = useState(0)
  const [notice, setNotice] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setRequestState({ state: 'loading' })
    setSeconds(0)
    setQuantity(1)
    getProduct(id, controller.signal)
      .then((product) => {
        if (active) setRequestState({ state: 'success', data: product })
      })
      .catch((error: unknown) => {
        if (!active || isAbortError(error)) return
        setRequestState({
          state: 'error',
          message: isApiError(error) ? error.userMessage : 'Service unavailable',
        })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [id, retryToken])

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [id])

  const onTick = useCallback((tick: StockTick) => {
    setRequestState((current) => {
      if (current.state !== 'success' || current.data.id !== tick.id) return current
      return { state: 'success', data: { ...current.data, stock: tick.stock } }
    })
    dispatch(syncStock(tick))
  }, [dispatch])

  useStockFeed(onTick)

  const product = requestState.state === 'success' ? requestState.data : null
  const soldOut = product ? product.stock <= 0 : false
  const selected = product && product.stock > 0 ? Math.min(quantity, product.stock) : 1

  return (
    <section className="page pdp-page">
      <p className="back-row">
        <Link className="back-link" to="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to the shop
        </Link>
      </p>
      {requestState.state === 'loading' ? <LoadingBlock label="Loading product" /> : null}
      {requestState.state === 'error' ? (
        <StatusPanel
          tone="error"
          title={requestState.message === 'Product not found' ? 'Product not found' : 'We could not load this product'}
          message={requestState.message}
          actionLabel="Retry"
          onAction={() => setRetryToken((value) => value + 1)}
        />
      ) : null}
      {product ? (
        <article className="detail pdp">
          <div className="pdp-media">
            <ProductImage src={product.imageUrl} alt={product.name} />
          </div>
          <div className="pdp-info">
            <p className="pdp-category">{categoryLabel(product.category)}</p>
            <h1>{product.name}</h1>
            <p className="price">{formatRupeesFromCents(product.price)}</p>
            <div className="pdp-stock">
              <p className={soldOut ? 'stock-warn' : 'stock-ok'}>
                {soldOut ? null : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12.5l2.5 2.5L16 9.5" />
                  </svg>
                )}
                {soldOut ? 'Sold out' : `${product.stock} in stock`}
              </p>
              {isOnSale(product) ? (
                <>
                  <span className="pdp-rule" aria-hidden="true" />
                  <p className="badge sale">On sale</p>
                </>
              ) : null}
            </div>
            <div className="pdp-buy">
              <div className="qty">
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${product.name}`}
                  disabled={soldOut || selected <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  −
                </button>
                <span aria-live="polite">{selected}</span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${product.name}`}
                  disabled={soldOut || selected >= product.stock}
                  onClick={() => setQuantity((value) => value + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={soldOut}
                onClick={() => {
                  for (let count = 0; count < selected; count += 1) dispatch(addItem(product))
                  setNotice(`Added ${product.name} to the cart.`)
                }}
              >
                {soldOut ? 'Sold out' : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="M6 7h15l-1.6 8.2H8.2L6 7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M6 7L4.8 4H2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <circle cx="9" cy="19.2" r="1.2" fill="currentColor" />
                      <circle cx="17" cy="19.2" r="1.2" fill="currentColor" />
                    </svg>
                    Add to cart
                  </>
                )}
              </button>
            </div>
            <p className="sr-only" aria-live="polite">{notice}</p>
            <p className="pdp-timer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="13" r="7" />
                <path d="M12 13V9" />
                <path d="M9 3h6" />
              </svg>
              Time on this page: {seconds}s
            </p>
            <p className="pdp-copy">
              {product.category === 'keyboards'
                ? 'A fashion piece for everyday wear.'
                : 'A desk companion for debugging sessions.'}{' '}
              Prices are stored in cents and shown in rupees.
              Stock can change while you read this page.
            </p>
            <p className="pdp-preview">
              Preview states: <Link to="/products/__missing">missing product</Link>
              {' · '}
              <Link to="/products/__500">server error</Link>
            </p>
          </div>
        </article>
      ) : null}
      <BackToTop />
    </section>
  )
}
