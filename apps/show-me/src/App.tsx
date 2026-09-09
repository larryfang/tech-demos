import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CardView } from "@/components/CardView"
import { MermaidView } from "@/components/MermaidView"
import { EXAMPLES } from "@/lib/examples"
import { generate, type Mode, type Visual } from "@/lib/generator"

const KIND_LABEL = { tree: "Tree", mermaid: "Mermaid", card: "Card" } as const

export default function App() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<Mode>("auto")
  const [visual, setVisual] = useState<Visual | null>(null)
  const [copied, setCopied] = useState(false)

  const run = (text: string, m: Mode) => {
    if (!text.trim()) return
    setVisual(generate(text, m))
    setCopied(false)
  }

  const copySource = async () => {
    if (!visual) return
    await navigator.clipboard.writeText(visual.source)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadHtml = () => {
    if (!visual) return
    const blob = new Blob([visual.source], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "show-me-card.html"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">show-me</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a messy topic or thread — get the smallest clear visual, not a
            wall of text.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* input side */}
          <section className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"Paste messy notes, a thread, steps, an outline…\n\nTry an example below."}
              className="min-h-[320px] resize-y font-mono text-[13px] leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Examples:</span>
              {EXAMPLES.map((ex) => (
                <Button
                  key={ex.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(ex.text)
                    run(ex.text, mode)
                  }}
                >
                  {ex.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v as Mode)
                  if (input.trim()) run(input, v as Mode)
                }}
              >
                <TabsList>
                  <TabsTrigger value="auto">Auto</TabsTrigger>
                  <TabsTrigger value="tree">Tree</TabsTrigger>
                  <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
                  <TabsTrigger value="card">Card</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => run(input, mode)} disabled={!input.trim()}>
                Generate
              </Button>
            </div>
          </section>

          {/* visual side */}
          <section>
            <Card className="min-h-[420px]">
              <CardContent className="pt-6">
                {visual ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{KIND_LABEL[visual.kind]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {visual.reason}
                      </span>
                      <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" onClick={copySource}>
                          {copied
                            ? "Copied!"
                            : visual.kind === "mermaid"
                              ? "Copy mermaid"
                              : visual.kind === "tree"
                                ? "Copy tree"
                                : "Copy HTML"}
                        </Button>
                        {visual.kind === "card" && (
                          <Button variant="outline" size="sm" onClick={downloadHtml}>
                            Download HTML
                          </Button>
                        )}
                      </div>
                    </div>

                    {visual.kind === "mermaid" && (
                      <MermaidView source={visual.source} />
                    )}
                    {visual.kind === "tree" && (
                      <pre className="overflow-x-auto rounded-lg bg-muted p-5 font-mono text-[13px] leading-relaxed">
                        {visual.source}
                      </pre>
                    )}
                    {visual.kind === "card" && (
                      <CardView title={visual.title} points={visual.points} />
                    )}
                  </div>
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                    The visual will render here.
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
