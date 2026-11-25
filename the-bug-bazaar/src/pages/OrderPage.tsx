import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../api/orders.ts'
import { LoadingBlock, StatusPanel } from '../components/StatusPanel.tsx'
import { messageFrom } from '../domain/errors.ts'
import { isAbortError } from '../domain/requests.ts'
import { useAppSelector } from '../store/hooks.ts'
import type { OrderSummary, RequestState } from '../types.ts'

export function OrderPage() {
  const { id = '' } = useParams()
  const token = useAppSelector((state) => state.session.token)
  const [requestState, setRequestState] = useState<RequestState<OrderSummary>>({ state: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    setRequestState({ state: 'loading' })
    getOrder(token, id, controller.signal)
      .then((order) => setRequestState({ state: 'success', data: order }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setRequestState({ state: 'error', message: messageFrom(error) })
      })
    return () => controller.abort()
  }, [id, token, retryToken])

  return (
    <section className="page narrow">
      {requestState.state === 'loading' ? <LoadingBlock label="Loading order" /> : null}
      {requestState.state === 'error' ? (
        <StatusPanel
          tone="error"
          title="We could not load this order"
          message={requestState.message}
          actionLabel="Retry"
          onAction={() => setRetryToken((value) => value + 1)}
        />
      ) : null}
      {requestState.state === 'success' ? (
        <>
          <p className="eyebrow">Order</p>
          <h1>Your order is queued</h1>
          <p>Order <strong>{requestState.data.id}</strong> has status <strong>{requestState.data.status}</strong>.</p>
          <p>Payment, stock, and the receipt email are handled by workers. You can refresh this page and still see the same order.</p>
          <Link className="button" to="/">Keep browsing</Link>
        </>
      ) : null}
    </section>
  )
}
