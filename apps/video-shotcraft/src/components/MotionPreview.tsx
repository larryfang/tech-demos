import {
  AgentToolsFrame,
  AnalysisFrame,
  BeforeAfterFrame,
  ClientGridFrame,
  ClientStackFrame,
  FilterFrame,
  GenericCardsFrame,
  GlitchFrame,
  IssueRowsFrame,
  ProblemDeskFrame,
  SalesforceLwcFrame,
  ShipFrame,
  TitleCardFrame,
  WaterfallFrame,
  WordmarkFrame,
} from "@/components/ProductFrames"
import type { Shot } from "@/lib/types"

function frameFor(shot: Shot) {
  switch (shot.id) {
    case "brand-ink-open":
      return <WordmarkFrame />
    case "paper-title-card":
      return (
        <TitleCardFrame line="Inbox QA is still a" accent="tab jungle." />
      )
    case "crane-rise-reveal":
      return <ProblemDeskFrame />
    case "spotlight-hero-card":
      return <SalesforceLwcFrame />
    case "deck-deal-flyin":
      return <ClientGridFrame />
    case "type-and-filter":
      return <FilterFrame />
    case "row-embed":
      return <IssueRowsFrame />
    case "list-stack-press":
      return <ClientStackFrame />
    case "document-typewriter-reveal":
      return <AnalysisFrame />
    case "outro-group-photo-launch":
      return <ShipFrame />
    case "before-after-slider-scrub":
      return <BeforeAfterFrame />
    case "page-waterfall-wall":
      return <WaterfallFrame />
    case "command-palette-summon":
    case "letterspace-materialize":
      return <AgentToolsFrame />
    case "glitch-cycle":
      return <GlitchFrame />
    default:
      return <GenericCardsFrame label={shot.name} />
  }
}

export function MotionPreview({
  shot,
  className,
}: {
  shot: Shot
  className?: string
}) {
  return (
    <div
      className={className}
      data-shot={shot.id}
      style={{ aspectRatio: "16 / 9" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-lg ring-1 ring-foreground/10">
        {frameFor(shot)}
      </div>
    </div>
  )
}
