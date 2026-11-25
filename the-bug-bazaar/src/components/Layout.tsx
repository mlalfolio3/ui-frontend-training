import type { ReactNode } from 'react'
import { Footer } from './Footer.tsx'
import { Header } from './Header.tsx'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
    </>
  )
}
