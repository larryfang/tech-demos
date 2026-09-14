export type CallMode = "dry-run" | "live";

export type CallStatus =
  | "queued"
  | "started"
  | "completed"
  | "failed"
  | "no-answer"
  | "busy"
  | "canceled";

export type TranscriptSpeaker = "user" | "assistant" | "robot" | "agent-action";

export type TranscriptLine = {
  user: TranscriptSpeaker;
  text: string;
  createdAt?: string;
};

export type CallDraft = {
  phoneNumber: string;
  task: string;
  voice: string;
  firstSentence?: string;
  waitForGreeting?: boolean;
  live?: boolean;
};

export type CallRecord = {
  id: string;
  mode: CallMode;
  status: CallStatus;
  phoneNumber: string;
  task: string;
  voice: string;
  firstSentence?: string;
  waitForGreeting?: boolean;
  transcripts: TranscriptLine[];
  concatenatedTranscript?: string;
  summary?: string;
  priceUsd: number;
  estimatedMinutes: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  fallbackReason?: string;
  liveCallId?: string;
};

export type ConsoleSnapshot = {
  liveAvailable: boolean;
  calls: CallRecord[];
};

export type SendCallResponse = {
  ok: boolean;
  liveAvailable: boolean;
  call?: CallRecord;
  error?: string;
};
