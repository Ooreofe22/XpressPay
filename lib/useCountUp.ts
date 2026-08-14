'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Tasteful count-up for the wallet balance. Animates from the previous value
 * to the new target with an ease-out curve; skips animation entirely when the
 * user prefers reduced motion (and on first paint, so the initial balance
 * just renders).
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [display, setDisplay] = useState(target)
  const previousRef = useRef(target)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    const from = previousRef.current
    previousRef.current = target

    const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!hasMountedRef.current || from === target || reducedMotion) {
      hasMountedRef.current = true
      setDisplay(target)
      return
    }

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (target - from) * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return display
}
