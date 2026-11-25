import { delayMsFor } from '../domain/delay.ts'
import { handleApi } from './backend.ts'

function aborted(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(aborted())
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(aborted())
      },
      { once: true },
    )
  })
}

export function installBrowserApi(): void {
  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const parsed = new URL(rawUrl, window.location.origin)
    if (!parsed.pathname.startsWith('/api/')) return nativeFetch(input, init)

    const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
    const rawBody = typeof init?.body === 'string' ? init.body : ''
    const headers: Record<string, string> = {}
    new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).forEach((value, key) => {
      headers[key] = value
    })

    await wait(delayMsFor(`${parsed.pathname}${parsed.search}`), init?.signal ?? undefined)

    const result = handleApi({
      method,
      url: `${parsed.pathname}${parsed.search}`,
      rawBody,
      headers,
    })
    const body =
      result.status === 204
        ? null
        : result.contentType.startsWith('text/csv')
          ? String(result.body ?? '')
          : JSON.stringify(result.body)

    return new Response(body, {
      status: result.status,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': result.cacheControl,
        ETag: result.etag,
        ...result.extraHeaders,
      },
    })
  }
}
