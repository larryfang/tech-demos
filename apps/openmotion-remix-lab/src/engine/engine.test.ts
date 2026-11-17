import { describe, expect, test } from "bun:test"
import { CLIPS } from "../fixtures/clips"
import { BRAND_KITS } from "../fixtures/kits"
import { interpolateKeyframes } from "./interpolate"
import { renderMotionMd } from "./motionMd"
import {
  applyShotEdits,
  buildRemix,
  frameAtTime,
} from "./remix"
import {
  buildReplayScript,
  replayProgress,
  REPLAY_STEP_MS,
} from "./replay"
import { applyTextTokens } from "./tokens"
import { durationSum, layoutTimeline, overlapMs, totalDurationMs } from "./timeline"

const launch = CLIPS[0]
const social = CLIPS[2]
const northstar = BRAND_KITS[0]
const volt = BRAND_KITS[1]

describe("brand-token application", () => {
  test("replaces {{brand}} and {{tagline}} in copy", () => {
    expect(applyTextTokens("From {{brand}} — {{tagline}}", northstar)).toBe(
      "From Northstar Labs — Quiet tools for loud ideas.",
    )
  })

  test("remix HTML includes kit name, tagline, palette and heading font", () => {
    const remix = buildRemix(launch, northstar)
    const html = remix.scenes.map((scene) => scene.html).join("\n")
    expect(html).toContain("Northstar Labs")
    expect(html).toContain("Quiet tools for loud ideas.")
    expect(html).toContain(northstar.palette.primary)
    expect(html).toContain(northstar.palette.background)
    expect(html).toContain("Iowan Old Style")
    expect(html).not.toContain("{{brand}}")
    expect(html).not.toContain("{{tagline}}")
  })

  test("swapping kits retints scenes without changing shot count", () => {
    const a = buildRemix(launch, northstar)
    const b = buildRemix(launch, volt)
    expect(b.scenes).toHaveLength(a.scenes.length)
    expect(b.scenes[0].html).toContain(volt.palette.accent)
    expect(b.scenes[0].html).not.toContain(northstar.palette.primary)
    expect(b.kitName).toBe("Volt & Co")
  })
})

describe("timeline maths", () => {
  test("first scene starts at 0 and last end is the total", () => {
    const remix = buildRemix(launch, northstar)
    expect(remix.scenes[0].startMs).toBe(0)
    expect(remix.scenes.at(-1)?.endMs).toBe(remix.totalDurationMs)
    expect(remix.totalDurationMs).toBeGreaterThan(0)
  })

  test("cut transition has zero overlap", () => {
    expect(overlapMs(1800, "cut", 0, 1800)).toBe(0)
    const remix = buildRemix(social, northstar)
    const endCard = remix.scenes.find((scene) => scene.id === "end")
    expect(endCard?.transitionIn).toBe("cut")
    expect(endCard?.overlapMs).toBe(0)
  })

  test("transition overlap shortens total vs the sum of durations", () => {
    const laid = layoutTimeline(launch.shots)
    const overlapTotal = laid.reduce((sum, item) => sum + item.overlapMs, 0)
    expect(overlapTotal).toBeGreaterThan(0)
    expect(totalDurationMs(laid)).toBe(durationSum(launch.shots) - overlapTotal)
    const fadeOverlap = overlapMs(2200, "fade", 400, 2000)
    expect(fadeOverlap).toBe(400)
  })

  test("frame-at-time finds the active scene and overlap pair", () => {
    const remix = buildRemix(launch, northstar)
    const first = frameAtTime(remix, 200)
    expect(first.layers.map((layer) => layer.scene.id)).toEqual(["hook"])

    const second = remix.scenes[1]
    const midOverlap = second.startMs + Math.min(40, second.overlapMs / 2)
    const overlapping = frameAtTime(remix, midOverlap)
    expect(overlapping.layers.map((layer) => layer.scene.id)).toEqual(["hook", "problem"])

    const late = frameAtTime(remix, remix.totalDurationMs)
    expect(late.layers.at(-1)?.scene.id).toBe("cta")
  })
})

describe("edits changing duration", () => {
  test("lengthening the first shot pushes later starts and the total", () => {
    const base = buildRemix(launch, northstar)
    const edited = buildRemix(launch, northstar, { hook: { durationMs: 4000 } })
    expect(edited.scenes[0].durationMs).toBe(4000)
    expect(edited.scenes[1].startMs).toBeGreaterThan(base.scenes[1].startMs)
    expect(edited.totalDurationMs).toBeGreaterThan(base.totalDurationMs)
    expect(edited.scenes[1].startMs).toBe(
      edited.scenes[0].endMs - edited.scenes[1].overlapMs,
    )
  })

  test("resizing the last shot leaves previous starts unchanged", () => {
    const base = buildRemix(launch, northstar)
    const edited = buildRemix(launch, northstar, { cta: { durationMs: 3600 } })
    expect(edited.scenes[0].startMs).toBe(base.scenes[0].startMs)
    expect(edited.scenes[1].startMs).toBe(base.scenes[1].startMs)
    expect(edited.scenes[2].startMs).toBe(base.scenes[2].startMs)
    expect(edited.scenes[3].durationMs).toBe(3600)
    expect(edited.totalDurationMs).toBeGreaterThan(base.totalDurationMs)
  })

  test("applyShotEdits writes through text and duration", () => {
    const next = applyShotEdits(launch, {
      hook: { durationMs: 1500, text: { headline: "Hold the room." } },
    })
    expect(next.shots[0].durationMs).toBe(1500)
    expect(next.shots[0].textSlots.find((slot) => slot.id === "headline")?.text).toBe(
      "Hold the room.",
    )
  })
})

describe("replay-script ordering", () => {
  test("walks boot, per-shot analyse/layout/transition, then brand notes ready", () => {
    const script = buildReplayScript(launch)
    expect(script.map((step) => step.kind)).toEqual([
      "boot",
      "analyse",
      "layout",
      "transition",
      "analyse",
      "layout",
      "transition",
      "analyse",
      "layout",
      "transition",
      "analyse",
      "layout",
      "transition",
      "brand",
      "notes",
      "ready",
    ])
    expect(script.filter((step) => step.kind === "analyse").map((step) => step.message)).toEqual([
      "Analysing shot 1/4 — Hook",
      "Analysing shot 2/4 — Problem",
      "Analysing shot 3/4 — Product",
      "Analysing shot 4/4 — CTA",
    ])
  })

  test("progress reveals shots in order and is ready on the last step", () => {
    const script = buildReplayScript(launch)
    const boot = replayProgress(script, 0)
    expect(boot.current.kind).toBe("boot")
    expect(boot.revealedShots).toBe(0)
    expect(boot.ready).toBe(false)

    const firstShot = replayProgress(script, REPLAY_STEP_MS)
    expect(firstShot.current.message).toBe("Analysing shot 1/4 — Hook")
    expect(firstShot.revealedShots).toBe(1)

    const mid = replayProgress(script, REPLAY_STEP_MS * 7)
    expect(mid.revealedShots).toBe(3)

    const done = replayProgress(script, REPLAY_STEP_MS * (script.length - 1))
    expect(done.ready).toBe(true)
    expect(done.current.kind).toBe("ready")
    expect(done.revealedShots).toBe(4)
  })
})

describe("keyframes and motion notes", () => {
  test("interpolates scale at the ends and midpoint of a two-keyframe span", () => {
    const frames = [
      { at: 0, scale: 1, opacity: 0 },
      { at: 1, scale: 2, opacity: 1 },
    ]
    expect(interpolateKeyframes(frames, 0).scale).toBe(1)
    expect(interpolateKeyframes(frames, 1).scale).toBe(2)
    expect(interpolateKeyframes(frames, 0.5).scale).toBeCloseTo(1.5)
    expect(interpolateKeyframes(frames, 0.5).opacity).toBeCloseTo(0.5)
  })

  test("Motion.md names the kit, clip, and shot labels", () => {
    const remix = buildRemix(launch, volt)
    expect(remix.motionMd).toContain("Launch teaser × Volt & Co")
    expect(remix.motionMd).toContain("**Hook**")
    expect(remix.motionMd).toContain("Volt & Co")
    expect(renderMotionMd(launch, volt, remix.scenes)).toContain("Ship the spark.")
  })
})
