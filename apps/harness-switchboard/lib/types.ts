export const HARNESS_IDS = ["codex", "claude-code", "hermes"] as const;
export type HarnessId = (typeof HARNESS_IDS)[number];

export const TASK_IDS = ["slugify", "softdelete"] as const;
export type TaskId = (typeof TASK_IDS)[number];

export type ResponseStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "incomplete";

export type RunMode = "fixture" | "live";

export type Usage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

export type ProducedFile = {
  path: string;
  action: "create" | "update";
  before: string;
  after: string;
};

export type StructuredError = {
  code: string;
  message: string;
  param?: string | null;
};

export type OutputItemType =
  | "reasoning"
  | "function_call"
  | "function_call_output"
  | "message";

export type OutputItem = {
  id: string;
  type: OutputItemType;
  status?: string;
  summary?: { type: "summary_text"; text: string }[];
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
  role?: string;
  content?: {
    type: "output_text";
    text: string;
    annotations: FileAnnotation[];
  }[];
};

export type FileAnnotation = {
  type: "file_path";
  path: string;
  action: "create" | "update";
};

export type ResponseObject = {
  id: string;
  object: "response";
  created_at: number;
  status: ResponseStatus;
  error: StructuredError | null;
  incomplete_details: { reason: string } | null;
  previous_response_id: string | null;
  model: string;
  output: OutputItem[];
  store: boolean;
  usage: Usage | null;
  metadata: {
    session_id: string;
    harness_id: HarnessId;
    cost_usd?: number;
    elapsed_ms?: number;
    files?: ProducedFile[];
    ignored_fields?: string[];
  };
};

export type UhpEvent =
  | { type: "response.created"; sequence_number: number; response: ResponseObject }
  | { type: "response.in_progress"; sequence_number: number; response?: ResponseObject }
  | {
      type: "response.output_item.added";
      sequence_number: number;
      output_index: number;
      item: OutputItem;
    }
  | {
      type: "response.output_item.done";
      sequence_number: number;
      output_index: number;
      item: OutputItem;
    }
  | {
      type: "response.reasoning_summary_part.added";
      sequence_number: number;
      item_id: string;
      output_index: number;
    }
  | {
      type: "response.reasoning_summary_text.delta";
      sequence_number: number;
      item_id: string;
      output_index: number;
      delta: string;
    }
  | {
      type: "response.reasoning_summary_part.done";
      sequence_number: number;
      item_id: string;
      output_index: number;
      part: { type: "summary_text"; text: string };
    }
  | {
      type: "response.function_call_arguments.delta";
      sequence_number: number;
      item_id: string;
      output_index: number;
      delta: string;
    }
  | {
      type: "response.function_call_arguments.done";
      sequence_number: number;
      item_id: string;
      output_index: number;
      arguments: string;
    }
  | {
      type: "response.content_part.added";
      sequence_number: number;
      item_id: string;
      output_index: number;
      content_index: number;
    }
  | {
      type: "response.output_text.delta";
      sequence_number: number;
      item_id: string;
      output_index: number;
      content_index: number;
      delta: string;
    }
  | {
      type: "response.output_text.done";
      sequence_number: number;
      item_id: string;
      output_index: number;
      content_index: number;
      text: string;
    }
  | {
      type: "response.output_text.annotation.added";
      sequence_number: number;
      item_id: string;
      output_index: number;
      content_index: number;
      annotation: FileAnnotation;
    }
  | {
      type: "response.content_part.done";
      sequence_number: number;
      item_id: string;
      output_index: number;
      content_index: number;
      part: { type: "output_text"; text: string; annotations: FileAnnotation[] };
    }
  | { type: "response.completed"; sequence_number: number; response: ResponseObject }
  | { type: "response.failed"; sequence_number: number; response: ResponseObject }
  | { type: "response.incomplete"; sequence_number: number; response: ResponseObject }
  | {
      type: "error";
      sequence_number: number;
      code: string;
      message: string;
      param?: string;
    };

export type TimedEvent = {
  delayMs: number;
  event: UhpEvent;
};

export type LaneStep =
  | { id: string; kind: "reasoning"; text: string }
  | { id: string; kind: "tool"; name: string; args: string; output?: string; callId?: string }
  | { id: string; kind: "message"; text: string }
  | { id: string; kind: "error"; code: string; message: string };

export type LaneView = {
  harnessId: HarnessId;
  status: ResponseStatus;
  model: string;
  sessionId: string;
  responseId: string;
  steps: LaneStep[];
  text: string;
  files: ProducedFile[];
  usage: Usage | null;
  costUsd: number | null;
  error: StructuredError | null;
  elapsedMs: number | null;
};

export type ResultRow = {
  harnessId: HarnessId;
  status: ResponseStatus;
  elapsedMs: number | null;
  costUsd: number | null;
  tokens: number | null;
  filesTouched: number;
  filePaths: string[];
};

export type StreamMessage =
  | { kind: "event"; harnessId: HarnessId; event: UhpEvent }
  | { kind: "notice"; message: string }
  | { kind: "run.done" };

export type CreateRunRequest = {
  taskId?: TaskId | "custom";
  prompt?: string;
  harnesses: HarnessId[];
  live?: boolean;
};

export type CreateRunResponse = {
  ok: boolean;
  runId?: string;
  mode: RunMode;
  liveAvailable: boolean;
  prompt?: string;
  taskId?: string;
  harnesses?: HarnessId[];
  fallbackReason?: string;
  error?: string;
};

export type StatusResponse = {
  liveAvailable: boolean;
  mode: "fixture" | "live-ready";
};

export type CancelRequest = {
  harnessId: HarnessId;
};
