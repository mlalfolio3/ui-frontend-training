import { useEffect, useState } from 'react'
import { getInventory, getProducts } from '../api/products.ts'
import { setOfflineDemo } from '../api/client.ts'
import { messageFrom } from '../domain/errors.ts'
import { inStockByCategory } from '../domain/products.ts'
import { formatRupeesFromCents } from '../domain/pricing.ts'
import { isAbortError } from '../domain/requests.ts'
import type { Product, RequestState } from '../types.ts'
import { LoadingBlock, StatusPanel } from './StatusPanel.tsx'

export function DashboardPanels() {
  const [catalog, setCatalog] = useState<RequestState<Product[]>>({ state: 'loading' })
  const [inventory, setInventory] = useState<RequestState<Product[]>>({ state: 'loading' })
  const [failInventory, setFailInventory] = useState(false)
  const [offline, setOffline] = useState(false)
  const [catalogRetry, setCatalogRetry] = useState(0)
  const [inventoryRetry, setInventoryRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setCatalog({ state: 'loading' })
    getProducts(
      { search: '', category: 'coffee', inStock: false, sort: 'name', page: 1, pageSize: 40 },
      controller.signal,
    )
      .then((data) => {
        const drinks = inStockByCategory(data.items, 'coffee').slice(0, 4)
        if (drinks.length === 0) setCatalog({ state: 'empty' })
        else setCatalog({ state: 'success', data: drinks })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setCatalog({ state: 'error', message: messageFrom(error) })
      })
    return () => controller.abort()
  }, [catalogRetry])

  useEffect(() => {
    const controller = new AbortController()
    setInventory({ state: 'loading' })
    getInventory(failInventory, controller.signal)
      .then((items) => {
        if (items.length === 0) setInventory({ state: 'empty' })
        else setInventory({ state: 'success', data: items })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setInventory({ state: 'error', message: messageFrom(error) })
      })
    return () => controller.abort()
  }, [failInventory, inventoryRetry])

  function toggleOffline() {
    const next = !offline
    setOffline(next)
    setOfflineDemo(next)
    setCatalogRetry((value) => value + 1)
    setInventoryRetry((value) => value + 1)
  }

  return (
    <div className="panel-grid">
      <section className="panel">
        <h2>Catalog</h2>
        <p>In-stock coffee is derived here. This panel does not wait for inventory.</p>
        {catalog.state === 'loading' ? <LoadingBlock label="Loading catalog" /> : null}
        {catalog.state === 'error' ? (
          <StatusPanel tone="error" title="Catalog unavailable" message={catalog.message} actionLabel="Retry" onAction={() => setCatalogRetry((value) => value + 1)} />
        ) : null}
        {catalog.state === 'empty' ? <StatusPanel title="No coffee in stock" message="The catalog responded, but nothing is available." /> : null}
        {catalog.state === 'success' ? (
          <ul>
            {catalog.data.map((product) => (
              <li key={product.id}>{product.name} · {formatRupeesFromCents(product.price)}</li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="panel">
        <h2>Inventory</h2>
        <div className="button-row">
          <button type="button" onClick={() => setFailInventory((value) => !value)}>
            {failInventory ? 'Restore inventory' : 'Make inventory fail'}
          </button>
          <button type="button" onClick={toggleOffline}>{offline ? 'Go back online' : 'Simulate offline'}</button>
        </div>
        {inventory.state === 'loading' ? <LoadingBlock label="Loading inventory" /> : null}
        {inventory.state === 'error' ? (
          <StatusPanel tone="error" title="Stock status unavailable" message={inventory.message} actionLabel="Retry" onAction={() => setInventoryRetry((value) => value + 1)} />
        ) : null}
        {inventory.state === 'empty' ? <StatusPanel title="No low-stock items" message="Inventory responded. Nothing is almost gone." /> : null}
        {inventory.state === 'success' ? (
          <ul>
            {inventory.data.map((product) => (
              <li key={product.id}>{product.name} · {product.stock} left</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
