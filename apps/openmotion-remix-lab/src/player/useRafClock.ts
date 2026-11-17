import { useEffect, useRef } from "react"

export function useRafClock(
  playing: boolean,
  durationMs: number,
  onFrame: (deltaMs: number) => void,
) {
  const callback = useRef(onFrame)
  useEffect(() => {
    callback.current = onFrame
  }, [onFrame])

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const delta = now - last
      last = now
      callback.current(delta)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [playing, durationMs])
}
