import { describe, expect, it } from 'vitest'
import { createCatalog } from '../data/catalog.ts'
import { delayMsFor } from './delay.ts'
import {
  affordableProducts,
  canAddToCart,
  findProduct,
  inStockByCategory,
  isLowStock,
  queryProducts,
} from './products.ts'
import { isLatestRequest } from './requests.ts'
import { visibleRowRange } from './virtual.ts'

describe('catalog filters', () => {
  const products = createCatalog()

  it('loads 5000 products and finds in-stock coffee', () => {
    expect(products).toHaveLength(5000)
    const drinks = inStockByCategory(products, 'coffee')
    expect(drinks.length).toBeGreaterThan(0)
    expect(drinks.every((product) => product.category === 'coffee' && product.stock > 0)).toBe(true)
  })

  it('returns an empty list from affordableProducts without throwing', () => {
    expect(affordableProducts([], 100)).toEqual([])
  })

  it('returns undefined from find when the id is missing', () => {
    expect(findProduct(products, 'missing')).toBeUndefined()
  })

  it('combines search, category, and stock', () => {
    const result = queryProducts(products, {
      search: 'duck',
      category: 'ducks',
      inStock: true,
      sort: 'name',
      page: 1,
      pageSize: 20,
    })
    expect(result.total).toBeGreaterThan(0)
    expect(result.items.every((product) => product.category === 'ducks' && product.stock > 0)).toBe(true)
    expect(result.items.every((product) => product.name.toLowerCase().includes('duck'))).toBe(true)
  })

  it('returns no rows for a search that matches nothing', () => {
    const result = queryProducts(products, {
      search: 'zzzz-none',
      category: '',
      inStock: false,
      sort: 'rating',
      page: 1,
      pageSize: 24,
    })
    expect(result).toEqual({ items: [], total: 0 })
  })
})

describe('stock rules', () => {
  it('blocks archived products and treats low stock as 1 to 4', () => {
    expect(canAddToCart({ stock: 2, isArchived: true })).toBe(false)
    expect(canAddToCart({ stock: 2 })).toBe(true)
    expect(canAddToCart({ stock: 0 })).toBe(false)
    expect(isLowStock(3)).toBe(true)
    expect(isLowStock(0)).toBe(false)
    expect(isLowStock(5)).toBe(false)
  })
})

describe('request helpers', () => {
  it('keeps only the latest request id', () => {
    expect(isLatestRequest(2, 2)).toBe(true)
    expect(isLatestRequest(1, 2)).toBe(false)
  })

  it('makes a short search slower than a longer one', () => {
    expect(delayMsFor('/api/products?search=a')).toBeGreaterThan(delayMsFor('/api/products?search=duck'))
  })
})

describe('visibleRowRange', () => {
  it('renders a small window of a 5000-row list', () => {
    const range = visibleRowRange(0, 720, 360, 1667)
    expect(range.end - range.start).toBeLessThan(20)
    expect(range.end).toBeLessThan(1667)
  })
})
