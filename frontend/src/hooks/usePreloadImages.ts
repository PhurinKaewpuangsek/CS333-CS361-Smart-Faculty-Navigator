import { useEffect, useState } from 'react'

/**
 * Downloads images ahead of time and reports when every one has settled.
 *
 * Used so the loading screen can hold the map back until its floor plans are cached too;
 * otherwise the markers would arrive first and the artwork would paint in under them. A
 * failed image still counts as settled, so a broken asset can never keep the app stuck on
 * the loading screen.
 */
export function usePreloadImages(urls: readonly string[]): boolean {
  const [ready, setReady] = useState(false)
  const key = urls.join('|')

  useEffect(() => {
    let isMounted = true
    const images = key.split('|').filter(Boolean)

    Promise.all(
      images.map(
        (src) =>
          new Promise<void>((resolve) => {
            const image = new Image()
            image.onload = () => resolve()
            image.onerror = () => resolve()
            image.src = src
          })
      )
    ).then(() => {
      if (isMounted) setReady(true)
    })

    return () => {
      isMounted = false
    }
  }, [key])

  return ready
}
