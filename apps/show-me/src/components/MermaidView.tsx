import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  // concrete font so mermaid's text measurement matches the rendered SVG
  fontFamily: "Arial, Helvetica, sans-serif",
  // top-level htmlLabels (v11 ignores flowchart.htmlLabels) forces pure SVG
  // tspan labels: foreignObject HTML labels don't scale with the SVG and
  // get clipped at node edges
  htmlLabels: false,
  flowchart: { htmlLabels: false, wrappingWidth: 180, padding: 12 },
})

let renderSeq = 0

export function MermaidView({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    mermaid
      .render(`showme-${++renderSeq}`, source)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [source])

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">
          Mermaid could not render this diagram — showing the source instead.
        </p>
        <pre className="rounded-lg bg-muted p-4 text-xs leading-relaxed overflow-x-auto">
          {source}
        </pre>
      </div>
    )
  }
  return <div ref={ref} className="[&_svg]:mx-auto [&_svg]:max-w-full" />
}
