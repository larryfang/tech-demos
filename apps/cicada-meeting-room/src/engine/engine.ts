import {
  NOTE_SECTION_ORDER,
  type MeetingFixture,
  type NoteSection,
  type SpeakUtterance,
  type Speaker,
  type TranscriptLine,
} from "../fixtures/types"

export type MeetingState = {
  clockMs: number
  playing: boolean
  injected: TranscriptLine[]
  utteranceIndex: number
}

export function seedState(): MeetingState {
  return {
    clockMs: 0,
    playing: false,
    injected: [],
    utteranceIndex: 0,
  }
}

export function runSample(): MeetingState {
  return { ...seedState(), playing: true }
}

export function play(state: MeetingState, durationMs: number): MeetingState {
  if (state.clockMs >= durationMs) {
    return { ...state, clockMs: 0, playing: true }
  }
  return { ...state, playing: true }
}

export function pause(state: MeetingState): MeetingState {
  return { ...state, playing: false }
}

export function tick(
  state: MeetingState,
  dtMs: number,
  durationMs: number,
): MeetingState {
  if (!state.playing) return state
  const clockMs = clamp(state.clockMs + dtMs, 0, durationMs)
  return {
    ...state,
    clockMs,
    playing: clockMs < durationMs,
  }
}

export function scrub(
  state: MeetingState,
  clockMs: number,
  durationMs: number,
): MeetingState {
  return { ...state, clockMs: clamp(clockMs, 0, durationMs) }
}

export function visibleLines(
  clockMs: number,
  fixture: MeetingFixture,
  injected: TranscriptLine[],
): TranscriptLine[] {
  const shown = [
    ...fixture.lines.filter((line) => line.tMs <= clockMs),
    ...injected.filter((line) => line.tMs <= clockMs),
  ]
  return shown.sort((a, b) => a.tMs - b.tMs || a.id.localeCompare(b.id))
}

export function unlockedNotes(
  clockMs: number,
  fixture: MeetingFixture,
): NoteSection[] {
  const byId = new Map(fixture.notes.map((note) => [note.id, note]))
  return NOTE_SECTION_ORDER.flatMap((id) => {
    const note = byId.get(id)
    if (!note || note.unlockAtMs > clockMs) return []
    return [note]
  })
}

export function lockedNotes(
  clockMs: number,
  fixture: MeetingFixture,
): NoteSection[] {
  const byId = new Map(fixture.notes.map((note) => [note.id, note]))
  return NOTE_SECTION_ORDER.flatMap((id) => {
    const note = byId.get(id)
    if (!note || note.unlockAtMs <= clockMs) return []
    return [note]
  })
}

export function speakerById(
  fixture: MeetingFixture,
  id: string,
): Speaker | undefined {
  return fixture.speakers.find((speaker) => speaker.id === id)
}

export function peekUtterance(
  state: MeetingState,
  fixture: MeetingFixture,
): SpeakUtterance {
  const list = fixture.utterances
  if (list.length === 0) {
    throw new Error("fixture has no hold-to-speak utterances")
  }
  const utterance = list[state.utteranceIndex % list.length]
  if (!utterance) {
    throw new Error("hold-to-speak utterance missing")
  }
  return utterance
}

export function injectHoldToSpeak(
  state: MeetingState,
  fixture: MeetingFixture,
): { state: MeetingState; line: TranscriptLine } {
  const utterance = peekUtterance(state, fixture)
  const line: TranscriptLine = {
    id: `you-${state.utteranceIndex}`,
    tMs: state.clockMs,
    speakerId: "you",
    lang: utterance.lang,
    text: utterance.text,
    translation: utterance.translation,
    injected: true,
  }
  return {
    line,
    state: {
      ...state,
      injected: [...state.injected, line],
      utteranceIndex: state.utteranceIndex + 1,
    },
  }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m)}:${String(s).padStart(2, "0")}`
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
