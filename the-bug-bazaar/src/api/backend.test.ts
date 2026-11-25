import { beforeEach, describe, expect, it } from 'vitest'
import { toApiError } from '../domain/errors.ts'
import type { Product } from '../types.ts'
import { handleApi, resetStore } from './backend.ts'

function call(method: string, url: string, body?: unknown, headers: Record<string, string> = {}) {
  return handleApi({
    method,
    url,
    rawBody: body === undefined ? '' : JSON.stringify(body),
    headers,
  })
}

describe('mock API', () => {
  beforeEach(() => resetStore())

  it('returns the catalog shape and a forced 500', () => {
    const ok = call('GET', '/api/products?page=1&pageSize=2')
    expect(ok.status).toBe(200)
    const body = ok.body as { items: Product[]; total: number }
    expect(body.total).toBe(5000)
    expect(body.items).toHaveLength(2)
    expect(call('GET', '/api/products?search=__500').status).toBe(500)
    expect(call('GET', '/api/products/missing').status).toBe(404)
  })

  it('logs in, rejects a bad password, and requires fields', () => {
    const success = call('POST', '/api/login', { email: 'ada@bugbazaar.dev', password: 'quack-quack' })
    expect(success.status).toBe(200)
    expect(call('POST', '/api/login', { email: 'ada@bugbazaar.dev', password: 'nope' }).status).toBe(401)
    const missing = call('POST', '/api/login', { email: '', password: '' })
    expect(missing.status).toBe(400)
    expect(call('GET', '/api/me').status).toBe(401)
  })

  it('places one order for a repeated checkout key', () => {
    const login = call('POST', '/api/login', { email: 'ada@bugbazaar.dev', password: 'quack-quack' })
    const token = (login.body as { token: string }).token
    const headers = { authorization: `Bearer ${token}`, 'idempotency-key': 'same-key' }
    const listed = call('GET', '/api/products/p-0001')
    const product = listed.body as Product
    const first = call('POST', '/api/orders', { items: [{ productId: product.id, quantity: 1 }] }, headers)
    const second = call('POST', '/api/orders', { items: [{ productId: product.id, quantity: 1 }] }, headers)
    expect(first.status).toBe(201)
    expect(second.status).toBe(200)
    expect((second.body as { id: string }).id).toBe((first.body as { id: string }).id)
    const after = call('GET', '/api/products/p-0001')
    expect((after.body as Product).stock).toBe(product.stock - 1)
  })

  it('names the item when stock is not enough', () => {
    const login = call('POST', '/api/login', { email: 'ada@bugbazaar.dev', password: 'quack-quack' })
    const token = (login.body as { token: string }).token
    const product = call('GET', '/api/products/p-0002').body as Product
    const result = call(
      'POST',
      '/api/orders',
      { items: [{ productId: product.id, quantity: product.stock + 5 }] },
      { authorization: `Bearer ${token}`, 'idempotency-key': 'too-many' },
    )
    expect(result.status).toBe(409)
    const error = toApiError(result.status, result.body, 'order')
    expect(error.userMessage).toBe(`Not enough stock for ${product.name}.`)
    expect(error.userMessage).not.toContain('stock conflict')
  })

  it('returns a field error for a duplicate customer email', () => {
    const result = call('POST', '/api/customers', {
      name: 'Sara Two',
      email: 'sara@example.com',
      city: 'Lahore',
    })
    expect(result.status).toBe(400)
    const error = toApiError(result.status, result.body, 'customer')
    expect(error.fieldErrors.email).toBe('An account with that email already exists.')
  })

  it('moves an export from pending to ready', () => {
    const created = call('POST', '/api/exports', { outcome: 'ready' })
    expect(created.status).toBe(202)
    const id = (created.body as { id: string }).id
    expect(call('GET', `/api/exports/${id}`).body).toMatchObject({ status: 'pending' })
    expect(call('GET', `/api/exports/${id}`).body).toMatchObject({ status: 'ready' })
  })
})
