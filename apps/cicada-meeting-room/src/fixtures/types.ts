export type Lang = "en" | "zh"

export type Speaker = {
  id: string
  name: string
  nameZh: string
  role: string
  roleZh: string
}

export type TranscriptLine = {
  id: string
  tMs: number
  speakerId: string
  lang: Lang
  text: string
  translation: string
  injected?: boolean
}

export const NOTE_SECTION_ORDER = [
  "summary",
  "topics",
  "conclusions",
  "todos",
  "glossary",
] as const

export type NoteSectionId = (typeof NOTE_SECTION_ORDER)[number]

export type GlossaryTerm = {
  term: string
  gloss: string
}

export type NoteSection = {
  id: NoteSectionId
  title: string
  titleZh: string
  unlockAtMs: number
  body?: string
  items?: string[]
  terms?: GlossaryTerm[]
}

export type SpeakUtterance = {
  id: string
  lang: Lang
  text: string
  translation: string
}

export type MeetingFixture = {
  id: string
  title: string
  titleZh: string
  subtitle: string
  durationMs: number
  speakers: Speaker[]
  lines: TranscriptLine[]
  notes: NoteSection[]
  utterances: SpeakUtterance[]
}
