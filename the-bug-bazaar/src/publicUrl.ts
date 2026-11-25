export function publicUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  const base = import.meta.env.BASE_URL || '/'
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (base === '/') return normalized
  return `${base.replace(/\/$/, '')}${normalized}`
}
