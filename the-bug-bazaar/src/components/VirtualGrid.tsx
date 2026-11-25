import { useEffect, useRef, useState, type ReactNode } from 'react'
import { visibleRowRange } from '../domain/virtual.ts'
import { useWindowWidth } from '../hooks/useWindowWidth.ts'
import type { Product } from '../types.ts'

type VirtualGridProps = {
  items: Product[]
  resetKey: string
  renderItem: (product: Product) => ReactNode
}

export function VirtualGrid({ items, resetKey, renderItem }: VirtualGridProps) {
  const width = useWindowWidth()
  const columns = width < 720 ? 1 : width < 1100 ? 2 : 4
  const [rowHeight, setRowHeight] = useState(480)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)
  const skipReset = useRef(true)

  useEffect(() => {
    function measure() {
      const element = scrollerRef.current
      if (!element) return
      const top = element.getBoundingClientRect().top + window.scrollY
      setScrollTop(Math.max(0, window.scrollY - top))
      setViewportHeight(window.innerHeight)
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    const element = scrollerRef.current
    if (!element) return
    const measureRow = () => {
      const card = element.querySelector('.card')
      if (!card) return
      const next = Math.round(card.getBoundingClientRect().height) + 32
      setRowHeight((current) => (current === next ? current : next))
    }
    measureRow()
    const observer = new ResizeObserver(measureRow)
    observer.observe(element)
    return () => observer.disconnect()
  }, [items, columns, width])

  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false
      return
    }
    const element = scrollerRef.current
    if (!element) return
    const top = element.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: Math.max(0, top - 16) })
  }, [resetKey])

  const rowCount = Math.ceil(items.length / columns)
  const range = visibleRowRange(scrollTop, viewportHeight, rowHeight, rowCount)
  const visible = items.slice(range.start * columns, range.end * columns)

  return (
    <div className="catalog-scroll" ref={scrollerRef}>
      <div style={{ height: Math.max(rowCount, 1) * rowHeight, position: 'relative' }}>
        <div
          className="catalog-rows"
          style={{
            transform: `translateY(${range.start * rowHeight}px)`,
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {visible.map((product) => (
            <div key={product.id}>
              {renderItem(product)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
