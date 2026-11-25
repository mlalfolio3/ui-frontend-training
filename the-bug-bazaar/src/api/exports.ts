import type { ExportJob } from '../types.ts'
import { readExportJob } from './adapt.ts'
import { apiRequest } from './client.ts'

export function startExport(outcome: 'ready' | 'failed' | 'expired'): Promise<ExportJob> {
  return apiRequest<unknown>('/api/exports', {
    method: 'POST',
    body: { outcome },
    resource: 'generic',
  }).then(readExportJob)
}

export function getExport(id: string, signal?: AbortSignal): Promise<ExportJob> {
  return apiRequest<unknown>(`/api/exports/${encodeURIComponent(id)}`, {
    signal,
    resource: 'generic',
  }).then(readExportJob)
}
