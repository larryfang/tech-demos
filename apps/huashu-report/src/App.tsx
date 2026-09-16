import { useMemo, useState } from "react"
import { ChartFigure } from "@/components/ChartFigure"
import { ReportPreview } from "@/components/ReportPreview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateReport, optionalLlmHint } from "@/lib/generate"
import { reportToMarkdown } from "@/lib/markdown"
import { CHART_MODE_LABEL, PROTOTYPES } from "@/lib/prototypes"
import { SAMPLES } from "@/lib/samples"
import type { PipelineStep, PrototypeId, Report } from "@/lib/types"

const STEPS: { id: PipelineStep; label: string }[] = [
  { id: "outline", label: "1 · Outline" },
  { id: "charts", label: "2 · Chart stubs" },
  { id: "preview", label: "3 · Preview" },
]

export default function App() {
  const [prototype, setPrototype] = useState<PrototypeId>("academic")
  const [topic, setTopic] = useState("Enterprise AI agent deployment")
  const [report, setReport] = useState<Report | null>(null)
  const [step, setStep] = useState<PipelineStep>("outline")
  const [copied, setCopied] = useState(false)
  const llmHint = optionalLlmHint()

  const markdown = useMemo(() => (report ? reportToMarkdown(report) : ""), [report])

  const run = (nextPrototype: PrototypeId, nextTopic: string) => {
    const trimmed = nextTopic.trim()
    if (!trimmed) return
    const next = generateReport(nextPrototype, trimmed)
    setPrototype(nextPrototype)
    setTopic(trimmed)
    setReport(next)
    setStep("outline")
    setCopied(false)
  }

  const advance = () => {
    if (step === "outline") setStep("charts")
    else if (step === "charts") setStep("preview")
  }

  const copyMarkdown = async () => {
    if (!markdown) return
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Huashu Report</h1>
            <Badge variant="outline">offline stub</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Six institutional prototypes, eight chart modes, conclusion-style
            titles. Outline → chart stubs → HTML/Markdown preview. No API key.
          </p>
          {llmHint ? (
            <p className="mt-2 text-xs text-muted-foreground">{llmHint}</p>
          ) : null}
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <section className="space-y-4">
            <div>
              <Label className="mb-2 block">Prototype</Label>
              <div className="grid grid-cols-1 gap-2">
                {PROTOTYPES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrototype(p.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      prototype === p.id
                        ? "border-foreground bg-muted"
                        : "border-border hover:bg-muted/60"
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {p.reader}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enterprise AI agent deployment"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Samples:</span>
              {SAMPLES.map((sample) => (
                <Button
                  key={sample.id}
                  variant="outline"
                  size="sm"
                  onClick={() => run(sample.prototype, sample.topic)}
                >
                  {sample.label}
                </Button>
              ))}
            </div>

            <Button onClick={() => run(prototype, topic)}>Generate report</Button>

            {report ? (
              <div className="flex flex-wrap gap-2">
                {STEPS.map((s) => (
                  <Button
                    key={s.id}
                    size="sm"
                    variant={step === s.id ? "default" : "outline"}
                    onClick={() => setStep(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
                {step !== "preview" ? (
                  <Button size="sm" variant="secondary" onClick={advance}>
                    Continue
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pick a prototype, enter a topic, generate. Then walk outline →
                charts → preview.
              </p>
            )}
          </section>

          <section>
            {!report ? (
              <Card>
                <CardContent className="py-10 text-sm text-muted-foreground">
                  Waiting on a topic. Try <strong>Agents</strong> for the academic
                  happy path.
                </CardContent>
              </Card>
            ) : step === "outline" ? (
              <Card>
                <CardContent className="space-y-3 py-5">
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Outline · {PROTOTYPES.find((p) => p.id === report.prototype)?.name}
                  </p>
                  <h2 className="text-lg font-medium">{report.title}</h2>
                  <p className="text-sm leading-relaxed">{report.oneLiner}</p>
                  <ol className="space-y-3 border-t pt-4">
                    {report.outline.map((item, i) => (
                      <li key={item.id}>
                        <p className="text-sm font-medium">
                          {i + 1}. {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.bullets[0]}
                        </p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ) : step === "charts" ? (
              <Card>
                <CardContent className="space-y-6 py-5">
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Chart stubs · titles write the conclusion
                    {report.prototype === "research" ? " (research notes stay neutral)" : ""}
                  </p>
                  {report.charts.map((chart) => (
                    <div key={chart.id}>
                      <p className="text-xs text-muted-foreground">
                        {CHART_MODE_LABEL[chart.mode]} · {chart.mode}
                      </p>
                      <ChartFigure chart={chart} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Tabs defaultValue="html">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <TabsList>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    </TabsList>
                    <Button variant="outline" size="sm" onClick={copyMarkdown}>
                      {copied ? "Copied" : "Copy Markdown"}
                    </Button>
                  </div>
                  <TabsContent value="html" className="mt-3">
                    <ReportPreview report={report} />
                  </TabsContent>
                  <TabsContent value="markdown" className="mt-3">
                    <pre className="overflow-auto rounded-lg bg-muted p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
                      {markdown}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
