import type { FieldErrors } from '../types.ts'

export class ApiError extends Error {
  readonly status: number
  readonly userMessage: string
  readonly fieldErrors: FieldErrors

  constructor(status: number, userMessage: string, fieldErrors: FieldErrors) {
    super(userMessage)
    this.name = 'ApiError'
    this.status = status
    this.userMessage = userMessage
    this.fieldErrors = fieldErrors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function fieldMessage(field: string, code: string): string {
  if (field === 'email' && code === 'taken') return 'An account with that email already exists.'
  if (field === 'email') return 'Enter a valid email address.'
  if (field === 'password') return 'Enter your password.'
  if (field === 'name') return 'Enter a name.'
  if (field === 'city') return 'Enter a city.'
  if (field === 'price') return 'Enter a price greater than 0.'
  if (field === 'category') return 'Choose a category.'
  if (field === 'coupon') return 'That code is not valid.'
  if (field === 'items' && code === 'unknown') return 'One of those products is no longer available.'
  if (field === 'items') return 'Add at least one item before checkout.'
  return 'Check this field and try again.'
}

function readDetails(body: unknown): Record<string, string> {
  if (typeof body !== 'object' || body === null || !('error' in body)) return {}
  const error = (body as { error: unknown }).error
  if (typeof error !== 'object' || error === null || !('details' in error)) return {}
  const details = (error as { details: unknown }).details
  if (typeof details !== 'object' || details === null) return {}
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string') result[key] = value
  }
  return result
}

export function messageFrom(error: unknown): string {
  return isApiError(error) ? error.userMessage : 'Something went wrong. Please try again.'
}

export function userMessageForStatus(
  status: number,
  details: Record<string, string>,
  resource: 'product' | 'customer' | 'order' | 'login' | 'generic',
): string {
  if (status === 0) return 'You appear to be offline. Check your connection and try again.'
  if (status === 400) return 'Please fix the highlighted fields.'
  if (status === 401 && resource === 'login') return 'Email or password is incorrect.'
  if (status === 401) return 'Your session expired. Please log in again.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status === 404 && resource === 'product') return 'Product not found'
  if (status === 404 && resource === 'customer') return 'We could not find that customer.'
  if (status === 404 && resource === 'order') return 'We could not find that order.'
  if (status === 404) return 'We could not find that page.'
  if (status === 409) {
    return details.item
      ? `Not enough stock for ${details.item}.`
      : 'That item is no longer in stock.'
  }
  if (status === 500) return 'Service unavailable'
  return 'Something went wrong. Please try again.'
}

export function toApiError(
  status: number,
  body: unknown,
  resource: 'product' | 'customer' | 'order' | 'login' | 'generic' = 'generic',
): ApiError {
  const details = readDetails(body)
  const fieldErrors: FieldErrors = {}
  for (const [field, code] of Object.entries(details)) {
    if (field === 'item') continue
    fieldErrors[field] = fieldMessage(field, code)
  }
  return new ApiError(status, userMessageForStatus(status, details, resource), fieldErrors)
}
