import { useEffect, useState } from 'react'
import { getExport, startExport } from '../api/exports.ts'
import { messageFrom } from '../domain/errors.ts'
import { isAbortError } from '../domain/requests.ts'
import type { ExportJob } from '../types.ts'

export function ExportPanel() {
  const [job, setJob] = useState<ExportJob | null>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!job || job.status !== 'pending') return
    const controller = new AbortController()
    const timer = window.setInterval(() => {
      void getExport(job.id, controller.signal)
        .then((next) => setJob(next))
        .catch((caught: unknown) => {
          if (!isAbortError(caught)) setError(messageFrom(caught))
        })
    }, 400)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [job])

  async function begin(outcome: 'ready' | 'failed' | 'expired') {
    if (starting) return
    setStarting(true)
    setError('')
    try {
      setJob(await startExport(outcome))
    } catch (caught) {
      setError(messageFrom(caught))
    } finally {
      setStarting(false)
    }
  }

  return (
    <section className="panel" aria-live="polite">
      <h2>Customer export</h2>
      <div className="button-row">
        <button type="button" disabled={starting} onClick={() => void begin('ready')}>Export customers</button>
        <button type="button" disabled={starting} onClick={() => void begin('failed')}>Preview a failed export</button>
        <button type="button" disabled={starting} onClick={() => void begin('expired')}>Preview an expired export</button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {!job ? <p>No export yet. Start one to see pending, then ready, failed, or expired.</p> : null}
      {job?.status === 'pending' ? <p>Preparing your export…</p> : null}
      {job?.status === 'ready' && job.downloadUrl ? (
        <p><a href={job.downloadUrl}>Download export</a></p>
      ) : null}
      {job?.status === 'failed' ? (
        <p>
          Export failed.{' '}
          <button type="button" onClick={() => void begin('ready')}>Retry</button>
        </p>
      ) : null}
      {job?.status === 'expired' ? (
        <p>
          That download link has expired.{' '}
          <button type="button" onClick={() => void begin('ready')}>Export again</button>
        </p>
      ) : null}
    </section>
  )
}
