import { useState } from "react"
import { GlanceChart } from "@/components/GlanceChart"
import { LupiBasicsChart } from "@/components/LupiBasicsChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { parseInput, type ParseResult } from "@/lib/parse"
import { SAMPLES } from "@/lib/samples"
import { paletteOf, type PaletteName } from "@/lib/tokens"

type StyleName = "glance" | "basics"

export default function App() {
  const [input, setInput] = useState(SAMPLES[0].text)
  const [style, setStyle] = useState<StyleName>("glance")
  const [preset, setPreset] = useState<PaletteName>("mono")
  const [result, setResult] = useState<ParseResult>(() => parseInput(SAMPLES[0].text))
  const palette = paletteOf(preset)

  const render = (text: string) => {
    setResult(parseInput(text))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Lieflat Charts</h1>
            <Badge variant="outline">offline</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Paste CSV or JSON, pick Glance or Lupi Basics, toggle Mono / Porcelain.
            One interactive chart, no API key.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder={"plan,mrr\nEnterprise,184\nGrowth,96"}
              className="min-h-[320px] resize-y font-mono text-[13px] leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Samples:</span>
              {SAMPLES.map((sample) => (
                <Button
                  key={sample.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(sample.text)
                    render(sample.text)
                  }}
                >
                  {sample.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Tabs
                value={style}
                onValueChange={(value) => setStyle(value as StyleName)}
              >
                <TabsList>
                  <TabsTrigger value="glance">Glance</TabsTrigger>
                  <TabsTrigger value="basics">Lupi Basics</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs
                value={preset}
                onValueChange={(value) => setPreset(value as PaletteName)}
              >
                <TabsList>
                  <TabsTrigger value="mono">Mono</TabsTrigger>
                  <TabsTrigger value="porcelain">Porcelain</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => render(input)} disabled={!input.trim()}>
                Render
              </Button>
            </div>
          </section>

          <section>
            <Card className="min-h-[520px] overflow-hidden">
              <CardContent className="pt-6">
                {result.ok ? (
                  <div
                    className="rounded-2xl px-5 py-5"
                    style={{ background: palette.paper }}
                  >
                    {style === "glance" ? (
                      <GlanceChart dataset={result.dataset} palette={palette} />
                    ) : (
                      <LupiBasicsChart dataset={result.dataset} palette={palette} />
                    )}
                  </div>
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                    {result.error}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
