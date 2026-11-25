import { Link, useNavigate } from 'react-router-dom'
import { ProductImage } from '../components/ProductImage.tsx'
import { formatRupeesFromCents } from '../domain/pricing.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { changeQuantity, removeItem } from '../store/cartSlice.ts'
import { selectCartItems, selectCartSummary } from '../store/selectors.ts'

export function CartPage() {
  const items = useAppSelector(selectCartItems)
  const summary = useAppSelector(selectCartSummary)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return (
    <section className="page cart-page">
      <p className="eyebrow">Cart</p>
      <h1>Your cart</h1>
      {items.length === 0 ? (
        <div className="empty-cart" role="status">
          <div className="empty-cart-icon" aria-hidden="true">
            <svg width="86" height="86" viewBox="0 0 86 86" fill="none">
              <ellipse cx="43" cy="46" rx="28" ry="22" fill="#e7eef6" />
              <path d="M24 18h6l2 4" stroke="#f47b20" strokeWidth="2" strokeLinecap="round" />
              <path d="M58 16l2 3M64 22h4" stroke="#f47b20" strokeWidth="2" strokeLinecap="round" />
              <path d="M30 34h28l-2.5 16H34L30 34z" stroke="#0e2744" strokeWidth="2" strokeLinejoin="round" />
              <path d="M33 34l-2-8h-6" stroke="#0e2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="37" cy="56" r="2.2" fill="#0e2744" />
              <circle cx="52" cy="56" r="2.2" fill="#0e2744" />
            </svg>
          </div>
          <div>
            <h2>Your cart is empty</h2>
            <p>Add a shirt, a duck, or a bag of coffee. Repeated adds increase the quantity instead of adding a new row.</p>
            <button type="button" onClick={() => navigate('/')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 7h15l-1.5 9h-12z" />
                <path d="M6 7L5 4H2" />
                <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
              </svg>
              Browse the shop
            </button>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-lines">
            {items.map((item) => {
              const overStock = item.quantity > item.product.stock
              return (
                <li className="cart-line" key={item.product.id}>
                  <div className="cart-thumb">
                    <ProductImage src={item.product.imageUrl} alt="" />
                  </div>
                  <div className="cart-line-copy">
                    <h2><Link to={`/products/${item.product.id}`}>{item.product.name}</Link></h2>
                    <p className="cart-each">{formatRupeesFromCents(item.product.price)} each</p>
                    <p className={overStock ? 'stock-warn' : 'stock-ok'}>
                      {overStock ? null : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M8 12.5l2.5 2.5L16 9.5" />
                        </svg>
                      )}
                      {overStock
                        ? `Only ${item.product.stock} left. Checkout will be rejected until you lower the quantity.`
                        : `${item.product.stock} available`}
                    </p>
                  </div>
                  <div className="cart-line-actions">
                    <div className="qty">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.product.name}`}
                        onClick={() => dispatch(changeQuantity({ id: item.product.id, quantity: item.quantity - 1 }))}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.product.name}`}
                        disabled={item.quantity >= item.product.stock}
                        onClick={() => dispatch(changeQuantity({ id: item.product.id, quantity: item.quantity + 1 }))}
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="remove" onClick={() => dispatch(removeItem(item.product.id))}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M4 7h16" />
                        <path d="M9 7V5h6v2" />
                        <path d="M8 7l1 13h6l1-13" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <dl>
              <div><dt>Items</dt><dd>{summary.count}</dd></div>
              <div><dt>Subtotal</dt><dd>{formatRupeesFromCents(summary.subtotalCents)}</dd></div>
              <div><dt>Discount</dt><dd>{formatRupeesFromCents(summary.discountCents)}</dd></div>
              <div className="payable"><dt>Payable</dt><dd>{formatRupeesFromCents(summary.payableCents)}</dd></div>
            </dl>
            <p className="discount-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 12l-8 8-8-8V4h8l8 8z" />
                <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
              </svg>
              <span>10% off when the subtotal is above Rs. 5,000. Rs. 5,000 itself stays full price.</span>
            </p>
            <Link className="button" to="/checkout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </section>
  )
}
