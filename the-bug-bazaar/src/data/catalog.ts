import type { Category, Product } from '../types.ts'

const NAMES: Record<Exclude<Category, 'keyboards'>, readonly string[]> = {
  ducks: ['Rubber Duck', 'Debug Duck', 'Captain Duck', 'Pixel Duck'],
  coffee: ['Bug Brew Coffee', 'Night Shift Coffee', 'Espresso Beans', 'Cold Brew'],
  stickers: ['Semicolon Sticker', 'Ship It Sticker', 'Null Sticker', 'Duck Sticker'],
}

const FASHION_COLORS = ['Black', 'Ivory', 'Navy', 'Olive', 'Camel', 'Burgundy', 'Stone', 'Cream', 'Charcoal', 'Rust']
const FASHION_FITS = ['Relaxed', 'Tailored', 'Oversized', 'Slim', 'Pleated', 'Cropped', 'Longline', 'Boxy', 'Draped', 'Fitted']
const FASHION_PIECES = [
  'Linen Shirt',
  'Silk Dress',
  'Wool Blazer',
  'Cotton Polo',
  'Denim Jacket',
  'Pleat Trouser',
  'Knit Sweater',
  'Trench Coat',
  'Slip Skirt',
  'Leather Loafer',
  'Canvas Sneaker',
  'Shoulder Bag',
  'Silk Scarf',
]

function fashionTitle(n: number): string {
  const color = FASHION_COLORS[n % FASHION_COLORS.length] ?? 'Black'
  const fit = FASHION_FITS[Math.floor(n / FASHION_COLORS.length) % FASHION_FITS.length] ?? 'Tailored'
  const piece = FASHION_PIECES[Math.floor(n / (FASHION_COLORS.length * FASHION_FITS.length))] ?? 'Linen Shirt'
  return `${color} ${fit} ${piece}`
}

const IMAGES: Record<Category, string> = {
  keyboards: '/images/fashion.svg',
  ducks: '/images/duck.svg',
  coffee: '/images/coffee.svg',
  stickers: '/images/sticker.svg',
}

function priceFor(category: Category, index: number): number {
  if (category === 'keyboards') return 250000 + (index % 60) * 25000
  if (category === 'ducks') return 19900 + (index % 15) * 4500
  if (category === 'coffee') return 45000 + (index % 20) * 3500
  return 9900 + (index % 10) * 1800
}

export function createCatalog(): Product[] {
  const categories: Category[] = ['keyboards', 'ducks', 'coffee', 'stickers']
  const products: Product[] = []

  for (let index = 1; index <= 5000; index += 1) {
    const category = categories[index % 4] ?? 'ducks'
    const names = category === 'keyboards' ? null : NAMES[category]
    const baseName = names?.[Math.floor(index / categories.length) % names.length] ?? 'Gear'
    const soldOut = index % 23 === 0 || (index * 3) % 26 === 0
    products.push({
      id: `p-${String(index).padStart(4, '0')}`,
      name: category === 'keyboards' ? fashionTitle(index / 4 - 1) : `${baseName} #${index}`,
      price: priceFor(category, index),
      category,
      stock: soldOut ? 0 : (index * 3) % 26,
      rating: Math.round((((index * 7) % 25) / 10 + 2.5) * 10) / 10,
      imageUrl: index % 37 === 0 ? '/images/missing.svg' : IMAGES[category],
    })
  }

  return products
}
