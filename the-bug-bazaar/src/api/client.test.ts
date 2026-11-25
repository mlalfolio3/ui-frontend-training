import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../domain/errors.ts'
import { apiRequest, clearApiCache, setOfflineDemo } from './client.ts'

describe('apiRequest', () => {
  beforeEach(() => {
    clearApiCache()
    setOfflineDemo(false)
    vi.unstubAllGlobals()
  })

  it('maps 404 and 500 to friendly messages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: 'not_found', message: 'missing record' } }), { status: 404 }),
    ))
    await expect(apiRequest('/api/products/missing', { resource: 'product' })).rejects.toMatchObject({
      userMessage: 'Product not found',
    })

    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: 'server_error', message: 'catalog query failed' } }), { status: 500 }),
    ))
    try {
      await apiRequest('/api/products?search=__500', { resource: 'product' })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      if (error instanceof ApiError) {
        expect(error.userMessage).toBe('Service unavailable')
        expect(error.userMessage).not.toContain('catalog query failed')
      }
    }
  })

  it('reports an offline demo without calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    setOfflineDemo(true)
    await expect(apiRequest('/api/products')).rejects.toMatchObject({
      userMessage: 'You appear to be offline. Check your connection and try again.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
