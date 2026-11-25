import { useEffect, useRef, useState } from 'react'
import { readTick } from '../api/adapt.ts'
import { patchCachedStock } from '../api/client.ts'
import { getStockTick } from '../api/products.ts'
import type { StockTick } from '../types.ts'

export type FeedStatus = 'connecting' | 'connected' | 'lost' | 'reconnecting' | 'closed' | 'polling'

export function useStockFeed(onTick: (tick: StockTick) => void): {
  status: FeedStatus
  drop: () => void
} {
  const [status, setStatus] = useState<FeedStatus>('connecting')
  const onTickRef = useRef(onTick)
  const dropRef = useRef<() => void>(() => {})

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let retryTimer = 0
    let pollTimer = 0
    let attempts = 0
    let sawOpen = false

    function publish(tick: StockTick) {
      patchCachedStock(tick.id, tick.stock)
      onTickRef.current(tick)
    }

    function startPolling() {
      if (stopped) return
      setStatus('polling')
      const poll = () => {
        void getStockTick()
          .then((tick) => {
            if (!stopped) publish(tick)
          })
          .catch(() => {
            if (!stopped) setStatus('lost')
          })
      }
      poll()
      pollTimer = window.setInterval(poll, 2000)
    }

    function connect(reason: 'start' | 'retry') {
      if (stopped) return
      setStatus(reason === 'start' ? 'connecting' : 'reconnecting')
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      socket = new WebSocket(`${protocol}://${window.location.host}/api/stock-ws`)
      socket.onopen = () => {
        if (stopped) return
        sawOpen = true
        attempts = 0
        setStatus('connected')
      }
      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return
        try {
          const tick = readTick(JSON.parse(event.data) as unknown)
          if (tick) publish(tick)
        } catch {
          // Ignore a hello frame or a malformed payload.
        }
      }
      socket.onclose = () => {
        if (stopped) return
        setStatus('lost')
        attempts += 1
        if (!sawOpen && attempts >= 2) {
          startPolling()
          return
        }
        retryTimer = window.setTimeout(() => connect('retry'), 700)
      }
    }

    dropRef.current = () => {
      setStatus('lost')
      socket?.close()
    }

    connect('start')

    return () => {
      stopped = true
      window.clearTimeout(retryTimer)
      window.clearInterval(pollTimer)
      socket?.close()
    }
  }, [])

  return {
    status,
    drop: () => dropRef.current(),
  }
}
