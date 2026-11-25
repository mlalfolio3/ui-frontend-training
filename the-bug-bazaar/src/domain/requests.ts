export function isLatestRequest(requestId: number, latestId: number): boolean {
  return requestId === latestId
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
