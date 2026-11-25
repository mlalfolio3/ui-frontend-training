import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../api/auth.ts'
import { isApiError, messageFrom } from '../domain/errors.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { loginSuccess } from '../store/sessionSlice.ts'

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account'
  return value
}

export function LoginPage() {
  const token = useAppSelector((state) => state.session.token)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (token) return <Navigate to={returnTo} replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFormError('')
    setEmailError('')
    setPasswordError('')
    try {
      const result = await login(email, password)
      dispatch(loginSuccess(result))
      navigate(returnTo)
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.userMessage)
        setEmailError(error.fieldErrors.email ?? '')
        setPasswordError(error.fieldErrors.password ?? '')
      } else {
        setFormError(messageFrom(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page login-page">
      <div className="login-card">
        <p className="eyebrow">Account</p>
        <h1>Log in</h1>
        <p className="login-demo">Demo account: <strong>ada@bugbazaar.dev</strong> / <strong>quack-quack</strong></p>
        <form className="stack-form" onSubmit={(event) => void onSubmit(event)} noValidate>
          {formError ? <p className="form-error" role="alert">{formError}</p> : null}
          <label htmlFor="email">Email</label>
          <div className="field-icon">
            <span className="lead-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 7 9-7" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="Enter your email"
              value={email}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {emailError ? <p id="email-error" className="field-error">{emailError}</p> : null}
          <label htmlFor="password">Password</label>
          <div className="field-icon">
            <span className="lead-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? 'password-error' : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="toggle-secret"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((open) => !open)}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6A2 2 0 0 0 12 15a2 2 0 0 0 1.8-1" />
                  <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.6 1.4-1.6 2.7-2.8 3.8" />
                  <path d="M6.1 6.1C4.2 7.4 2.7 9.1 1.8 11c1.2 2.6 3.6 4.8 6.4 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {passwordError ? <p id="password-error" className="field-error">{passwordError}</p> : null}
          <button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>
      </div>
    </section>
  )
}
