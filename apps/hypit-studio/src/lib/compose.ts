import type {
  ComposedClone,
  ResolvedAnchor,
  ResolvedSlot,
  SampleClone,
  VariantOption,
  VariantPicks,
} from "./types"

export function defaultPicks(clone: SampleClone): VariantPicks {
  return Object.fromEntries(
    clone.variables.map((slot) => [slot.id, slot.options[0]?.id ?? ""]),
  )
}

function optionFor(clone: SampleClone, picks: VariantPicks, slotId: string): VariantOption | undefined {
  const slot = clone.variables.find((item) => item.id === slotId)
  if (!slot) return undefined
  return slot.options.find((option) => option.id === picks[slotId]) ?? slot.options[0]
}

export function composeClone(clone: SampleClone, picks: VariantPicks): ComposedClone {
  const slots: ResolvedSlot[] = clone.variables.map((slot) => {
    const option = optionFor(clone, picks, slot.id) ?? slot.options[0]
    return { id: slot.id, kind: slot.kind, label: slot.label, option }
  })

  const byKind = Object.fromEntries(
    slots.map((slot) => [slot.kind, slot.option]),
  ) as Partial<Record<ResolvedSlot["kind"], VariantOption>>

  const anchors: ResolvedAnchor[] = clone.anchors.map((anchor) => ({
    id: anchor.id,
    word: anchor.word,
    line: anchor.line,
    speaker: anchor.speaker,
    beat: anchor.beat,
    broll: anchor.slots.includes("broll") ? byKind.broll : undefined,
    caption: anchor.slots.includes("caption") ? byKind.caption : undefined,
    effect: anchor.slots.includes("effect") ? byKind.effect : undefined,
  }))

  return { clone, slots, anchors }
}

export function selectedOption(
  composed: ComposedClone,
  kind: ResolvedSlot["kind"],
): VariantOption | undefined {
  return composed.slots.find((slot) => slot.kind === kind)?.option
}
