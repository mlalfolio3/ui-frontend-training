import { ApiError } from '../domain/errors.ts'
import { isProduct } from '../domain/products.ts'
import type { Customer, ExportJob, OrderSummary, Product, SessionUser, StockTick } from '../types.ts'

export function readProduct(value: unknown): Product {
  if (!isProduct(value)) throw new ApiError(500, 'Service unavailable', {})
  return value
}

export function readProductList(value: unknown): { items: Product[]; total: number } {
  if (typeof value !== 'object' || value === null) throw new ApiError(500, 'Service unavailable', {})
  const record = value as Record<string, unknown>
  if (!Array.isArray(record.items) || typeof record.total !== 'number') {
    throw new ApiError(500, 'Service unavailable', {})
  }
  return { items: record.items.map((item) => readProduct(item)), total: record.total }
}

export function readCustomer(value: unknown): Customer {
  if (typeof value !== 'object' || value === null) throw new ApiError(500, 'Service unavailable', {})
  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.email !== 'string' ||
    typeof record.city !== 'string'
  ) {
    throw new ApiError(500, 'Service unavailable', {})
  }
  return { id: record.id, name: record.name, email: record.email, city: record.city }
}

export function readCustomerList(value: unknown): Customer[] {
  if (typeof value !== 'object' || value === null) throw new ApiError(500, 'Service unavailable', {})
  const items = (value as { items?: unknown }).items
  if (!Array.isArray(items)) throw new ApiError(500, 'Service unavailable', {})
  return items.map((item) => readCustomer(item))
}

export function readUser(value: unknown): SessionUser {
  if (typeof value !== 'object' || value === null) throw new ApiError(500, 'Service unavailable', {})
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.email !== 'string') {
    throw new ApiError(500, 'Service unavailable', {})
  }
  return { id: record.id, name: record.name, email: record.email, role: 'customer' }
}

export function readLogin(value: unknown): { token: string; user: SessionUser } {
  if (typeof value !== 'object' || value === null) throw new ApiError(500, 'Service unavailable', {})
  const record = value as Record<string, unknown>
  if (typeof record.token !== 'string') throw new ApiError(500, 'Service unavailable', {})
  return { token: record.token, user: readUser(record.user) }
}

export function readOrder(value: unknown): OrderSummary {
  if (typeof value !== 'object' || value === null) throw new ApiError(500, 'Service unavailable', {})
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || record.status !== 'queued') {
    throw new ApiError(500, 'Service unavailable', {})
  }
  return { id: record.id, status: 'queued' }
}

export function readExportJob(value: unknown): ExportJob {
  if (typeof value !== 'object' || value === null) throw new ApiError(500, 'Service unavailable', {})
  const record = value as Record<string, unknown>
  const status = record.status
  if (typeof record.id !== 'string') throw new ApiError(500, 'Service unavailable', {})
  if (status !== 'pending' && status !== 'ready' && status !== 'failed' && status !== 'expired') {
    throw new ApiError(500, 'Service unavailable', {})
  }
  const job: ExportJob = { id: record.id, status }
  if (typeof record.downloadUrl === 'string') job.downloadUrl = record.downloadUrl
  return job
}

export function readTick(value: unknown): StockTick | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || record.id === '' || typeof record.stock !== 'number') return null
  return { id: record.id, stock: record.stock }
}
