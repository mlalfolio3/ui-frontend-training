import type { OrderSummary } from '../types.ts'
import { readOrder } from './adapt.ts'
import { apiRequest, clearApiCache } from './client.ts'

export function placeOrder(
  token: string,
  input: {
    items: { productId: string; quantity: number }[]
    coupon: string
    idempotencyKey: string
  },
): Promise<OrderSummary> {
  return apiRequest<unknown>('/api/orders', {
    method: 'POST',
    body: { items: input.items, coupon: input.coupon },
    headers: {
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': input.idempotencyKey,
    },
    resource: 'order',
  }).then((body) => {
    clearApiCache('/api/products')
    return readOrder(body)
  })
}

export function getOrder(token: string, id: string, signal?: AbortSignal): Promise<OrderSummary> {
  return apiRequest<unknown>(`/api/orders/${encodeURIComponent(id)}`, {
    signal,
    headers: { Authorization: `Bearer ${token}` },
    resource: 'order',
  }).then(readOrder)
}
