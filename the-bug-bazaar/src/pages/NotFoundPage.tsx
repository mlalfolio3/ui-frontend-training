import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="page narrow">
      <p className="eyebrow">404</p>
      <h1>We could not find that page</h1>
      <p>The address does not match a shop, cart, account, or desk page.</p>
      <Link className="button" to="/">Back to the shop</Link>
    </section>
  )
}
