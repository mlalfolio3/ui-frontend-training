import { describe, expect, it } from 'vitest'
import { validatePrice } from './validation.ts'

describe('validatePrice', () => {
  it('rejects an empty string, letters, zero, and negatives', () => {
    expect(validatePrice('')).toBe('Enter a price.')
    expect(validatePrice('   ')).toBe('Enter a price.')
    expect(validatePrice('abc')).toBe('Enter a number.')
    expect(validatePrice('0')).toBe('Price must be greater than 0.')
    expect(validatePrice('-5')).toBe('Price must be greater than 0.')
  })

  it('accepts 250', () => {
    expect(validatePrice('250')).toBe(250)
  })
})
