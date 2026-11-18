import { useCallback, useEffect, useState } from "react"
import { initialState, saveState } from "@/engine/persistence"
import { reduce } from "@/engine/reduce"
import type { Action, RoomState } from "@/engine/types"

const TICK_MS = 250

type Clock = {
  raf: number
  last: number
  apply: ((advance: number) => void) | null
}

function clock(): Clock {
  if (window.__openbotTeamRoomClock) return window.__openbotTeamRoomClock

  const next: Clock = { raf: 0, last: 0, apply: null }
  const loop = (time: number) => {
    if (next.last === 0) next.last = time
    if (time - next.last >= TICK_MS) {
      next.last = time
      next.apply?.(TICK_MS)
    }
    next.raf = window.requestAnimationFrame(loop)
  }
  next.raf = window.requestAnimationFrame(loop)
  window.__openbotTeamRoomClock = next
  return next
}

export function useRoom() {
  const [state, setState] = useState<RoomState>(() => initialState())

  const dispatch = useCallback((action: Action) => {
    setState((current) => {
      const next = reduce(current, action)
      saveState(next)
      return next
    })
  }, [])

  useEffect(() => {
    const shared = clock()
    shared.apply = (advance) => {
      setState((current) => {
        const next = reduce(current, { type: "TICK", now: current.now + advance })
        saveState(next)
        return next
      })
    }
    return () => {
      if (shared.apply) shared.apply = null
    }
  }, [])

  return { state, dispatch }
}

declare global {
  interface Window {
    __openbotTeamRoomClock?: Clock
  }
}
