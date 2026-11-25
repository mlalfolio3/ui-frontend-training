import { createCatalog } from '../data/catalog.ts'
import { isCategory, queryProducts } from '../domain/products.ts'
import type { Customer, ExportStatus, Product, SessionUser } from '../types.ts'

export type ApiResult = {
  status: number
  body: unknown
  contentType: string
  cacheControl: string
  etag: string
  extraHeaders: Record<string, string>
}

type OrderRecord = {
  id: string
  status: 'queued'
  userId: string
  items: { productId: string; quantity: number }[]
}

type ExportRecord = {
  id: string
  outcome: 'ready' | 'failed' | 'expired'
  checks: number
}

type Suggestion = {
  id: string
  name: string
  price: number
  category: string
}

const DEMO_USER: SessionUser = {
  id: 'u-1',
  name: 'Ada Duck',
  email: 'ada@bugbazaar.dev',
  role: 'customer',
}

const DEMO_PASSWORD = 'quack-quack'

let products: Product[] = []
let customers: Customer[] = []
let sessions = new Map<string, SessionUser>()
let orders = new Map<string, OrderRecord>()
let ordersByKey = new Map<string, string>()
let exportJobs = new Map<string, ExportRecord>()
let suggestions: Suggestion[] = []
let version = 1
let nextOrder = 1
let nextCustomer = 10
let nextExport = 1
let nextSuggestion = 1

function seedCustomers(): Customer[] {
  return [
    { id: 'c-1', name: 'Sara Khan', email: 'sara@example.com', city: 'Lahore' },
    { id: 'c-2', name: 'Omar Ali', email: 'omar@example.com', city: 'Karachi' },
    { id: 'c-3', name: 'Hina Shah', email: 'hina@example.com', city: 'Islamabad' },
    { id: 'c-4', name: 'Bilal Ahmed', email: 'bilal@example.com', city: 'Peshawar' },
    { id: 'c-5', name: 'Maya Joseph', email: 'maya@example.com', city: 'Kochi' },
    { id: 'c-6', name: 'Leo Martins', email: 'leo@example.com', city: 'Goa' },
    { id: 'c-7', name: 'Noor Hassan', email: 'noor@example.com', city: 'Multan' },
    { id: 'c-8', name: 'Priya Nair', email: 'priya@example.com', city: 'Bengaluru' },
  ]
}

export function resetStore(): void {
  products = createCatalog()
  customers = seedCustomers()
  sessions = new Map()
  orders = new Map()
  ordersByKey = new Map()
  exportJobs = new Map()
  suggestions = []
  version = 1
  nextOrder = 1
  nextCustomer = 10
  nextExport = 1
  nextSuggestion = 1
}

resetStore()

function json(status: number, body: unknown, cache: 'short' | 'none' = 'none'): ApiResult {
  return {
    status,
    body,
    contentType: 'application/json; charset=utf-8',
    cacheControl: cache === 'short' ? 'public, max-age=30' : 'no-store',
    etag: `"catalog-${version}"`,
    extraHeaders: {},
  }
}

function failure(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
): ApiResult {
  return json(status, {
    error: details ? { code, message, details } : { code, message },
  })
}

function parseBody(raw: string): Record<string, unknown> | null {
  if (!raw.trim()) return {}
  try {
    const value: unknown = JSON.parse(raw) as unknown
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    return value as Record<string, unknown>
  } catch {
    return null
  }
}

function headerMap(input: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) headers[key.toLowerCase()] = value
  return headers
}

function currentUser(headers: Record<string, string>): SessionUser | null {
  const header = headers.authorization ?? ''
  if (!header.startsWith('Bearer ')) return null
  return sessions.get(header.slice(7)) ?? null
}

function copyProduct(product: Product): Product {
  return { ...product }
}

export function applyRandomStockTick(): { id: string; stock: number } {
  const product = products[Math.floor(Math.random() * products.length)]
  if (!product) return { id: '', stock: 0 }
  product.stock = Math.floor(Math.random() * 21)
  version += 1
  return { id: product.id, stock: product.stock }
}

function listProducts(url: URL): ApiResult {
  const search = url.searchParams.get('search') ?? ''
  if (search === '__500') return failure(500, 'server_error', 'catalog query failed')
  const categoryValue = url.searchParams.get('category')
  const category = categoryValue && isCategory(categoryValue) ? categoryValue : ''
  const sortValue = url.searchParams.get('sort')
  const sort =
    sortValue === 'name' || sortValue === 'price-asc' || sortValue === 'price-desc' || sortValue === 'rating'
      ? sortValue
      : 'rating'
  const page = Number(url.searchParams.get('page') ?? '1')
  const pageSize = Number(url.searchParams.get('pageSize') ?? '24')
  const result = queryProducts(products, {
    search,
    category,
    inStock: url.searchParams.get('inStock') === '1',
    sort,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 24,
  })
  return json(200, result, 'short')
}

function productById(id: string): ApiResult {
  if (id === '__500') return failure(500, 'server_error', 'catalog query failed')
  const product = products.find((item) => item.id === id)
  if (!product) return failure(404, 'not_found', 'missing record')
  return json(200, copyProduct(product), 'short')
}

function login(body: Record<string, unknown>): ApiResult {
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const details: Record<string, string> = {}
  if (!email) details.email = 'required'
  if (!password) details.password = 'required'
  if (Object.keys(details).length > 0) return failure(400, 'invalid_input', 'invalid input', details)
  if (email.toLowerCase() !== DEMO_USER.email || password !== DEMO_PASSWORD) {
    return failure(401, 'unauthorized', 'not authenticated')
  }
  const token = `token-${crypto.randomUUID()}`
  sessions.set(token, DEMO_USER)
  return json(200, { token, user: DEMO_USER })
}

function me(headers: Record<string, string>): ApiResult {
  const user = currentUser(headers)
  if (!user) return failure(401, 'unauthorized', 'not authenticated')
  return json(200, user)
}

function readItems(value: unknown): { productId: string; quantity: number }[] | null {
  if (!Array.isArray(value)) return null
  const items: { productId: string; quantity: number }[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return null
    const record = entry as Record<string, unknown>
    if (typeof record.productId !== 'string') return null
    if (typeof record.quantity !== 'number' || !Number.isInteger(record.quantity) || record.quantity < 1) {
      return null
    }
    items.push({ productId: record.productId, quantity: record.quantity })
  }
  return items
}

function createOrder(body: Record<string, unknown>, headers: Record<string, string>): ApiResult {
  const user = currentUser(headers)
  if (!user) return failure(401, 'unauthorized', 'not authenticated')
  const key = headers['idempotency-key'] ?? ''
  if (!key) return failure(400, 'invalid_input', 'invalid input', { items: 'required' })
  const existingId = ordersByKey.get(key)
  if (existingId) {
    const existing = orders.get(existingId)
    if (existing) return json(200, { id: existing.id, status: existing.status })
  }
  const coupon = typeof body.coupon === 'string' ? body.coupon.trim() : ''
  if (coupon && coupon !== 'DUCK') return failure(400, 'invalid_input', 'invalid input', { coupon: 'invalid' })
  const items = readItems(body.items)
  if (!items || items.length === 0) return failure(400, 'invalid_input', 'invalid input', { items: 'required' })

  const merged = new Map<string, number>()
  for (const item of items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)

  for (const [productId, quantity] of merged) {
    const product = products.find((item) => item.id === productId)
    if (!product) return failure(400, 'invalid_input', 'invalid input', { items: 'unknown' })
    if (quantity > product.stock) {
      return failure(409, 'out_of_stock', 'stock conflict', { item: product.name })
    }
  }

  for (const [productId, quantity] of merged) {
    const product = products.find((item) => item.id === productId)
    if (product) product.stock -= quantity
  }
  version += 1
  const id = `ord-${nextOrder}`
  nextOrder += 1
  const order: OrderRecord = { id, status: 'queued', userId: user.id, items: [...merged].map(([productId, quantity]) => ({ productId, quantity })) }
  orders.set(id, order)
  ordersByKey.set(key, id)
  return json(201, { id, status: 'queued' })
}

function getOrder(id: string, headers: Record<string, string>): ApiResult {
  const user = currentUser(headers)
  if (!user) return failure(401, 'unauthorized', 'not authenticated')
  const order = orders.get(id)
  if (!order || order.userId !== user.id) return failure(404, 'not_found', 'missing record')
  return json(200, { id: order.id, status: order.status })
}

function listCustomers(url: URL): ApiResult {
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
  if (search === '__500') return failure(500, 'server_error', 'customer query failed')
  const items = customers.filter((customer) => {
    if (!search) return true
    return customer.name.toLowerCase().includes(search) || customer.email.toLowerCase().includes(search)
  })
  return json(200, { items: items.map((customer) => ({ ...customer })), total: items.length })
}

function customerById(id: string): ApiResult {
  const customer = customers.find((item) => item.id === id)
  if (!customer) return failure(404, 'not_found', 'missing record')
  return json(200, { ...customer })
}

function createCustomer(body: Record<string, unknown>): ApiResult {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const city = typeof body.city === 'string' ? body.city.trim() : ''
  const details: Record<string, string> = {}
  if (!name) details.name = 'required'
  if (!email || !email.includes('@')) details.email = 'required'
  if (!city) details.city = 'required'
  if (Object.keys(details).length > 0) return failure(400, 'invalid_input', 'invalid input', details)
  const taken = customers.some((customer) => customer.email.toLowerCase() === email.toLowerCase())
  if (taken) return failure(400, 'invalid_input', 'invalid input', { email: 'taken' })
  const customer: Customer = { id: `c-${nextCustomer}`, name, email, city }
  nextCustomer += 1
  customers.unshift(customer)
  return json(201, { ...customer })
}

function updateCustomer(id: string, body: Record<string, unknown>): ApiResult {
  const customer = customers.find((item) => item.id === id)
  if (!customer) return failure(404, 'not_found', 'missing record')
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const city = typeof body.city === 'string' ? body.city.trim() : ''
  const details: Record<string, string> = {}
  if (!name) details.name = 'required'
  if (!email || !email.includes('@')) details.email = 'required'
  if (!city) details.city = 'required'
  if (Object.keys(details).length > 0) return failure(400, 'invalid_input', 'invalid input', details)
  const taken = customers.some(
    (item) => item.id !== id && item.email.toLowerCase() === email.toLowerCase(),
  )
  if (taken) return failure(400, 'invalid_input', 'invalid input', { email: 'taken' })
  customer.name = name
  customer.email = email
  customer.city = city
  return json(200, { ...customer })
}

function deleteCustomer(id: string): ApiResult {
  const index = customers.findIndex((item) => item.id === id)
  if (index === -1) return failure(404, 'not_found', 'missing record')
  customers.splice(index, 1)
  return {
    status: 204,
    body: null,
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'no-store',
    etag: `"catalog-${version}"`,
    extraHeaders: {},
  }
}

function inventory(headers: Record<string, string>): ApiResult {
  if (headers['x-demo-fail'] === '1') return failure(500, 'server_error', 'inventory query failed')
  const items = products.filter((product) => product.stock > 0 && product.stock < 5).slice(0, 8)
  return json(200, { items: items.map(copyProduct) })
}

function createExport(body: Record<string, unknown>): ApiResult {
  const outcome = body.outcome === 'failed' || body.outcome === 'expired' ? body.outcome : 'ready'
  const id = `ex-${nextExport}`
  nextExport += 1
  exportJobs.set(id, { id, outcome, checks: 0 })
  return json(202, { id, status: 'pending' satisfies ExportStatus })
}

function exportById(id: string): ApiResult {
  const job = exportJobs.get(id)
  if (!job) return failure(404, 'not_found', 'missing record')
  job.checks += 1
  if (job.checks < 2) return json(200, { id: job.id, status: 'pending' })
  if (job.outcome === 'ready') {
    return json(200, { id: job.id, status: 'ready', downloadUrl: `/api/exports/${job.id}/file` })
  }
  return json(200, { id: job.id, status: job.outcome })
}

function exportFile(id: string): ApiResult {
  const job = exportJobs.get(id)
  if (!job || job.outcome !== 'ready' || job.checks < 2) return failure(404, 'not_found', 'missing record')
  const lines = ['name,email,city', ...customers.map((customer) => `${customer.name},${customer.email},${customer.city}`)]
  return {
    status: 200,
    body: lines.join('\n'),
    contentType: 'text/csv; charset=utf-8',
    cacheControl: 'no-store',
    etag: `"catalog-${version}"`,
    extraHeaders: { 'Content-Disposition': `attachment; filename="customers-${id}.csv"` },
  }
}

function createSuggestion(body: Record<string, unknown>): ApiResult {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const category = typeof body.category === 'string' ? body.category : ''
  const priceText = typeof body.price === 'string' ? body.price : ''
  const price = Number(priceText)
  const details: Record<string, string> = {}
  if (!name) details.name = 'required'
  if (!isCategory(category)) details.category = 'required'
  if (priceText.trim() === '' || Number.isNaN(price) || price <= 0) details.price = 'invalid'
  if (Object.keys(details).length > 0) return failure(400, 'invalid_input', 'invalid input', details)
  const suggestion = { id: `s-${nextSuggestion}`, name, price, category }
  nextSuggestion += 1
  suggestions.push(suggestion)
  return json(201, { id: suggestion.id })
}

export function handleApi(input: {
  method: string
  url: string
  rawBody: string
  headers: Record<string, string>
}): ApiResult {
  const method = input.method.toUpperCase()
  const url = new URL(input.url, 'http://localhost')
  const headers = headerMap(input.headers)
  const path = url.pathname

  if (method === 'GET' && path === '/api/products') return listProducts(url)
  if (method === 'GET' && path.startsWith('/api/products/')) {
    return productById(decodeURIComponent(path.slice('/api/products/'.length)))
  }
  if (method === 'POST' && path === '/api/login') {
    const body = parseBody(input.rawBody)
    if (!body) return failure(400, 'invalid_input', 'invalid input')
    return login(body)
  }
  if (method === 'GET' && path === '/api/me') return me(headers)
  if (method === 'POST' && path === '/api/orders') {
    const body = parseBody(input.rawBody)
    if (!body) return failure(400, 'invalid_input', 'invalid input')
    return createOrder(body, headers)
  }
  if (method === 'GET' && path.startsWith('/api/orders/')) {
    return getOrder(decodeURIComponent(path.slice('/api/orders/'.length)), headers)
  }
  if (method === 'GET' && path === '/api/customers') return listCustomers(url)
  if (method === 'POST' && path === '/api/customers') {
    const body = parseBody(input.rawBody)
    if (!body) return failure(400, 'invalid_input', 'invalid input')
    return createCustomer(body)
  }
  if (method === 'GET' && path.startsWith('/api/customers/')) {
    return customerById(decodeURIComponent(path.slice('/api/customers/'.length)))
  }
  if (method === 'PATCH' && path.startsWith('/api/customers/')) {
    const body = parseBody(input.rawBody)
    if (!body) return failure(400, 'invalid_input', 'invalid input')
    return updateCustomer(decodeURIComponent(path.slice('/api/customers/'.length)), body)
  }
  if (method === 'DELETE' && path.startsWith('/api/customers/')) {
    return deleteCustomer(decodeURIComponent(path.slice('/api/customers/'.length)))
  }
  if (method === 'GET' && path === '/api/inventory') return inventory(headers)
  if (method === 'GET' && path === '/api/stock-ticks') return json(200, applyRandomStockTick())
  if (method === 'POST' && path === '/api/exports') {
    const body = parseBody(input.rawBody)
    if (!body) return failure(400, 'invalid_input', 'invalid input')
    return createExport(body)
  }
  if (method === 'GET' && path.startsWith('/api/exports/') && path.endsWith('/file')) {
    const id = path.slice('/api/exports/'.length, -'/file'.length)
    return exportFile(decodeURIComponent(id))
  }
  if (method === 'GET' && path.startsWith('/api/exports/')) {
    return exportById(decodeURIComponent(path.slice('/api/exports/'.length)))
  }
  if (method === 'POST' && path === '/api/suggestions') {
    const body = parseBody(input.rawBody)
    if (!body) return failure(400, 'invalid_input', 'invalid input')
    return createSuggestion(body)
  }

  return failure(404, 'not_found', 'missing record')
}
