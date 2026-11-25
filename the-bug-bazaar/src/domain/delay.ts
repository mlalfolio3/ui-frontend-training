export function delayMsFor(url: string, base = 200): number {
  const parsed = new URL(url, 'http://localhost')
  const search = parsed.searchParams.get('search') ?? ''
  if (search.length > 0 && search.length < 4) return Math.max(base, 1100)
  return base
}
