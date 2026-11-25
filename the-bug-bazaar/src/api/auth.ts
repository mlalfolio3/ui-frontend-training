import type { SessionUser } from '../types.ts'
import { readLogin, readUser } from './adapt.ts'
import { apiRequest } from './client.ts'

export function login(email: string, password: string): Promise<{ token: string; user: SessionUser }> {
  return apiRequest<unknown>('/api/login', {
    method: 'POST',
    body: { email, password },
    resource: 'login',
  }).then(readLogin)
}

export function getMe(token: string, signal?: AbortSignal): Promise<SessionUser> {
  return apiRequest<unknown>('/api/me', {
    signal,
    headers: { Authorization: `Bearer ${token}` },
    resource: 'generic',
  }).then(readUser)
}
