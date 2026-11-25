import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { deleteCustomer, getCustomers, updateCustomer } from '../api/customers.ts'
import { isApiError, messageFrom } from '../domain/errors.ts'
import { isAbortError, isLatestRequest } from '../domain/requests.ts'
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts'
import type { Customer, FieldErrors, RequestState } from '../types.ts'
import { Modal } from './Modal.tsx'
import { LoadingBlock, StatusPanel } from './StatusPanel.tsx'

export function CustomerPanel() {
  const [draft, setDraft] = useState('')
  const debounced = useDebouncedValue(draft, 250)
  const [guard, setGuard] = useState(true)
  const [requestState, setRequestState] = useState<RequestState<Customer[]>>({ state: 'loading' })
  const [appliedQuery, setAppliedQuery] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [notice, setNotice] = useState('')
  const latestRequest = useRef(0)

  useEffect(() => {
    const id = latestRequest.current + 1
    latestRequest.current = id
    const controller = new AbortController()
    setRequestState({ state: 'loading' })
    getCustomers(debounced, guard ? controller.signal : undefined)
      .then((customers) => {
        if (guard && !isLatestRequest(id, latestRequest.current)) return
        setAppliedQuery(debounced)
        if (customers.length === 0) setRequestState({ state: 'empty' })
        else setRequestState({ state: 'success', data: customers })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        if (guard && !isLatestRequest(id, latestRequest.current)) return
        setRequestState({ state: 'error', message: messageFrom(error) })
      })
    return () => {
      if (guard) controller.abort()
    }
  }, [debounced, guard, retryToken])

  function onListClick(event: MouseEvent<HTMLUListElement>) {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest('button')
    if (!(button instanceof HTMLButtonElement)) return
    const action = button.dataset.action
    const id = button.dataset.id
    if (!action || !id || requestState.state !== 'success') return
    const customer = requestState.data.find((item) => item.id === id)
    if (!customer) return
    if (action === 'edit') setEditing(customer)
    if (action === 'delete') {
      void deleteCustomer(id)
        .then(() => {
          setNotice(`Removed ${customer.name}.`)
          setRetryToken((value) => value + 1)
        })
        .catch((error: unknown) => setNotice(messageFrom(error)))
    }
  }

  return (
    <section className="panel">
      <h2>Customers</h2>
      <label htmlFor="customer-search">Search customers</label>
      <input
        id="customer-search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <label className="check">
        <input type="checkbox" checked={guard} onChange={(event) => setGuard(event.target.checked)} />
        Ignore older search responses
      </label>
      <p aria-live="polite">Results for: {appliedQuery || 'everyone'}</p>
      <p className="sr-only" aria-live="polite">{notice}</p>
      {requestState.state === 'loading' ? <LoadingBlock label="Loading customers" /> : null}
      {requestState.state === 'error' ? (
        <StatusPanel tone="error" title="Customer search failed" message={requestState.message} actionLabel="Retry" onAction={() => setRetryToken((value) => value + 1)} />
      ) : null}
      {requestState.state === 'empty' ? (
        <StatusPanel title="No customers" message="Nothing matches that search." />
      ) : null}
      {requestState.state === 'success' ? (
        <ul className="people" onClick={onListClick}>
          {requestState.data.map((customer) => (
            <li key={customer.id}>
              <div>
                <Link to={`/desk/customers/${customer.id}`}>{customer.name}</Link>
                <p>{customer.email} · {customer.city}</p>
              </div>
              <div className="button-row">
                <button type="button" data-action="edit" data-id={customer.id}>Edit</button>
                <button type="button" data-action="delete" data-id={customer.id}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {editing ? (
        <EditCustomerModal
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setNotice('Customer updated.')
            setRetryToken((value) => value + 1)
          }}
        />
      ) : null}
    </section>
  )
}

function EditCustomerModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(customer.name)
  const [email, setEmail] = useState(customer.email)
  const [city, setCity] = useState(customer.city)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      await updateCustomer(customer.id, { name, email, city })
      onSaved()
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
    <Modal title={`Edit ${customer.name}`} onClose={onClose}>
      <form className="stack-form" onSubmit={(event) => void onSubmit(event)} noValidate>
        {formError ? <p className="form-error" role="alert">{formError}</p> : null}
        <label htmlFor="edit-name">Name</label>
        <input id="edit-name" value={name} aria-invalid={errors.name ? true : undefined} onChange={(event) => setName(event.target.value)} />
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
        <label htmlFor="edit-email">Email</label>
        <input id="edit-email" type="email" value={email} aria-invalid={errors.email ? true : undefined} onChange={(event) => setEmail(event.target.value)} />
        {errors.email ? <p className="field-error">{errors.email}</p> : null}
        <label htmlFor="edit-city">City</label>
        <input id="edit-city" value={city} aria-invalid={errors.city ? true : undefined} onChange={(event) => setCity(event.target.value)} />
        {errors.city ? <p className="field-error">{errors.city}</p> : null}
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save customer'}</button>
      </form>
    </Modal>
  )
}
