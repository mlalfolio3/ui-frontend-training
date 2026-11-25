export function visibleRowRange(
  scrollTop: number,
  viewport: number,
  rowHeight: number,
  rowCount: number,
): { start: number; end: number } {
  if (rowCount <= 0 || rowHeight <= 0) return { start: 0, end: 0 }
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 1)
  const visible = Math.ceil(viewport / rowHeight) + 3
  const end = Math.min(rowCount, start + visible)
  return { start, end }
}
