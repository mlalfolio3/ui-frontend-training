export const monitoringLog: string[] = []

export function reportError(error: unknown, detail = ''): void {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const line = `${new Date().toISOString()} ${message}${detail ? ` ${detail.trim()}` : ''}`
  monitoringLog.push(line)
  console.error('[bug-bazaar]', line)
}
