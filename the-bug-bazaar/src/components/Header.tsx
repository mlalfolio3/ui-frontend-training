import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicUrl } from '../publicUrl.ts'
import { useAppSelector } from '../store/hooks.ts'
import { selectCartCount } from '../store/selectors.ts'

const MENU_LINKS = [
  { to: '/', label: 'Shop' },
  { to: '/cart', label: 'Cart' },
  { to: '/desk', label: 'Team desk' },
  { to: '/account', label: 'My Account' },
]

export function Header() {
  const count = useAppSelector(selectCartCount)
  const user = useAppSelector((state) => state.session.user)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const menu = menuRef.current
    const items = menu?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]')
    items?.[0]?.focus()

    function onKey(event: KeyboardEvent) {
      if (!menu) return
      const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]'))
      const index = links.indexOf(document.activeElement as HTMLAnchorElement)
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const next = index < 0 ? 0 : (index + 1) % links.length
        links[next]?.focus()
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const next = index < 0 ? links.length - 1 : (index - 1 + links.length) % links.length
        links[next]?.focus()
      }
      if (event.key === 'Home') {
        event.preventDefault()
        links[0]?.focus()
      }
      if (event.key === 'End') {
        event.preventDefault()
        links[links.length - 1]?.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="site-header">
      <div className="header-brand">
        <div className="menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="icon-button"
            aria-label="Menu"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls="shortcut-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        {open ? (
          <div id="shortcut-menu" role="menu" aria-label="Shortcut menu">
            {MENU_LINKS.map((link) => (
              <Link key={link.to} to={link.to} role="menuitem" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
        </div>
        <Link className="logo" to="/" aria-label="The Bug Bazaar">
          <img src={publicUrl('/images/logo.png')} alt="" />
        </Link>
      </div>
      <nav className="primary-nav" aria-label="Primary">
        <Link className="account-link" to={user ? '/account' : '/login'} aria-label="My Account">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M5.2 19.2c1.5-3.1 3.8-4.5 6.8-4.5s5.3 1.4 6.8 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
        <Link className="cart-link" to="/cart" aria-label={`Cart, ${count} items`}>
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M6 7h15l-1.6 8.2H8.2L6 7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M6 7L4.8 4H2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="19.2" r="1.3" fill="currentColor" />
            <circle cx="17" cy="19.2" r="1.3" fill="currentColor" />
          </svg>
          <span className="count">{count}</span>
        </Link>
      </nav>
    </header>
  )
}
