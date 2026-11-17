import type { BrandKit, BrandPalette, Shot, TextSlot } from "../fixtures/types"
import { applyTextTokens, tokenCss } from "./tokens"

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function slot(slots: Array<TextSlot & { applied: string }>, role: TextSlot["role"]): string {
  return slots.find((item) => item.role === role)?.applied ?? ""
}

export function applySlots(shot: Shot, kit: BrandKit): Array<TextSlot & { applied: string }> {
  return shot.textSlots.map((item) => ({
    ...item,
    applied: applyTextTokens(item.text, kit),
  }))
}

export function sceneMarkup(
  shot: Shot,
  kit: BrandKit,
  palette: BrandPalette,
  slots: Array<TextSlot & { applied: string }>,
): string {
  const css = tokenCss(palette, kit)
  const headline = esc(slot(slots, "headline"))
  const subhead = esc(slot(slots, "subhead"))
  const kicker = esc(slot(slots, "kicker"))
  const caption = esc(slot(slots, "caption"))
  const cta = esc(slot(slots, "cta"))
  const glyph = esc(shot.panelGlyph ?? kit.name.slice(0, 1))

  if (shot.layout === "split") {
    return `<section class="om-scene om-split" style="${css}" data-layout="split">
  <div class="om-copy">
    ${kicker ? `<div class="om-kicker">${kicker}</div>` : ""}
    <h1 class="om-headline">${headline}</h1>
    <p class="om-sub">${subhead}</p>
  </div>
  <div class="om-panel">${glyph}</div>
</section>`
  }

  if (shot.layout === "stack") {
    const cards = [
      headline && `<div class="om-card"><h1 class="om-headline">${headline}</h1></div>`,
      subhead && `<div class="om-card"><p class="om-sub">${subhead}</p></div>`,
      caption && `<div class="om-card"><p class="om-sub">${caption}</p></div>`,
    ]
      .filter(Boolean)
      .join("\n")
    return `<section class="om-scene om-stack" style="${css}" data-layout="stack">
  ${kicker ? `<div class="om-kicker">${kicker}</div>` : ""}
  ${cards}
</section>`
  }

  if (shot.layout === "lower-third") {
    return `<section class="om-scene om-lower" style="${css}" data-layout="lower-third">
  <div class="om-wash"></div>
  <div class="om-word">${headline}</div>
  <div class="om-bar">
    ${kicker ? `<div class="om-kicker">${kicker}</div>` : ""}
    <h2 class="om-headline">${headline}</h2>
    ${caption ? `<p class="om-sub">${esc(caption)}</p>` : subhead ? `<p class="om-sub">${subhead}</p>` : ""}
  </div>
</section>`
  }

  if (shot.layout === "end-card") {
    return `<section class="om-scene om-end" style="${css}" data-layout="end-card">
  <div class="om-logo">${kit.logoSvg}</div>
  <h1 class="om-headline">${headline}</h1>
  <p class="om-sub">${subhead}</p>
  ${cta ? `<div class="om-cta">${cta}</div>` : ""}
</section>`
  }

  return `<section class="om-scene om-hero" style="${css}" data-layout="hero">
  <div class="om-logo">${kit.logoSvg}</div>
  ${kicker ? `<div class="om-kicker">${kicker}</div>` : ""}
  <h1 class="om-headline">${headline}</h1>
  <p class="om-sub">${subhead}</p>
</section>`
}
