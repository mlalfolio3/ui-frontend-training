import { useState } from 'react'

type ProductImageProps = {
  src: string
  alt: string
}

export function ProductImage({ src, alt }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="image-fallback" role="img" aria-label={alt || 'Image unavailable'}>
        <span>Image unavailable</span>
      </div>
    )
  }

  return <img src={src} alt={alt} onError={() => setFailed(true)} />
}
