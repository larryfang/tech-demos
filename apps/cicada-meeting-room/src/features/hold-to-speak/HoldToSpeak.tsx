import { useEffect, useRef, useState } from "react"
import { Mic } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SpeakUtterance } from "@/fixtures/types"
import { cn } from "@/lib/utils"

type Phase = "idle" | "holding" | "translating" | "done"

type Props = {
  nextUtterance: SpeakUtterance
  onHoldStart?: () => void
  onInject: () => SpeakUtterance
}

export function HoldToSpeak({ nextUtterance, onHoldStart, onInject }: Props) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [heard, setHeard] = useState<string>("")
  const [translated, setTranslated] = useState<string>("")
  const holdRef = useRef(false)
  const nextRef = useRef(nextUtterance)

  useEffect(() => {
    nextRef.current = nextUtterance
  }, [nextUtterance])

  const start = () => {
    holdRef.current = true
    onHoldStart?.()
    setHeard(nextRef.current.text)
    setTranslated("")
    setPhase("holding")
  }

  const stop = () => {
    if (!holdRef.current) return
    holdRef.current = false
    setPhase("translating")
    const utterance = onInject()
    setHeard(utterance.text)
    window.setTimeout(() => {
      setTranslated(utterance.translation)
      setPhase("done")
      window.setTimeout(() => setPhase("idle"), 1600)
    }, 280)
  }

  return (
    <div
      className="flex min-w-0 flex-1 flex-col gap-2"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="lg"
          data-hold-to-speak
          aria-pressed={phase === "holding"}
          className={cn(
            "h-12 min-w-[220px] touch-none select-none gap-2 px-5",
            phase === "holding" && "bg-lime-400 text-black hover:bg-lime-300",
          )}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.setPointerCapture(event.pointerId)
            start()
          }}
          onPointerUp={(event) => {
            event.preventDefault()
            event.stopPropagation()
            stop()
          }}
          onPointerCancel={stop}
          onClick={(event) => event.preventDefault()}
        >
          <Mic className={cn(phase === "holding" && "live-dot")} />
          {phase === "holding" ? "Listening…" : "Hold to speak"}
        </Button>
        <Badge variant="outline">fixture EN↔ZH</Badge>
      </div>
      <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">
        {phase === "idle" ? (
          "Press and hold to inject a translated line into the room."
        ) : (
          <>
            <span className="text-foreground">You · {heard}</span>
            {translated ? (
              <>
                <span className="mx-2 text-muted-foreground">→</span>
                <span>{translated}</span>
              </>
            ) : phase === "translating" ? (
              <span className="ml-2">translating…</span>
            ) : null}
          </>
        )}
      </p>
    </div>
  )
}
