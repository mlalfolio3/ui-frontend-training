import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../api/auth.ts'
import { LoadingBlock, StatusPanel } from '../components/StatusPanel.tsx'
import { messageFrom } from '../domain/errors.ts'
import { isAbortError } from '../domain/requests.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { clearSession } from '../store/sessionSlice.ts'
import type { RequestState, SessionUser } from '../types.ts'

export function AccountPage() {
  const token = useAppSelector((state) => state.session.token)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [requestState, setRequestState] = useState<RequestState<SessionUser>>({ state: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    setRequestState({ state: 'loading' })
    getMe(token, controller.signal)
      .then((user) => setRequestState({ state: 'success', data: user }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setRequestState({ state: 'error', message: messageFrom(error) })
      })
    return () => controller.abort()
  }, [token, retryToken])

  return (
    <section className="page account-page">
      <div className="account-card">
        <p className="eyebrow">Account</p>
        <h1>Your account</h1>
        {requestState.state === 'loading' ? <LoadingBlock label="Loading account" /> : null}
        {requestState.state === 'error' ? (
          <StatusPanel
            tone="error"
            title="We could not open your account"
            message={requestState.message}
            actionLabel="Retry"
            onAction={() => setRetryToken((value) => value + 1)}
          />
        ) : null}
        {requestState.state === 'success' ? (
          <>
            <div className="account-body">
              <div className="account-avatar" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5 19.2c1.4-3 3.6-4.4 7-4.4s5.6 1.4 7 4.4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="account-details">
                <p>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="12" cy="8" r="3" />
                    <path d="M5.5 19c1.3-2.6 3.4-3.8 6.5-3.8s5.2 1.2 6.5 3.8" strokeLinecap="round" />
                  </svg>
                  {requestState.data.name}
                </p>
                <p>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 7 9-7" />
                  </svg>
                  {requestState.data.email}
                </p>
                <p>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                  </svg>
                  Role: <span className="role-pill">{requestState.data.role}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className="logout"
              onClick={() => {
                dispatch(clearSession())
                navigate('/')
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
                <path d="M4 12h11" />
                <path d="M12 8l4 4-4 4" />
              </svg>
              Log out
            </button>
          </>
        ) : null}
      </div>
    </section>
  )
}
