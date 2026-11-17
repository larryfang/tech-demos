import type { ReferenceClip } from "./types"

export const CLIPS: ReferenceClip[] = [
  {
    id: "launch-teaser",
    title: "Launch teaser",
    logline: "Problem → product → CTA. A four-shot recut for a tool launch.",
    aspect: "16:9",
    width: 960,
    height: 540,
    preview: "/previews/launch-teaser.mp4",
    shots: [
      {
        id: "hook",
        label: "Hook",
        durationMs: 2200,
        layout: "hero",
        transitionIn: "fade",
        transitionMs: 400,
        textSlots: [
          { id: "kicker", role: "kicker", text: "NEW FROM {{brand}}" },
          { id: "headline", role: "headline", text: "Stop guessing." },
          { id: "subhead", role: "subhead", text: "{{tagline}}" },
        ],
        keyframes: [
          { at: 0, opacity: 0, scale: 1.12, y: 6 },
          { at: 0.25, opacity: 1, scale: 1.04, y: 0 },
          { at: 1, opacity: 1, scale: 1, y: 0 },
        ],
      },
      {
        id: "problem",
        label: "Problem",
        durationMs: 2000,
        layout: "split",
        transitionIn: "wipe",
        transitionMs: 360,
        panelGlyph: "×5",
        textSlots: [
          { id: "kicker", role: "kicker", text: "THE MESS" },
          { id: "headline", role: "headline", text: "Five tools. Zero system." },
          { id: "subhead", role: "subhead", text: "Tabs, exports, and a brand that never quite matches." },
        ],
        keyframes: [
          { at: 0, x: 8, opacity: 0.4 },
          { at: 0.3, x: 0, opacity: 1 },
          { at: 1, x: 0, opacity: 1 },
        ],
      },
      {
        id: "product",
        label: "Product",
        durationMs: 2400,
        layout: "stack",
        transitionIn: "slide",
        transitionMs: 400,
        textSlots: [
          { id: "kicker", role: "kicker", text: "{{brand}}" },
          { id: "headline", role: "headline", text: "One timeline. Your brand." },
          { id: "subhead", role: "subhead", text: "Shots, type, and colour — rebuilt as HTML scenes." },
          { id: "caption", role: "caption", text: "Edit the recut. Keep the pacing." },
        ],
        keyframes: [
          { at: 0, y: 16, opacity: 0 },
          { at: 0.35, y: 0, opacity: 1 },
          { at: 1, y: 0, opacity: 1 },
        ],
      },
      {
        id: "cta",
        label: "CTA",
        durationMs: 2000,
        layout: "end-card",
        transitionIn: "zoom",
        transitionMs: 320,
        textSlots: [
          { id: "headline", role: "headline", text: "{{brand}}" },
          { id: "subhead", role: "subhead", text: "{{tagline}}" },
          { id: "cta", role: "cta", text: "Make it yours" },
        ],
        keyframes: [
          { at: 0, scale: 1.16, opacity: 0 },
          { at: 0.28, scale: 1, opacity: 1 },
          { at: 1, scale: 1, opacity: 1 },
        ],
      },
    ],
  },
  {
    id: "brand-film",
    title: "Brand film",
    logline: "Mark, line, close. A short identity piece rebuilt on a timeline.",
    aspect: "16:9",
    width: 960,
    height: 540,
    preview: "/previews/brand-film.mp4",
    shots: [
      {
        id: "mark",
        label: "Mark",
        durationMs: 2400,
        layout: "hero",
        transitionIn: "fade",
        transitionMs: 500,
        textSlots: [
          { id: "kicker", role: "kicker", text: "IDENTITY" },
          { id: "headline", role: "headline", text: "{{brand}}" },
          { id: "subhead", role: "subhead", text: "A mark, rebuilt from geometry." },
        ],
        keyframes: [
          { at: 0, scale: 0.86, opacity: 0, rotate: -8 },
          { at: 0.4, scale: 1.04, opacity: 1, rotate: 0 },
          { at: 1, scale: 1, opacity: 1, rotate: 0 },
        ],
      },
      {
        id: "line",
        label: "Line",
        durationMs: 2200,
        layout: "lower-third",
        transitionIn: "wipe",
        transitionMs: 380,
        textSlots: [
          { id: "kicker", role: "kicker", text: "VOICE" },
          { id: "headline", role: "headline", text: "{{tagline}}" },
          { id: "caption", role: "caption", text: "Keep the pacing. Swap the kit." },
        ],
        keyframes: [
          { at: 0, y: 20, opacity: 0 },
          { at: 0.3, y: 0, opacity: 1 },
          { at: 1, y: 0, opacity: 1 },
        ],
      },
      {
        id: "close",
        label: "Close",
        durationMs: 2000,
        layout: "end-card",
        transitionIn: "fade",
        transitionMs: 360,
        textSlots: [
          { id: "headline", role: "headline", text: "{{brand}}" },
          { id: "subhead", role: "subhead", text: "Designed to be remixed." },
          { id: "cta", role: "cta", text: "Hold the last beat" },
        ],
        keyframes: [
          { at: 0, opacity: 0, scale: 0.96 },
          { at: 0.25, opacity: 1, scale: 1 },
          { at: 1, opacity: 1, scale: 1 },
        ],
      },
    ],
  },
  {
    id: "social-hook",
    title: "Social hook",
    logline: "Vertical four-beat explainer: question, method, proof, end card.",
    aspect: "9:16",
    width: 540,
    height: 960,
    preview: "/previews/social-hook.mp4",
    shots: [
      {
        id: "question",
        label: "Question",
        durationMs: 2000,
        layout: "hero",
        transitionIn: "fade",
        transitionMs: 300,
        textSlots: [
          { id: "kicker", role: "kicker", text: "HOOK" },
          { id: "headline", role: "headline", text: "What if the recut was yours?" },
          { id: "subhead", role: "subhead", text: "A reference clip. Your brand kit." },
        ],
        keyframes: [
          { at: 0, y: 10, opacity: 0 },
          { at: 0.3, y: 0, opacity: 1 },
          { at: 1, y: 0, opacity: 1 },
        ],
      },
      {
        id: "method",
        label: "Method",
        durationMs: 2100,
        layout: "split",
        transitionIn: "slide",
        transitionMs: 340,
        panelGlyph: "01",
        textSlots: [
          { id: "kicker", role: "kicker", text: "SHOT BY SHOT" },
          { id: "headline", role: "headline", text: "Break it down." },
          { id: "subhead", role: "subhead", text: "Layout, type slots, transition, motion." },
        ],
        keyframes: [
          { at: 0, x: -12, opacity: 0.2 },
          { at: 0.28, x: 0, opacity: 1 },
          { at: 1, x: 0, opacity: 1 },
        ],
      },
      {
        id: "proof",
        label: "Proof",
        durationMs: 2200,
        layout: "stack",
        transitionIn: "wipe",
        transitionMs: 320,
        textSlots: [
          { id: "kicker", role: "kicker", text: "THEN APPLY {{brand}}" },
          { id: "headline", role: "headline", text: "Tokens, not templates." },
          { id: "subhead", role: "subhead", text: "Palette, type, and logo land on every scene." },
          { id: "caption", role: "caption", text: "{{tagline}}" },
        ],
        keyframes: [
          { at: 0, y: 18, opacity: 0 },
          { at: 0.32, y: 0, opacity: 1 },
          { at: 1, y: 0, opacity: 1 },
        ],
      },
      {
        id: "end",
        label: "End card",
        durationMs: 1800,
        layout: "end-card",
        transitionIn: "cut",
        transitionMs: 0,
        textSlots: [
          { id: "headline", role: "headline", text: "{{brand}}" },
          { id: "subhead", role: "subhead", text: "{{tagline}}" },
          { id: "cta", role: "cta", text: "Remix this beat" },
        ],
        keyframes: [
          { at: 0, opacity: 1, scale: 1 },
          { at: 1, opacity: 1, scale: 1 },
        ],
      },
    ],
  },
]

export function clipById(id: string): ReferenceClip {
  const clip = CLIPS.find((item) => item.id === id)
  if (!clip) throw new Error(`Unknown clip: ${id}`)
  return clip
}
