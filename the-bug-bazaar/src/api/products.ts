import type { Category, Product, ProductQuery, StockTick } from '../types.ts'
import { readProduct, readProductList, readTick } from './adapt.ts'
import { apiRequest, clearApiCache } from './client.ts'

export function getProducts(
  query: ProductQuery,
  signal?: AbortSignal,
): Promise<{ items: Product[]; total: number }> {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.category) params.set('category', query.category)
  if (query.inStock) params.set('inStock', '1')
  params.set('sort', query.sort)
  params.set('page', String(query.page))
  params.set('pageSize', String(query.pageSize))
  return apiRequest<unknown>(`/api/products?${params.toString()}`, {
    signal,
    resource: 'product',
  }).then(readProductList)
}

export function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  return apiRequest<unknown>(`/api/products/${encodeURIComponent(id)}`, {
    signal,
    resource: 'product',
  }).then(readProduct)
}

export function getInventory(fail: boolean, signal?: AbortSignal): Promise<Product[]> {
  return apiRequest<unknown>('/api/inventory', {
    signal,
    headers: fail ? { 'x-demo-fail': '1' } : {},
    resource: 'product',
  }).then((body) => {
    if (typeof body !== 'object' || body === null) return []
    const items = (body as { items?: unknown }).items
    return Array.isArray(items) ? items.map((item) => readProduct(item)) : []
  })
}

export function getStockTick(signal?: AbortSignal): Promise<StockTick> {
  return apiRequest<unknown>('/api/stock-ticks', { signal, resource: 'product' }).then((body) => {
    const tick = readTick(body)
    if (!tick) throw new Error('Missing stock tick')
    return tick
  })
}

export function createSuggestion(input: {
  name: string
  price: string
  category: Category | ''
}): Promise<void> {
  return apiRequest<unknown>('/api/suggestions', {
    method: 'POST',
    body: input,
    resource: 'generic',
  }).then(() => undefined)
}

export { clearApiCache }
