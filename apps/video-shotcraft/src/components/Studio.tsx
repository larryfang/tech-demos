import { useMemo, useState } from "react"
import { MotionPreview } from "@/components/MotionPreview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { featuredFirst, filterShots } from "@/lib/filter"
import {
  INK_PRESS,
  STORYBOARD,
  WORKBENCH,
  WORKBENCH_TOTAL_FRAMES,
  beatsForShot,
} from "@/lib/ink-press"
import { CATEGORIES, PRODUCTS, SHOTS, shotById } from "@/lib/shots"
import type { Category, ProductId, StoryboardBeat } from "@/lib/types"
import { cn } from "@/lib/utils"

const TRACKS = ["shot", "caption", "sfx"] as const

export function Studio() {
  const [q, setQ] = useState("")
  const [category, setCategory] = useState<Category | "all">("all")
  const [product, setProduct] = useState<ProductId | "all">("inspect")
  const [shotId, setShotId] = useState(STORYBOARD[0].shotId)
  const [beatId, setBeatId] = useState(STORYBOARD[0].id)

  const shot = shotById(shotId)
  const visible = useMemo(
    () => featuredFirst(filterShots(SHOTS, { q, category, product })),
    [q, category, product],
  )
  const linkedBeats = beatsForShot(shotId)
  const activeBeat =
    STORYBOARD.find((beat) => beat.id === beatId) ?? linkedBeats[0] ?? STORYBOARD[0]

  const selectShot = (id: string, nextBeat?: StoryboardBeat) => {
    setShotId(id)
    const beat = nextBeat ?? beatsForShot(id)[0]
    if (beat) setBeatId(beat.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Video Shotcraft
            </h1>
            <Badge variant="outline">Fixture</Badge>
            <Badge>Mailgun Inspect launch</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Shot recipe cards and CSS motion previews inspired by{" "}
            <a
              className="underline underline-offset-2"
              href="https://github.com/Vincentwei1021/video-shotcraft"
            >
              video-shotcraft
            </a>
            . Happy path is a short Ink Press promo for Mailgun Inspect — 100+
            inbox previews as a Salesforce Agentforce Marketing LWC. Offline
            fixtures, no Remotion farm.
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{INK_PRESS.title}</CardTitle>
            <CardDescription>
              {INK_PRESS.spec} · {INK_PRESS.arc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STORYBOARD.map((beat) => {
                const selected = beat.id === beatId
                return (
                  <button
                    key={beat.id}
                    type="button"
                    onClick={() => selectShot(beat.shotId, beat)}
                    className={cn(
                      "w-[9.5rem] shrink-0 rounded-xl border p-2 text-left transition-colors",
                      selected
                        ? "border-foreground bg-muted ring-1 ring-foreground"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <MotionPreview shot={shotById(beat.shotId)} />
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {String(beat.index).padStart(2, "0")} · {beat.start}
                      </span>
                      <Badge variant="secondary">{beat.track}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-snug">
                      {beat.title}
                    </p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search recipes, energy, tags…"
                className="max-w-sm"
              />
              <span className="text-xs text-muted-foreground">
                {visible.length} / {SHOTS.length} cards
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCTS.map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant={product === item.id ? "default" : "outline"}
                  onClick={() => setProduct(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((item) => (
                <Button
                  key={item.id}
                  size="xs"
                  variant={category === item.id ? "default" : "ghost"}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {visible.map((item) => {
                const selected = item.id === shotId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectShot(item.id)}
                    className={cn(
                      "rounded-xl border p-2 text-left transition-colors",
                      selected
                        ? "border-foreground bg-muted ring-1 ring-foreground"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <MotionPreview shot={item} />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.featured ? <Badge>Inspect</Badge> : null}
                      {item.products.includes("agent-tools") ? (
                        <Badge variant="secondary">Agent Tools</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.summary}
                    </p>
                  </button>
                )
              })}
              {visible.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recipe cards match that filter.
                </p>
              ) : null}
            </div>
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{shot.name}</CardTitle>
                <CardDescription>
                  {shot.duration} · {shot.energy}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MotionPreview shot={shot} />
                <p className="text-sm">{shot.summary}</p>
                <p className="text-xs text-muted-foreground">{shot.use}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{shot.category}</Badge>
                  {shot.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="params">
              <TabsList>
                <TabsTrigger value="params">Recipe params</TabsTrigger>
                <TabsTrigger value="notes">Pitfalls</TabsTrigger>
              </TabsList>
              <TabsContent value="params">
                <Card>
                  <CardContent className="pt-4">
                    <dl className="space-y-3">
                      {shot.params.map((param) => (
                        <div key={param.name}>
                          <dt className="text-xs font-medium">{param.name}</dt>
                          <dd className="text-xs text-muted-foreground">
                            {param.typical}
                          </dd>
                          <dd className="text-xs">{param.feel}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="notes">
                <Card>
                  <CardContent className="space-y-2 pt-4">
                    {shot.pitfalls.map((note) => (
                      <p key={note} className="text-sm">
                        {note}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      SFX: {shot.sfx.join(" · ")}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {linkedBeats.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                On the Ink Press strip: {linkedBeats.map((beat) => beat.title).join(" · ")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Library filler — not on the Inspect storyboard.
              </p>
            )}
          </aside>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Motion Workbench</CardTitle>
            <CardDescription>
              CapCut-style fixture tracks for the Inspect promo. {WORKBENCH_TOTAL_FRAMES}{" "}
              frames · no Remotion export in v1.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TRACKS.map((track) => (
              <div key={track} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {track}
                </span>
                <div className="relative h-7 overflow-hidden rounded-md bg-muted">
                  {WORKBENCH.filter((clip) => clip.track === track).map((clip) => {
                    const left = (clip.from / WORKBENCH_TOTAL_FRAMES) * 100
                    const width = (clip.frames / WORKBENCH_TOTAL_FRAMES) * 100
                    const selected = clip.beatId === activeBeat.id
                    return (
                      <button
                        key={clip.id}
                        type="button"
                        title={clip.label}
                        aria-label={clip.label}
                        onClick={() => {
                          const beat = STORYBOARD.find((item) => item.id === clip.beatId)
                          if (beat) selectShot(beat.shotId, beat)
                        }}
                        className={cn(
                          "absolute top-1 bottom-1 rounded-sm",
                          selected
                            ? "bg-foreground"
                            : track === "shot"
                              ? "bg-foreground/35"
                              : track === "caption"
                                ? "bg-foreground/20"
                                : "bg-foreground/50",
                        )}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(width, track === "sfx" ? 1.2 : 2.4)}%`,
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Playhead on {activeBeat.title} · {activeBeat.caption}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
