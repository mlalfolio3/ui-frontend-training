import { Link } from 'react-router-dom'
import { categoryLabel, isOnSale, productStatus } from '../domain/products.ts'
import { formatRupeesFromCents } from '../domain/pricing.ts'
import type { Product } from '../types.ts'
import { ProductImage } from './ProductImage.tsx'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const status = productStatus(product.stock)
  const soldOut = status === 'sold_out'

  return (
    <article className="card">
      <Link className="card-link" to={`/products/${product.id}`}>
        <ProductImage src={product.imageUrl} alt="" />
        <h2>{product.name}</h2>
      </Link>
      <p className="price">{formatRupeesFromCents(product.price)}</p>
      <div className="card-meta">
        <span className="eyebrow">{categoryLabel(product.category)}</span>
        {isOnSale(product) ? <span className="badge sale">On sale</span> : null}
        {status === 'low_stock' ? <span className="badge warn">Low stock</span> : null}
        {soldOut ? <span className="badge bad">Sold out</span> : null}
      </div>
      <p className="stock">
        {soldOut ? 'Sold out' : status === 'low_stock' ? `Only ${product.stock} left` : `${product.stock} in stock`}
      </p>
      <button type="button" disabled={soldOut} onClick={() => onAdd(product)}>
        {soldOut ? (
          'Sold out'
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M6 7h15l-1.6 8.2H8.2L6 7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M6 7L4.8 4H2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="9" cy="19.2" r="1.2" fill="currentColor" />
              <circle cx="17" cy="19.2" r="1.2" fill="currentColor" />
            </svg>
            Add to cart
          </>
        )}
      </button>
    </article>
  )
}
