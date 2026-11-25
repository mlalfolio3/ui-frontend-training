import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { placeOrder } from '../api/orders.ts'
import { StatusPanel } from '../components/StatusPanel.tsx'
import { checkoutKeyFor, clearCheckoutKey } from '../domain/checkoutKey.ts'
import { isApiError, messageFrom } from '../domain/errors.ts'
import { cartSignature, formatRupeesFromCents } from '../domain/pricing.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { clearCart } from '../store/cartSlice.ts'
import { selectCartItems, selectCartSummary } from '../store/selectors.ts'

export function CheckoutPage() {
  const items = useAppSelector(selectCartItems)
  const summary = useAppSelector(selectCartSummary)
  const token = useAppSelector((state) => state.session.token)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [couponError, setCouponError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !token) return
    setSubmitting(true)
    setFormError('')
    setCouponError('')
    const key = checkoutKeyFor(cartSignature(items))
    try {
      const order = await placeOrder(token, {
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        coupon,
        idempotencyKey: key,
      })
      dispatch(clearCart())
      clearCheckoutKey()
      navigate(`/orders/${order.id}`)
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        navigate(`/login?returnTo=${encodeURIComponent('/checkout')}`)
        return
      }
      if (isApiError(error)) {
        setFormError(error.userMessage)
        setCouponError(error.fieldErrors.coupon ?? '')
      } else {
        setFormError(messageFrom(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="page">
        <StatusPanel title="Nothing to check out" message="Your cart is empty." actionLabel="Browse the shop" onAction={() => navigate('/')} />
      </section>
    )
  }

  return (
    <section className="page narrow">
      <p className="eyebrow">Checkout</p>
      <h1>Place your order</h1>
      <p>Retrying uses the same idempotency key, so a lost response cannot create a second order.</p>
      <dl className="totals">
        <div><dt>Items</dt><dd>{summary.count}</dd></div>
        <div><dt>Subtotal</dt><dd>{formatRupeesFromCents(summary.subtotalCents)}</dd></div>
        <div><dt>Discount</dt><dd>{formatRupeesFromCents(summary.discountCents)}</dd></div>
        <div><dt>Payable</dt><dd>{formatRupeesFromCents(summary.payableCents)}</dd></div>
      </dl>
      <form className="stack-form" onSubmit={(event) => void onSubmit(event)} noValidate>
        {formError ? <p className="form-error" role="alert">{formError}</p> : null}
        <label htmlFor="coupon">Coupon</label>
        <input
          id="coupon"
          value={coupon}
          aria-invalid={couponError ? true : undefined}
          aria-describedby={couponError ? 'coupon-error' : 'coupon-hint'}
          onChange={(event) => setCoupon(event.target.value)}
        />
        <p id="coupon-hint">Leave this blank, or use DUCK. BAD shows a field error and does not place the order.</p>
        {couponError ? <p id="coupon-error" className="field-error">{couponError}</p> : null}
        <button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
      <p><Link to="/cart">Back to cart</Link></p>
    </section>
  )
}
