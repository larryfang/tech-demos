export type Cue = {
  start: number;
  en: string;
  zh: string;
};

export type TalkKind = "fixture" | "youtube";

export type Talk = {
  id: string;
  kind: TalkKind;
  title: string;
  titleZh: string;
  speaker: string;
  duration: number;
  blurb: string;
  aliases: string[];
  youtubeId?: string;
  cues: Cue[];
};

export type ResolvedSource =
  | { ok: true; talk: Talk; youtubeId?: string }
  | { ok: false; error: string };

export type AskMode = "fixture" | "live";

export type AskRequest = {
  selection: string;
  question?: string;
  talkId?: string;
  live?: boolean;
};

export type AskResult = {
  ok: true;
  mode: AskMode;
  liveAvailable: boolean;
  answer: string;
  fallbackReason?: string;
};

export type AskError = {
  ok: false;
  liveAvailable: boolean;
  error: string;
};

export type NoteClip = {
  id: string;
  start: number;
  en: string;
  zh: string;
  comment: string;
};

export type AskExchange = {
  id: string;
  selection: string;
  question: string;
  answer: string;
  mode: AskMode;
};
