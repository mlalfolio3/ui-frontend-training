import { Link } from 'react-router-dom'
import { WindowWidth } from './WindowWidth.tsx'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Link className="footer-logo" to="/" aria-label="The Bug Bazaar">
          <img src="/images/logo-color.png" alt="" />
        </Link>
        <p className="footer-tagline">Developer gear, rubber ducks, and late-night coffee.</p>
      </div>
      <p className="footer-meta"><WindowWidth /></p>
      <p className="footer-preview"><Link to="/preview-crash">Preview the error fallback</Link></p>
    </footer>
  )
}
