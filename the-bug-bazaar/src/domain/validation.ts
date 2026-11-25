export function validatePrice(priceText: string): number | string {
  const trimmed = priceText.trim()
  if (trimmed === '') return 'Enter a price.'
  const value = Number(trimmed)
  if (Number.isNaN(value)) return 'Enter a number.'
  if (value <= 0) return 'Price must be greater than 0.'
  return value
}

export function validateName(name: string): string | null {
  if (name.trim() === '') return 'Enter a name.'
  return null
}
