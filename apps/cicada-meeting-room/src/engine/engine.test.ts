import { describe, expect, test } from "bun:test"
import { HARBOR_BOOKS } from "../fixtures/harbor-books"
import { NOTE_SECTION_ORDER } from "../fixtures/types"
import {
  formatClock,
  injectHoldToSpeak,
  pause,
  peekUtterance,
  play,
  runSample,
  scrub,
  seedState,
  tick,
  unlockedNotes,
  visibleLines,
} from "./engine"

describe("timeline advance", () => {
  test("tick moves the clock only while playing", () => {
    const paused = tick(seedState(), 5_000, HARBOR_BOOKS.durationMs)
    expect(paused.clockMs).toBe(0)
    expect(paused.playing).toBe(false)

    const playing = tick(play(seedState(), HARBOR_BOOKS.durationMs), 5_000, HARBOR_BOOKS.durationMs)
    expect(playing.clockMs).toBe(5_000)
    expect(playing.playing).toBe(true)
  })

  test("tick stops at the fixture duration", () => {
    const started = play(seedState(), HARBOR_BOOKS.durationMs)
    const ended = tick(started, HARBOR_BOOKS.durationMs + 2_000, HARBOR_BOOKS.durationMs)
    expect(ended.clockMs).toBe(HARBOR_BOOKS.durationMs)
    expect(ended.playing).toBe(false)
    expect(HARBOR_BOOKS.durationMs).toBeGreaterThanOrEqual(45_000)
    expect(HARBOR_BOOKS.durationMs).toBeLessThanOrEqual(90_000)
  })

  test("visible transcript grows as the clock advances", () => {
    expect(visibleLines(0, HARBOR_BOOKS, []).map((l) => l.id)).toEqual(["l1"])
    expect(visibleLines(13_000, HARBOR_BOOKS, []).map((l) => l.id)).toEqual([
      "l1",
      "l2",
      "l3",
    ])
    expect(visibleLines(HARBOR_BOOKS.durationMs, HARBOR_BOOKS, [])).toHaveLength(
      HARBOR_BOOKS.lines.length,
    )
  })
})

describe("notes unlock order", () => {
  test("sections stay locked at t=0", () => {
    expect(unlockedNotes(0, HARBOR_BOOKS)).toEqual([])
  })

  test("unlocks Summary → Topics → Conclusions → To-dos → Glossary", () => {
    const unlocks = HARBOR_BOOKS.notes
      .slice()
      .sort((a, b) => a.unlockAtMs - b.unlockAtMs)
      .map((note) => note.id)
    expect(unlocks).toEqual([...NOTE_SECTION_ORDER])

    const idsAt = (ms: number) => unlockedNotes(ms, HARBOR_BOOKS).map((n) => n.id)
    expect(idsAt(12_000)).toEqual(["summary"])
    expect(idsAt(25_000)).toEqual(["summary", "topics"])
    expect(idsAt(56_000)).toEqual(["summary", "topics", "conclusions"])
    expect(idsAt(64_000)).toEqual(["summary", "topics", "conclusions", "todos"])
    expect(idsAt(72_000)).toEqual([...NOTE_SECTION_ORDER])
  })

  test("does not dump every section at once", () => {
    const mid = unlockedNotes(30_000, HARBOR_BOOKS)
    expect(mid.length).toBeGreaterThan(0)
    expect(mid.length).toBeLessThan(NOTE_SECTION_ORDER.length)
  })
})

describe("play / pause / scrub", () => {
  test("play and pause toggle the clock", () => {
    const playing = play(seedState(), HARBOR_BOOKS.durationMs)
    expect(playing.playing).toBe(true)
    expect(pause(playing).playing).toBe(false)
  })

  test("play at the end rewinds then starts", () => {
    const atEnd = { ...seedState(), clockMs: HARBOR_BOOKS.durationMs }
    const again = play(atEnd, HARBOR_BOOKS.durationMs)
    expect(again.clockMs).toBe(0)
    expect(again.playing).toBe(true)
  })

  test("scrub clamps to the fixture window", () => {
    const mid = scrub(seedState(), 40_000, HARBOR_BOOKS.durationMs)
    expect(mid.clockMs).toBe(40_000)
    expect(visibleLines(mid.clockMs, HARBOR_BOOKS, []).length).toBeGreaterThan(3)

    expect(scrub(mid, -20, HARBOR_BOOKS.durationMs).clockMs).toBe(0)
    expect(scrub(mid, 999_000, HARBOR_BOOKS.durationMs).clockMs).toBe(
      HARBOR_BOOKS.durationMs,
    )
  })

  test("run sample seeds a playing meeting from zero", () => {
    const sample = runSample()
    expect(sample).toEqual({ ...seedState(), playing: true })
  })

  test("formatClock is mm:ss", () => {
    expect(formatClock(0)).toBe("0:00")
    expect(formatClock(75_000)).toBe("1:15")
  })
})

describe("hold-to-speak inject", () => {
  test("injects a translated You line into the transcript", () => {
    const at = scrub(play(seedState(), HARBOR_BOOKS.durationMs), 18_000, HARBOR_BOOKS.durationMs)
    const peeked = peekUtterance(at, HARBOR_BOOKS)
    const { state, line } = injectHoldToSpeak(at, HARBOR_BOOKS)

    expect(line.speakerId).toBe("you")
    expect(line.injected).toBe(true)
    expect(line.tMs).toBe(18_000)
    expect(line.text).toBe(peeked.text)
    expect(line.translation).toBe(peeked.translation)
    expect(line.translation.length).toBeGreaterThan(0)
    expect(line.text).not.toBe(line.translation)

    const shown = visibleLines(state.clockMs, HARBOR_BOOKS, state.injected)
    expect(shown.map((l) => l.id)).toContain(line.id)
    expect(shown.some((l) => l.injected && l.translation === peeked.translation)).toBe(
      true,
    )
    expect(state.utteranceIndex).toBe(1)
  })

  test("cycles fixture utterances on later holds", () => {
    let state = seedState()
    const first = injectHoldToSpeak(state, HARBOR_BOOKS)
    state = first.state
    const second = injectHoldToSpeak(state, HARBOR_BOOKS)
    expect(second.line.text).not.toBe(first.line.text)
    expect(second.line.id).toBe("you-1")
  })
})
