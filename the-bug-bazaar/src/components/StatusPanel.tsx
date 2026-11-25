type StatusPanelProps = {
  title: string
  message: string
  tone?: 'info' | 'error'
  actionLabel?: string
  onAction?: () => void
}

export function StatusPanel({ title, message, tone = 'info', actionLabel, onAction }: StatusPanelProps) {
  return (
    <div className={`status-panel ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="skeleton" key={index} />
      ))}
    </div>
  )
}
