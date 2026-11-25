import { CATEGORIES, type Category, type Product, type ProductQuery, type ProductStatus, type SortKey } from '../types.ts'

const SORTS: readonly SortKey[] = ['rating', 'name', 'price-asc', 'price-desc']

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && CATEGORIES.some((category) => category === value)
}

export function isSort(value: string | null): value is SortKey {
  return value !== null && SORTS.some((sort) => sort === value)
}

export function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) return false
  const product = value as Record<string, unknown>
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    isCategory(product.category) &&
    typeof product.stock === 'number' &&
    typeof product.rating === 'number' &&
    typeof product.imageUrl === 'string'
  )
}

export function categoryLabel(category: Category): string {
  if (category === 'keyboards') return 'Fashion'
  if (category === 'ducks') return 'Ducks'
  if (category === 'coffee') return 'Coffee'
  return 'Stickers'
}

export function productStatus(stock: number): ProductStatus {
  if (stock <= 0) return 'sold_out'
  if (stock < 5) return 'low_stock'
  return 'in_stock'
}

export function isLowStock(stock: number): boolean {
  return stock > 0 && stock < 5
}

export function isOnSale(product: Product): boolean {
  return product.rating >= 4.8 && product.stock > 0
}

export function canAddToCart(product: { stock: number; isArchived?: boolean }): boolean {
  return product.stock > 0 && product.isArchived !== true
}

export function affordableProducts(products: Product[], limitCents: number): Product[] {
  return products.filter((product) => product.price <= limitCents)
}

export function findProduct(products: Product[], id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

export function inStockByCategory(products: Product[], category: Category): Product[] {
  return products.filter((product) => product.category === category && product.stock > 0)
}

function compareProducts(a: Product, b: Product, sort: SortKey): number {
  if (sort === 'name') return a.name.localeCompare(b.name)
  if (sort === 'price-asc') return a.price - b.price
  if (sort === 'price-desc') return b.price - a.price
  return b.rating - a.rating || a.name.localeCompare(b.name)
}

export function queryProducts(
  products: Product[],
  query: ProductQuery,
): { items: Product[]; total: number } {
  const search = query.search.trim().toLowerCase()
  const filtered = products.filter((product) => {
    if (search && !product.name.toLowerCase().includes(search)) return false
    if (query.category && product.category !== query.category) return false
    if (query.inStock && product.stock <= 0) return false
    return true
  })
  const sorted = [...filtered].sort((a, b) => compareProducts(a, b, query.sort))
  const pageSize = Math.min(Math.max(query.pageSize, 1), 5000)
  const page = Math.max(query.page, 1)
  const start = (page - 1) * pageSize
  return {
    items: sorted.slice(start, start + pageSize).map((product) => ({ ...product })),
    total: sorted.length,
  }
}

export const PAGE_SIZE = 24

export function readFilters(params: URLSearchParams): ProductQuery {
  const categoryValue = params.get('category')
  const sortValue = params.get('sort')
  const pageValue = Number(params.get('page'))
  return {
    search: params.get('search') ?? '',
    category: categoryValue && isCategory(categoryValue) ? categoryValue : '',
    inStock: params.get('inStock') === '1',
    sort: sortValue && isSort(sortValue) ? sortValue : 'rating',
    page: Number.isFinite(pageValue) && pageValue >= 1 ? Math.floor(pageValue) : 1,
    pageSize: PAGE_SIZE,
  }
}
