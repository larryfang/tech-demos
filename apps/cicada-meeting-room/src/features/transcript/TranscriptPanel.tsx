import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatClock, speakerById } from "@/engine/engine"
import type { MeetingFixture, TranscriptLine } from "@/fixtures/types"
import { cn } from "@/lib/utils"

const SPEAKER_DOT: Record<string, string> = {
  lena: "bg-amber-400",
  zhou: "bg-teal-400",
  alex: "bg-sky-400",
  lin: "bg-rose-400",
  you: "bg-lime-400",
}

type Props = {
  fixture: MeetingFixture
  lines: TranscriptLine[]
}

export function TranscriptPanel({ fixture, lines }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const lastId = lines.at(-1)?.id

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [lines.length, lastId])

  return (
    <Card className="flex min-h-0 flex-1 flex-col py-0">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm tracking-wide uppercase">
            Live transcript
          </CardTitle>
          <Badge variant="outline">{lines.length} lines</Badge>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-0">
        <ScrollArea className="h-full">
          <ol className="space-y-3 px-4 py-3">
            {lines.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                Press Run sample meeting to start the clock.
              </li>
            ) : null}
            {lines.map((line) => {
              const speaker = speakerById(fixture, line.speakerId)
              const primary =
                line.lang === "zh" ? speaker?.nameZh : speaker?.name
              const role = line.lang === "zh" ? speaker?.roleZh : speaker?.role
              return (
                <li
                  key={line.id}
                  data-line-id={line.id}
                  className={cn(
                    "rounded-lg px-3 py-2 ring-1 ring-foreground/8",
                    line.injected && "bg-lime-400/8 ring-lime-400/30",
                  )}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        SPEAKER_DOT[line.speakerId] ?? "bg-muted-foreground",
                      )}
                    />
                    <span className="font-medium text-foreground">
                      {primary ?? line.speakerId}
                    </span>
                    {role ? <span>· {role}</span> : null}
                    <span className="font-mono tabular-nums">
                      {formatClock(line.tMs)}
                    </span>
                    <Badge variant="secondary" className="uppercase">
                      {line.lang}
                    </Badge>
                    {line.injected ? (
                      <Badge variant="outline">hold-to-speak</Badge>
                    ) : null}
                  </div>
                  <p className="text-[15px] leading-relaxed">{line.text}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {line.translation}
                  </p>
                </li>
              )
            })}
            <div ref={endRef} />
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
