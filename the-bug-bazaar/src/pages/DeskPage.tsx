import { useState, type FormEvent } from 'react'
import { createCustomer } from '../api/customers.ts'
import { createSuggestion } from '../api/products.ts'
import { CustomerPanel } from '../components/CustomerPanel.tsx'
import { DashboardPanels } from '../components/DashboardPanels.tsx'
import { ExportPanel } from '../components/ExportPanel.tsx'
import { ProductForm } from '../components/ProductForm.tsx'
import { isApiError, messageFrom } from '../domain/errors.ts'
import type { FieldErrors } from '../types.ts'

export function DeskPage() {
  return (
    <section className="page">
      <p className="eyebrow">Team desk</p>
      <h1>Customers, exports, and partial failures</h1>
      <p>
        The shop and this desk are one app. Catalog can succeed while inventory fails.
        Customer search can ignore an older response, and the export job moves from pending to ready, failed, or expired.
      </p>
      <DashboardPanels />
      <div className="panel-grid">
        <CustomerPanel />
        <div>
          <CreateCustomerForm />
          <ExportPanel />
          <section className="panel">
            <ProductForm
              onCreate={async (input) => {
                try {
                  await createSuggestion(input)
                  return null
                } catch (error) {
                  if (isApiError(error)) return error.fieldErrors
                  throw error
                }
              }}
            />
          </section>
        </div>
      </div>
    </section>
  )
}

function CreateCustomerForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFormError('')
    setErrors({})
    setSuccess('')
    try {
      await createCustomer({ name, email, city })
      setName('')
      setEmail('')
      setCity('')
      setSuccess('Customer saved.')
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.userMessage)
        setErrors(error.fieldErrors)
      } else {
        setFormError(messageFrom(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <form className="stack-form" onSubmit={(event) => void onSubmit(event)} noValidate>
        <h2>Add a customer</h2>
        <p>Try an email that already exists, such as sara@example.com, to see a field error.</p>
        {formError ? <p className="form-error" role="alert">{formError}</p> : null}
        {success ? <p className="form-success" role="status">{success}</p> : null}
        <label htmlFor="new-name">Name</label>
        <input id="new-name" value={name} aria-invalid={errors.name ? true : undefined} onChange={(event) => setName(event.target.value)} />
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
        <label htmlFor="new-email">Email</label>
        <input id="new-email" type="email" value={email} aria-invalid={errors.email ? true : undefined} onChange={(event) => setEmail(event.target.value)} />
        {errors.email ? <p className="field-error">{errors.email}</p> : null}
        <label htmlFor="new-city">City</label>
        <input id="new-city" value={city} aria-invalid={errors.city ? true : undefined} onChange={(event) => setCity(event.target.value)} />
        {errors.city ? <p className="field-error">{errors.city}</p> : null}
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save customer'}</button>
      </form>
    </section>
  )
}
