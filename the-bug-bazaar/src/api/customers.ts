import type { Customer } from '../types.ts'
import { readCustomer, readCustomerList } from './adapt.ts'
import { apiRequest } from './client.ts'

export function getCustomers(search: string, signal?: AbortSignal): Promise<Customer[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const query = params.toString()
  return apiRequest<unknown>(`/api/customers${query ? `?${query}` : ''}`, {
    signal,
    resource: 'customer',
  }).then(readCustomerList)
}

export function getCustomer(id: string, signal?: AbortSignal): Promise<Customer> {
  return apiRequest<unknown>(`/api/customers/${encodeURIComponent(id)}`, {
    signal,
    resource: 'customer',
  }).then(readCustomer)
}

export function createCustomer(input: {
  name: string
  email: string
  city: string
}): Promise<Customer> {
  return apiRequest<unknown>('/api/customers', {
    method: 'POST',
    body: input,
    resource: 'customer',
  }).then(readCustomer)
}

export function updateCustomer(
  id: string,
  input: { name: string; email: string; city: string },
): Promise<Customer> {
  return apiRequest<unknown>(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
    resource: 'customer',
  }).then(readCustomer)
}

export function deleteCustomer(id: string): Promise<void> {
  return apiRequest<unknown>(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    resource: 'customer',
  }).then(() => undefined)
}
