export const CATEGORIES = ['keyboards', 'ducks', 'coffee', 'stickers'] as const

export type Category = (typeof CATEGORIES)[number]

export type SortKey = 'rating' | 'name' | 'price-asc' | 'price-desc'

export type ProductStatus = 'in_stock' | 'low_stock' | 'sold_out'

export type Product = {
  id: string
  name: string
  price: number
  category: Category
  stock: number
  rating: number
  imageUrl: string
}

export type CartItem = {
  product: Product
  quantity: number
}

export type ProductQuery = {
  search: string
  category: Category | ''
  inStock: boolean
  sort: SortKey
  page: number
  pageSize: number
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: 'customer'
}

export type Customer = {
  id: string
  name: string
  email: string
  city: string
}

export type OrderSummary = {
  id: string
  status: 'queued'
}

export type ExportStatus = 'pending' | 'ready' | 'failed' | 'expired'

export type ExportJob = {
  id: string
  status: ExportStatus
  downloadUrl?: string
}

export type StockTick = {
  id: string
  stock: number
}

export type FieldErrors = Record<string, string>

export type RequestState<T> =
  | { state: 'loading' }
  | { state: 'empty' }
  | { state: 'error'; message: string }
  | { state: 'success'; data: T }

export type CartSummary = {
  count: number
  subtotalCents: number
  discountCents: number
  payableCents: number
}
