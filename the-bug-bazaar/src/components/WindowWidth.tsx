import { useWindowWidth } from '../hooks/useWindowWidth.ts'

export function WindowWidth() {
  const width = useWindowWidth()
  return <span>Window width: {width}px</span>
}
