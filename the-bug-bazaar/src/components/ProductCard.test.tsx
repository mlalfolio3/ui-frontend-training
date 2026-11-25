import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../types.ts'
import { ProductCard } from './ProductCard.tsx'

const soldOut: Product = {
  id: 'p-sold',
  name: 'Silent Keyboard #23',
  price: 250000,
  category: 'keyboards',
  stock: 0,
  rating: 4.9,
  imageUrl: '/images/keyboard.svg',
}

const onSale: Product = {
  id: 'p-sale',
  name: 'Debug Duck #2',
  price: 19900,
  category: 'ducks',
  stock: 4,
  rating: 4.9,
  imageUrl: '/images/duck.svg',
}

describe('ProductCard', () => {
  it('shows Sold out and does not add the product', async () => {
    const onAdd = vi.fn()
    render(
      <MemoryRouter>
        <ProductCard product={soldOut} onAdd={onAdd} />
      </MemoryRouter>,
    )
    const button = screen.getByRole('button', { name: 'Sold out' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('shows an On sale badge and adds an in-stock product', async () => {
    const onAdd = vi.fn()
    render(
      <MemoryRouter>
        <ProductCard product={onSale} onAdd={onAdd} />
      </MemoryRouter>,
    )
    expect(screen.getByText('On sale')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(onAdd).toHaveBeenCalledWith(onSale)
  })
})
