import type { ComposedClone } from "./types"

function quote(value: string): string {
  return JSON.stringify(value)
}

export function renderSvml(composed: ComposedClone): string {
  const { clone, slots, anchors } = composed
  const invariants = clone.invariants.map(
    (item) => `  invariant ${item.kind} ${item.id}  # ${item.label}`,
  )
  const variables = slots.map(
    (slot) => `  variable ${slot.kind} ${slot.id} = ${slot.option.id}`,
  )
  const script = clone.script.map((line) => `    | ${line}`)
  const events = anchors.flatMap((anchor) => {
    const block = [`  event @ ${quote(anchor.word)}`]
    if (anchor.speaker) block.push(`    speaker ${quote(anchor.speaker)}`)
    if (anchor.broll) {
      block.push(`    broll ${anchor.broll.id}  # ${anchor.broll.insert}`)
    }
    if (anchor.caption) {
      block.push(`    caption ${anchor.caption.id}  # ${anchor.caption.insert}`)
    }
    if (anchor.effect) {
      block.push(`    effect ${anchor.effect.id}  # ${anchor.effect.insert}`)
    }
    block.push(`    beat ${quote(anchor.beat)}`)
    return block
  })

  return [
    `svml ${clone.id} ${clone.duration} ${clone.aspect}`,
    `  # fixture studio — composed structure, not a live Hypit render`,
    `  title ${quote(clone.title)}`,
    `  format ${clone.format}`,
    "",
    ...invariants,
    "",
    ...variables,
    "",
    "  script",
    ...script,
    "",
    ...events,
    "",
  ].join("\n")
}
