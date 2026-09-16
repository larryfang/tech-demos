import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { composeClone, defaultPicks, selectedOption } from "@/lib/compose"
import { CLONES, cloneById } from "@/lib/fixtures"
import { renderSvml } from "@/lib/svml"
import type { CloneId, ResolvedAnchor, VariantPicks } from "@/lib/types"

export function Studio() {
  const [cloneId, setCloneId] = useState<CloneId>("ranking-goat")
  const [picksByClone, setPicksByClone] = useState<Record<string, VariantPicks>>(
    () => Object.fromEntries(CLONES.map((clone) => [clone.id, defaultPicks(clone)])),
  )
  const [anchorId, setAnchorId] = useState(CLONES[0].anchors[0]?.id ?? "")

  const clone = cloneById(cloneId)
  const picks = picksByClone[cloneId] ?? defaultPicks(clone)
  const composed = useMemo(() => composeClone(clone, picks), [clone, picks])
  const svml = useMemo(() => renderSvml(composed), [composed])
  const active =
    composed.anchors.find((anchor) => anchor.id === anchorId) ?? composed.anchors[0]

  const selectClone = (id: CloneId) => {
    const next = cloneById(id)
    setCloneId(id)
    setAnchorId(next.anchors[0]?.id ?? "")
  }

  const pick = (slotId: string, optionId: string) => {
    setPicksByClone((current) => ({
      ...current,
      [cloneId]: { ...picks, [slotId]: optionId },
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Hypit Studio</h1>
            <Badge variant="outline">Fixture</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Clone a viral short into an editable workflow: locked invariants,
            replaceable B-roll / caption / effect slots, and word-anchored
            events. Offline fixtures — no Chromium render farm, no paid APIs.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,22rem)]">
          <section className="space-y-4">
            <div>
              <Label className="mb-2 block">Sample clones</Label>
              <div className="grid gap-2">
                {CLONES.map((item) => {
                  const selected = item.id === cloneId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectClone(item.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-foreground bg-muted"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{item.title}</span>
                        <Badge variant="secondary">{item.format}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.duration} · {item.hook}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Variant swap</CardTitle>
                <CardDescription>
                  Pick an alternate B-roll, caption, or effect. Invariants stay
                  locked.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clone.variables.map((slot) => (
                  <div key={slot.id}>
                    <Label className="mb-2 block">{slot.label}</Label>
                    <div className="flex flex-wrap gap-2">
                      {slot.options.map((option) => {
                        const selected = picks[slot.id] === option.id
                        return (
                          <Button
                            key={option.id}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => pick(slot.id, option.id)}
                          >
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {slot.options.find((option) => option.id === picks[slot.id])
                        ?.summary}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4 min-w-0">
            <Tabs defaultValue="workflow">
              <TabsList>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="svml">SVML preview</TabsTrigger>
              </TabsList>
              <TabsContent value="workflow" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Invariants</CardTitle>
                    <CardDescription>
                      Structure that survives a variant. Do not swap these.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clone.invariants.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <Badge variant="outline">{item.kind}</Badge>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event anchors</CardTitle>
                    <CardDescription>
                      Words, not seconds. Click a beat to preview the insert.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {composed.anchors.map((anchor) => {
                      const selected = anchor.id === active?.id
                      return (
                        <button
                          key={anchor.id}
                          type="button"
                          onClick={() => setAnchorId(anchor.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                            selected
                              ? "border-foreground bg-muted"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm">
                              @{anchor.word}
                            </span>
                            {anchor.speaker ? (
                              <Badge variant="secondary">{anchor.speaker}</Badge>
                            ) : null}
                            {anchor.broll ? (
                              <Badge variant="outline">B-roll</Badge>
                            ) : null}
                            {anchor.caption ? (
                              <Badge variant="outline">caption</Badge>
                            ) : null}
                            {anchor.effect ? (
                              <Badge variant="outline">effect</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {anchor.line}
                          </p>
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="svml">
                <Card>
                  <CardHeader>
                    <CardTitle>SVML-ish source</CardTitle>
                    <CardDescription>
                      Read-only composed structure. Real Hypit would compile
                      this in headless Chromium.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-[36rem] overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-5">
                      {svml}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          <aside className="space-y-4">
            <Storyboard
              format={clone.format}
              title={clone.title}
              duration={clone.duration}
              host={clone.format === "ranking" ? "Host, desk right" : "Split A / B"}
              anchor={active}
              broll={selectedOption(composed, "broll")?.label}
              caption={selectedOption(composed, "caption")?.label}
              effect={selectedOption(composed, "effect")?.label}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

function Storyboard({
  format,
  title,
  duration,
  host,
  anchor,
  broll,
  caption,
  effect,
}: {
  format: "ranking" | "podcast"
  title: string
  duration: string
  host: string
  anchor?: ResolvedAnchor
  broll?: string
  caption?: string
  effect?: string
}) {
  const word = anchor?.word ?? "—"
  const line = anchor?.line ?? ""
  const insert = anchor?.broll?.insert ?? "no B-roll on this beat"
  const captionInsert = anchor?.caption?.insert ?? caption ?? "caption"
  const effectInsert = anchor?.effect?.insert ?? "none"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storyboard</CardTitle>
        <CardDescription>
          {title} · {duration} · fixture stills, not a render
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto w-[220px] rounded-[1.6rem] border bg-neutral-950 p-2 text-neutral-50 shadow-sm">
          <div className="relative overflow-hidden rounded-[1.2rem] aspect-[9/16] bg-neutral-900">
            {format === "podcast" ? (
              <div className="absolute inset-0 grid grid-rows-2">
                <div className="border-b border-white/10 bg-neutral-800 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                    Host B
                  </p>
                  <p className="mt-6 text-xs text-neutral-300">left chair</p>
                </div>
                <div className="bg-neutral-700 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-300">
                    Host A
                  </p>
                  <p className="mt-6 text-xs text-neutral-200">right chair</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#1f2937,#0a0a0a)]">
                <div className="absolute left-3 top-10 h-16 w-16 rounded-lg bg-sky-900/80 ring-1 ring-sky-400/40">
                  <span className="block p-1 text-[9px] leading-tight text-sky-100">
                    icon slot
                  </span>
                </div>
                <div className="absolute right-3 top-16 h-36 w-20 rounded-lg bg-neutral-700 ring-1 ring-white/10">
                  <span className="block p-2 text-[9px] text-neutral-200">
                    {host}
                  </span>
                </div>
              </div>
            )}

            {anchor?.broll ? (
              <div className="absolute left-3 right-3 top-[42%] rounded-md bg-amber-200 px-2 py-1.5 text-neutral-900 shadow">
                <p className="text-[9px] font-medium uppercase tracking-wide">
                  B-roll · {broll}
                </p>
                <p className="text-[10px] leading-snug">{insert}</p>
              </div>
            ) : null}

            <div className="absolute inset-x-2 bottom-10">
              <div
                className={`rounded-md px-2 py-1 text-center text-[11px] font-medium leading-snug ${
                  captionInsert === "sticker-punch"
                    ? "bg-rose-400 text-neutral-950"
                    : captionInsert === "outline-stack"
                      ? "border border-white bg-transparent text-white"
                      : "bg-yellow-300 text-neutral-950"
                }`}
              >
                {highlightWord(line, word)}
              </div>
              <p className="mt-1 text-center text-[9px] text-neutral-400">
                {caption} · @{word}
              </p>
            </div>

            {anchor?.effect ? (
              <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-medium text-neutral-900">
                {effectInsert}
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{anchor?.beat}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Effect on this beat: {anchor?.effect ? effect : "none"}
        </p>
      </CardContent>
    </Card>
  )
}

function highlightWord(line: string, word: string) {
  if (!line || !word) return line
  const index = line.toLowerCase().indexOf(word.toLowerCase())
  if (index < 0) return line
  return (
    <>
      {line.slice(0, index)}
      <span className="underline decoration-2 underline-offset-2">
        {line.slice(index, index + word.length)}
      </span>
      {line.slice(index + word.length)}
    </>
  )
}
