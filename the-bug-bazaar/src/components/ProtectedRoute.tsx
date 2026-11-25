import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store/hooks.ts'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAppSelector((state) => state.session.token)
  const location = useLocation()
  if (!token) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  return children
}
