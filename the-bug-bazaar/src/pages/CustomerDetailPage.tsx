import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCustomer } from '../api/customers.ts'
import { LoadingBlock, StatusPanel } from '../components/StatusPanel.tsx'
import { messageFrom } from '../domain/errors.ts'
import { isAbortError } from '../domain/requests.ts'
import type { Customer, RequestState } from '../types.ts'

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const [requestState, setRequestState] = useState<RequestState<Customer>>({ state: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setRequestState({ state: 'loading' })
    getCustomer(id, controller.signal)
      .then((customer) => {
        if (active) setRequestState({ state: 'success', data: customer })
      })
      .catch((error: unknown) => {
        if (!active || isAbortError(error)) return
        setRequestState({ state: 'error', message: messageFrom(error) })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [id, retryToken])

  return (
    <section className="page narrow">
      <p><Link to="/desk">Back to the team desk</Link></p>
      {requestState.state === 'loading' ? <LoadingBlock label="Loading customer" /> : null}
      {requestState.state === 'error' ? (
        <StatusPanel
          tone="error"
          title="We could not open this customer"
          message={requestState.message}
          actionLabel="Retry"
          onAction={() => setRetryToken((value) => value + 1)}
        />
      ) : null}
      {requestState.state === 'success' ? (
        <>
          <p className="eyebrow">Customer</p>
          <h1>{requestState.data.name}</h1>
          <p>{requestState.data.email}</p>
          <p>{requestState.data.city}</p>
        </>
      ) : null}
    </section>
  )
}
