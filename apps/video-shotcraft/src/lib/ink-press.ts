import { shotById } from "./shots"
import type { StoryboardBeat, WorkbenchClip } from "./types"

export const INK_PRESS = {
  title: "Ink Press · Mailgun Inspect launch",
  product: "Mailgun Inspect",
  announced: "1 Sep 2026",
  spec: "36.2s · 1920×1080 · 30fps · paper / ink / amber",
  press:
    "https://www.group.sinch.com/media/press-releases-and-news/2026/sinch-announces-mailgun-inspect-for-email-testing-on-salesforces-agentexchange/",
  arc: "Broken inbox QA → Inspect inside Salesforce → 100+ client previews → ship with confidence",
} as const

export const STORYBOARD: StoryboardBeat[] = [
  {
    id: "ip-01",
    index: 1,
    shotId: "brand-ink-open",
    title: "Name the product",
    start: "0.0s",
    duration: "7.3s",
    caption: "Mailgun Inspect — email testing on AgentExchange.",
    sfx: "transition-soft",
    track: "product",
  },
  {
    id: "ip-02",
    index: 2,
    shotId: "paper-title-card",
    title: "Name the pain",
    start: "7.3s",
    duration: "1.8s",
    caption: "Inbox QA is still a *tab jungle*.",
    sfx: "letterpress",
    track: "problem",
  },
  {
    id: "ip-03",
    index: 3,
    shotId: "crane-rise-reveal",
    title: "Show the mess",
    start: "9.1s",
    duration: "5.0s",
    caption: "Litmus tabs. Slack threads. Guesswork before every send.",
    sfx: "camera-rise",
    track: "problem",
  },
  {
    id: "ip-04",
    index: 4,
    shotId: "spotlight-hero-card",
    title: "Inspect in Salesforce",
    start: "14.1s",
    duration: "4.6s",
    caption: "A native LWC on Agentforce Marketing — no tab-out.",
    sfx: "whoosh-big",
    track: "product",
  },
  {
    id: "ip-05",
    index: 5,
    shotId: "deck-deal-flyin",
    title: "Deal the inboxes",
    start: "18.7s",
    duration: "2.6s",
    caption: "Outlook, Gmail, Apple Mail — 100+ clients land in one grid.",
    sfx: "card-deal",
    track: "preview",
  },
  {
    id: "ip-06",
    index: 6,
    shotId: "type-and-filter",
    title: "Filter on the page",
    start: "21.3s",
    duration: "2.5s",
    caption: "Type Outlook. The grid collapses. Open a full-res preview.",
    sfx: "keyboard",
    track: "preview",
  },
  {
    id: "ip-07",
    index: 7,
    shotId: "row-embed",
    title: "Catch the breaks",
    start: "23.8s",
    duration: "2.0s",
    caption: "Clipped CTA. Dark-mode invert. Missing alt.",
    sfx: "embed-tick",
    track: "preview",
  },
  {
    id: "ip-08",
    index: 8,
    shotId: "list-stack-press",
    title: "Count the clients",
    start: "25.8s",
    duration: "3.0s",
    caption: "The stack lands. The counter settles on 100+.",
    sfx: "stack-hit",
    track: "preview",
  },
  {
    id: "ip-09",
    index: 9,
    shotId: "document-typewriter-reveal",
    title: "Read the analysis",
    start: "28.8s",
    duration: "3.7s",
    caption: "HTML/CSS notes write themselves beside the previews.",
    sfx: "keyboard-long",
    track: "preview",
  },
  {
    id: "ip-10",
    index: 10,
    shotId: "outro-group-photo-launch",
    title: "Ship with confidence",
    start: "32.5s",
    duration: "3.7s",
    caption: "Rerun on demand. Launch the campaign.",
    sfx: "riser → impact → sparkle",
    track: "ship",
  },
]

const FPS = 30

function secondsToFrames(label: string) {
  return Math.round(Number.parseFloat(label) * FPS)
}

export const WORKBENCH: WorkbenchClip[] = STORYBOARD.flatMap((beat) => {
  const from = secondsToFrames(beat.start)
  const frames = secondsToFrames(beat.duration)
  return [
    {
      id: `${beat.id}-shot`,
      track: "shot" as const,
      label: shotById(beat.shotId).name,
      from,
      frames,
      beatId: beat.id,
    },
    {
      id: `${beat.id}-cap`,
      track: "caption" as const,
      label: beat.caption.replaceAll("*", ""),
      from,
      frames: Math.max(24, frames - 8),
      beatId: beat.id,
    },
    {
      id: `${beat.id}-sfx`,
      track: "sfx" as const,
      label: beat.sfx,
      from,
      frames: 18,
      beatId: beat.id,
    },
  ]
})

export const WORKBENCH_TOTAL_FRAMES = 1085

export function beatsForShot(shotId: string) {
  return STORYBOARD.filter((beat) => beat.shotId === shotId)
}
