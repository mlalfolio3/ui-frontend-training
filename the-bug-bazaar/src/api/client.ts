import { ApiError, isApiError, toApiError } from '../domain/errors.ts'
import { isAbortError } from '../domain/requests.ts'

type CacheEntry = { expires: number; body: unknown }

const cache = new Map<string, CacheEntry>()
const CACHE_MS = 15_000

let offline = false
let onUnauthorized = (): void => {}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

export function setOfflineDemo(next: boolean): void {
  offline = next
}

export function clearApiCache(prefix = ''): void {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

export function patchCachedStock(id: string, stock: number): void {
  for (const entry of cache.values()) patchValue(entry.body, id, stock)
}

function patchValue(value: unknown, id: string, stock: number): void {
  if (typeof value !== 'object' || value === null) return
  if (Array.isArray(value)) {
    for (const entry of value) patchValue(entry, id, stock)
    return
  }
  const record = value as Record<string, unknown>
  if (record.id === id && typeof record.stock === 'number') record.stock = stock
  if (Array.isArray(record.items)) patchValue(record.items, id, stock)
}

function isCacheable(method: string, path: string): boolean {
  if (method !== 'GET') return false
  const url = new URL(path, 'http://localhost')
  if (url.searchParams.get('search')) return false
  if (url.pathname === '/api/inventory' || url.pathname === '/api/stock-ticks') return false
  return url.pathname === '/api/products' || url.pathname.startsWith('/api/products/')
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string
    body?: unknown
    signal?: AbortSignal
    headers?: Record<string, string>
    resource?: 'product' | 'customer' | 'order' | 'login' | 'generic'
  } = {},
): Promise<T> {
  const method = options.method ?? 'GET'
  const cacheKey = `${method} ${path}`
  if (offline) {
    throw new ApiError(0, 'You appear to be offline. Check your connection and try again.', {})
  }

  if (method === 'GET') {
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) return structuredClone(cached.body) as T
  }

  let response: Response
  try {
    response = await fetch(path, {
      method,
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    if (isApiError(error)) throw error
    throw new ApiError(0, 'You appear to be offline. Check your connection and try again.', {})
  }

  const body = await readBody(response)
  if (!response.ok) {
    const apiError = toApiError(response.status, body, options.resource ?? 'generic')
    if (response.status === 401) onUnauthorized()
    throw apiError
  }

  if (method === 'GET' && isCacheable(method, path)) {
    cache.set(cacheKey, { expires: Date.now() + CACHE_MS, body })
    return structuredClone(body) as T
  }
  return body as T
}
