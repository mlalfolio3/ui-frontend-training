import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductForm } from './ProductForm.tsx'

describe('ProductForm', () => {
  it('keeps the typed name when the price is empty', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<ProductForm onCreate={onCreate} />)
    await user.type(screen.getByLabelText('Name'), 'Desk Duck')
    await user.click(screen.getByRole('button', { name: 'Save suggestion' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Desk Duck')
    expect(screen.getByText('Enter a price.')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('clears the fields only after a successful submit', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(null)
    render(<ProductForm onCreate={onCreate} />)
    await user.type(screen.getByLabelText('Name'), 'Desk Duck')
    await user.type(screen.getByLabelText('Price in rupees'), '250')
    await user.selectOptions(screen.getByLabelText('Category'), 'ducks')
    await user.click(screen.getByRole('button', { name: 'Save suggestion' }))
    expect(onCreate).toHaveBeenCalled()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Price in rupees')).toHaveValue('')
  })
})
