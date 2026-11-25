import { useState, type FormEvent } from 'react'
import { messageFrom } from '../domain/errors.ts'
import { validateName, validatePrice } from '../domain/validation.ts'
import { CATEGORIES, type Category, type FieldErrors } from '../types.ts'
import { categoryLabel } from '../domain/products.ts'

type SuggestionInput = {
  name: string
  price: string
  category: Category | ''
}

type ProductFormProps = {
  onCreate: (input: SuggestionInput) => Promise<FieldErrors | null>
}

export function ProductForm({ onCreate }: ProductFormProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const nextErrors: FieldErrors = {}
    const nameError = validateName(name)
    const priceResult = validatePrice(price)
    if (nameError) nextErrors.name = nameError
    if (typeof priceResult === 'string') nextErrors.price = priceResult
    if (!category) nextErrors.category = 'Choose a category.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSuccess('')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const result = await onCreate({ name, price, category })
      if (result && Object.keys(result).length > 0) {
        setErrors(result)
        return
      }
      setName('')
      setPrice('')
      setCategory('')
      setErrors({})
      setSuccess('Suggestion saved. The fields are clear for the next one.')
    } catch (error) {
      setFormError(messageFrom(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="stack-form" onSubmit={(event) => void onSubmit(event)} noValidate>
      <h2>Suggest a product</h2>
      <p>Fields clear only after a successful submit.</p>
      {formError ? <p className="form-error" role="alert">{formError}</p> : null}
      {success ? <p className="form-success" role="status">{success}</p> : null}
      <label htmlFor="suggest-name">Name</label>
      <input
        id="suggest-name"
        value={name}
        aria-invalid={errors.name ? true : undefined}
        aria-describedby={errors.name ? 'suggest-name-error' : undefined}
        onChange={(event) => setName(event.target.value)}
      />
      {errors.name ? <p id="suggest-name-error" className="field-error">{errors.name}</p> : null}
      <label htmlFor="suggest-price">Price in rupees</label>
      <input
        id="suggest-price"
        inputMode="decimal"
        value={price}
        aria-invalid={errors.price ? true : undefined}
        aria-describedby={errors.price ? 'suggest-price-error' : undefined}
        onChange={(event) => setPrice(event.target.value)}
      />
      {errors.price ? <p id="suggest-price-error" className="field-error">{errors.price}</p> : null}
      <label htmlFor="suggest-category">Category</label>
      <select
        id="suggest-category"
        value={category}
        aria-invalid={errors.category ? true : undefined}
        aria-describedby={errors.category ? 'suggest-category-error' : undefined}
        onChange={(event) => {
          const value = event.target.value
          setCategory(CATEGORIES.find((item) => item === value) ?? '')
        }}
      >
        <option value="">Choose one</option>
        {CATEGORIES.map((item) => (
          <option key={item} value={item}>{categoryLabel(item)}</option>
        ))}
      </select>
      {errors.category ? <p id="suggest-category-error" className="field-error">{errors.category}</p> : null}
      <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save suggestion'}</button>
    </form>
  )
}
