import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Duplex } from 'node:stream'
import { loadEnv, type PreviewServer, type ViteDevServer } from 'vite'
import { defineConfig } from 'vitest/config'
import { WebSocketServer } from 'ws'
import { applyRandomStockTick, handleApi } from './src/api/backend.ts'
import { delayMsFor } from './src/domain/delay.ts'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function attach(server: ViteDevServer | PreviewServer, baseDelay: number): void {
  server.middlewares.use((req, res, next) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/')) {
      next()
      return
    }
    void handle(req, res, baseDelay)
  })

  const httpServer = server.httpServer
  if (!httpServer) return
  const sockets = new WebSocketServer({ noServer: true })
  httpServer.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const path = (req.url ?? '').split('?')[0]
    if (path !== '/api/stock-ws') return
    sockets.handleUpgrade(req, socket, head, (ws) => {
      ws.send(JSON.stringify({ type: 'hello' }))
    })
  })
  const timer = setInterval(() => {
    const payload = JSON.stringify(applyRandomStockTick())
    for (const client of sockets.clients) {
      if (client.readyState === 1) client.send(payload)
    }
  }, 2500)
  httpServer.on('close', () => {
    clearInterval(timer)
    sockets.close()
  })
}

async function handle(req: IncomingMessage, res: ServerResponse, baseDelay: number): Promise<void> {
  try {
    const rawBody = await readBody(req)
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers[key] = value
    }
    const result = handleApi({
      method: req.method ?? 'GET',
      url: req.url ?? '/',
      rawBody,
      headers,
    })
    await new Promise((resolve) => setTimeout(resolve, delayMsFor(req.url ?? '/', baseDelay)))
    res.statusCode = result.status
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Cache-Control', result.cacheControl)
    res.setHeader('ETag', result.etag)
    for (const [key, value] of Object.entries(result.extraHeaders)) res.setHeader(key, value)
    if (result.status === 204) {
      res.end()
      return
    }
    if (result.contentType.startsWith('text/csv')) {
      res.end(String(result.body ?? ''))
      return
    }
    res.end(JSON.stringify(result.body))
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: { code: 'internal', message: 'catalog query failed' } }))
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseDelay = Number(env.API_DELAY_MS || 200)
  return {
    plugins: [
      react(),
      {
        name: 'bug-bazaar-api',
        configureServer(server) {
          attach(server, Number.isFinite(baseDelay) ? baseDelay : 200)
        },
        configurePreviewServer(server) {
          attach(server, Number.isFinite(baseDelay) ? baseDelay : 200)
        },
      },
    ],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
