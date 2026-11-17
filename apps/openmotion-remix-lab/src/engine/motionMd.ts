import type { BrandKit, ReferenceClip } from "../fixtures/types"
import type { HtmlScene } from "./remix"

function clock(ms: number): string {
  const total = Math.max(0, ms) / 1000
  const minutes = Math.floor(total / 60)
  const seconds = total - minutes * 60
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`
}

export function renderMotionMd(
  clip: ReferenceClip,
  kit: BrandKit,
  scenes: HtmlScene[],
): string {
  const lines: string[] = [
    `# Motion notes — ${clip.title} × ${kit.name}`,
    "",
    `Reference pacing from **${clip.title}**. Brand tokens from **${kit.name}**.`,
    `This is a fixture remix, not a model-analysed recut.`,
    "",
    "## Brand kit",
    `- Name: ${kit.name}`,
    `- Tagline: ${kit.tagline}`,
    `- Heading: ${kit.fonts.heading}`,
    `- Body: ${kit.fonts.body}`,
    `- Palette: primary ${kit.palette.primary}, accent ${kit.palette.accent}, background ${kit.palette.background}, foreground ${kit.palette.foreground}`,
    "",
    "## Shots",
  ]

  for (const scene of scenes) {
    const texts = scene.slots
      .map((slot) => `  - ${slot.role}: ${slot.applied}`)
      .join("\n")
    lines.push(
      `${scene.index + 1}. **${scene.label}** (${clock(scene.startMs)}–${clock(scene.endMs)}, ${(scene.durationMs / 1000).toFixed(2)}s) — ${scene.layout}, ${scene.transitionIn}${scene.overlapMs ? ` overlap ${scene.overlapMs}ms` : ""}`,
    )
    if (texts) lines.push(texts)
  }

  lines.push(
    "",
    "## Notes",
    `- Hold the reference's shot order; swap copy and colour, not the spine.`,
    `- Transitions overlap the previous tail; a cut has zero overlap.`,
    `- End on the brand mark. Do not fade to black after the CTA.`,
    "",
  )
  return lines.join("\n")
}
