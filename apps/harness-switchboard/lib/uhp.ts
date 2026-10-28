import type {
  FileAnnotation,
  HarnessId,
  LaneStep,
  LaneView,
  OutputItem,
  ProducedFile,
  ResponseObject,
  ResponseStatus,
  StructuredError,
  TimedEvent,
  UhpEvent,
  Usage,
} from "./types";

const TERMINAL: ReadonlySet<string> = new Set([
  "response.completed",
  "response.failed",
  "response.incomplete",
]);

export function isTerminalEvent(event: UhpEvent): boolean {
  return TERMINAL.has(event.type);
}

export function emptyLane(harnessId: HarnessId): LaneView {
  return {
    harnessId,
    status: "queued",
    model: "",
    sessionId: "",
    responseId: "",
    steps: [],
    text: "",
    files: [],
    usage: null,
    costUsd: null,
    error: null,
    elapsedMs: null,
  };
}

function upsertStep(steps: LaneStep[], next: LaneStep): LaneStep[] {
  const index = steps.findIndex((step) => step.id === next.id);
  if (index === -1) return [...steps, next];
  const copy = steps.slice();
  copy[index] = next;
  return copy;
}

function applyTerminal(state: LaneView, response: ResponseObject): LaneView {
  const files = response.metadata.files ?? state.files;
  const message = state.steps.find((step) => step.kind === "message");
  return {
    ...state,
    status: response.status,
    model: response.model || state.model,
    sessionId: response.metadata.session_id || state.sessionId,
    responseId: response.id || state.responseId,
    text: message && message.kind === "message" ? message.text : state.text,
    files,
    usage: response.usage,
    costUsd: response.metadata.cost_usd ?? state.costUsd,
    error: response.error,
    elapsedMs: response.metadata.elapsed_ms ?? state.elapsedMs,
  };
}

export function applyEvent(state: LaneView, event: UhpEvent): LaneView {
  switch (event.type) {
    case "response.created":
      return {
        ...state,
        status: "in_progress",
        model: event.response.model,
        sessionId: event.response.metadata.session_id,
        responseId: event.response.id,
      };
    case "response.in_progress":
      return { ...state, status: "in_progress" };
    case "response.output_item.added": {
      const item = event.item;
      if (item.type === "reasoning") {
        return {
          ...state,
          steps: upsertStep(state.steps, { id: item.id, kind: "reasoning", text: "" }),
        };
      }
      if (item.type === "function_call") {
        return {
          ...state,
          steps: upsertStep(state.steps, {
            id: item.id,
            kind: "tool",
            name: item.name ?? "tool",
            args: item.arguments ?? "",
            callId: item.call_id,
          }),
        };
      }
      if (item.type === "function_call_output") {
        const match = state.steps.find(
          (step) => step.kind === "tool" && step.callId === item.call_id,
        );
        if (!match || match.kind !== "tool") {
          return {
            ...state,
            steps: upsertStep(state.steps, {
              id: item.id,
              kind: "tool",
              name: "tool",
              args: "",
              output: item.output,
              callId: item.call_id,
            }),
          };
        }
        return {
          ...state,
          steps: upsertStep(state.steps, { ...match, output: item.output }),
        };
      }
      if (item.type === "message") {
        return {
          ...state,
          steps: upsertStep(state.steps, { id: item.id, kind: "message", text: "" }),
        };
      }
      return state;
    }
    case "response.reasoning_summary_text.delta": {
      const current = state.steps.find((step) => step.id === event.item_id);
      if (!current || current.kind !== "reasoning") return state;
      return {
        ...state,
        steps: upsertStep(state.steps, { ...current, text: current.text + event.delta }),
      };
    }
    case "response.function_call_arguments.delta": {
      const current = state.steps.find((step) => step.id === event.item_id);
      if (!current || current.kind !== "tool") return state;
      return {
        ...state,
        steps: upsertStep(state.steps, { ...current, args: current.args + event.delta }),
      };
    }
    case "response.function_call_arguments.done": {
      const current = state.steps.find((step) => step.id === event.item_id);
      if (!current || current.kind !== "tool") return state;
      return {
        ...state,
        steps: upsertStep(state.steps, { ...current, args: event.arguments }),
      };
    }
    case "response.output_text.delta": {
      const current = state.steps.find((step) => step.id === event.item_id);
      if (!current || current.kind !== "message") return state;
      const text = current.text + event.delta;
      return {
        ...state,
        text,
        steps: upsertStep(state.steps, { ...current, text }),
      };
    }
    case "response.output_text.done": {
      const current = state.steps.find((step) => step.id === event.item_id);
      if (!current || current.kind !== "message") return state;
      return {
        ...state,
        text: event.text,
        steps: upsertStep(state.steps, { ...current, text: event.text }),
      };
    }
    case "response.completed":
    case "response.failed":
    case "response.incomplete":
      return applyTerminal(state, event.response);
    case "error":
      return {
        ...state,
        steps: [
          ...state.steps,
          { id: `err_${event.sequence_number}`, kind: "error", code: event.code, message: event.message },
        ],
        error: { code: event.code, message: event.message, param: event.param ?? null },
      };
    default:
      return state;
  }
}

export function applyEvents(harnessId: HarnessId, events: UhpEvent[]): LaneView {
  return events.reduce(applyEvent, emptyLane(harnessId));
}

export function cancelledResponse(base: ResponseObject): ResponseObject {
  return {
    ...base,
    status: "cancelled",
    error: {
      code: "cancelled",
      message: "Cancelled by the operator.",
    },
    usage: base.usage,
  };
}

export function isTerminalStatus(status: ResponseStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled" || status === "incomplete";
}

type ScriptStep =
  | { kind: "think"; text: string }
  | { kind: "tool"; name: string; args: Record<string, unknown>; output: string }
  | { kind: "text"; text: string }
  | { kind: "fail"; error: StructuredError }
  | { kind: "done" };

export type CompileInput = {
  harnessId: HarnessId;
  model: string;
  prompt: string;
  responseId: string;
  sessionId: string;
  createdAt: number;
  usage: Usage | null;
  costUsd: number;
  elapsedMs: number;
  files: ProducedFile[];
  steps: ScriptStep[];
};

function chunkText(text: string, size: number): string[] {
  if (!text) return [""];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

function shellResponse(input: CompileInput, status: ResponseStatus, error: StructuredError | null): ResponseObject {
  return {
    id: input.responseId,
    object: "response",
    created_at: input.createdAt,
    status,
    error,
    incomplete_details: null,
    previous_response_id: null,
    model: input.model,
    output: [],
    store: true,
    usage: status === "in_progress" ? null : input.usage,
    metadata: {
      session_id: input.sessionId,
      harness_id: input.harnessId,
      cost_usd: status === "in_progress" ? undefined : input.costUsd,
      elapsed_ms: status === "in_progress" ? undefined : input.elapsedMs,
      files: status === "in_progress" ? undefined : input.files,
    },
  };
}

export function compileScript(input: CompileInput): TimedEvent[] {
  const timed: TimedEvent[] = [];
  let seq = 0;
  let outputIndex = 0;
  const output: OutputItem[] = [];
  let itemCounter = 0;

  const push = (event: UhpEvent, delayMs: number) => {
    timed.push({ delayMs, event });
  };

  const nextItemId = (prefix: string) => {
    itemCounter += 1;
    return `${prefix}_${itemCounter}`;
  };

  push({ type: "response.created", sequence_number: seq++, response: shellResponse(input, "in_progress", null) }, 80);
  push({ type: "response.in_progress", sequence_number: seq++, response: shellResponse(input, "in_progress", null) }, 120);

  for (const step of input.steps) {
    if (step.kind === "think") {
      const id = nextItemId("rs");
      const item: OutputItem = { id, type: "reasoning", status: "in_progress", summary: [] };
      push({ type: "response.output_item.added", sequence_number: seq++, output_index: outputIndex, item }, 180);
      push({ type: "response.reasoning_summary_part.added", sequence_number: seq++, item_id: id, output_index: outputIndex }, 40);
      for (const delta of chunkText(step.text, 28)) {
        push(
          { type: "response.reasoning_summary_text.delta", sequence_number: seq++, item_id: id, output_index: outputIndex, delta },
          28,
        );
      }
      const part = { type: "summary_text" as const, text: step.text };
      push({ type: "response.reasoning_summary_part.done", sequence_number: seq++, item_id: id, output_index: outputIndex, part }, 40);
      const done: OutputItem = { ...item, status: "completed", summary: [part] };
      push({ type: "response.output_item.done", sequence_number: seq++, output_index: outputIndex, item: done }, 40);
      output.push(done);
      outputIndex += 1;
      continue;
    }

    if (step.kind === "tool") {
      const id = nextItemId("fc");
      const callId = `call_${itemCounter}`;
      const args = JSON.stringify(step.args);
      const item: OutputItem = {
        id,
        type: "function_call",
        status: "in_progress",
        call_id: callId,
        name: step.name,
        arguments: "",
      };
      push({ type: "response.output_item.added", sequence_number: seq++, output_index: outputIndex, item }, 220);
      for (const delta of chunkText(args, 36)) {
        push(
          { type: "response.function_call_arguments.delta", sequence_number: seq++, item_id: id, output_index: outputIndex, delta },
          24,
        );
      }
      push(
        { type: "response.function_call_arguments.done", sequence_number: seq++, item_id: id, output_index: outputIndex, arguments: args },
        30,
      );
      const doneCall: OutputItem = { ...item, status: "completed", arguments: args };
      push({ type: "response.output_item.done", sequence_number: seq++, output_index: outputIndex, item: doneCall }, 30);
      output.push(doneCall);
      outputIndex += 1;

      const outId = nextItemId("fco");
      const outItem: OutputItem = {
        id: outId,
        type: "function_call_output",
        status: "completed",
        call_id: callId,
        output: step.output,
      };
      push({ type: "response.output_item.added", sequence_number: seq++, output_index: outputIndex, item: { ...outItem, status: "in_progress" } }, 360);
      push({ type: "response.output_item.done", sequence_number: seq++, output_index: outputIndex, item: outItem }, 80);
      output.push(outItem);
      outputIndex += 1;
      continue;
    }

    if (step.kind === "text") {
      const id = nextItemId("msg");
      const annotations: FileAnnotation[] = input.files.map((file) => ({
        type: "file_path",
        path: file.path,
        action: file.action,
      }));
      const item: OutputItem = {
        id,
        type: "message",
        role: "assistant",
        status: "in_progress",
        content: [{ type: "output_text", text: "", annotations: [] }],
      };
      push({ type: "response.output_item.added", sequence_number: seq++, output_index: outputIndex, item }, 200);
      push(
        { type: "response.content_part.added", sequence_number: seq++, item_id: id, output_index: outputIndex, content_index: 0 },
        30,
      );
      for (const delta of chunkText(step.text, 32)) {
        push(
          {
            type: "response.output_text.delta",
            sequence_number: seq++,
            item_id: id,
            output_index: outputIndex,
            content_index: 0,
            delta,
          },
          26,
        );
      }
      push(
        {
          type: "response.output_text.done",
          sequence_number: seq++,
          item_id: id,
          output_index: outputIndex,
          content_index: 0,
          text: step.text,
        },
        30,
      );
      for (const annotation of annotations) {
        push(
          {
            type: "response.output_text.annotation.added",
            sequence_number: seq++,
            item_id: id,
            output_index: outputIndex,
            content_index: 0,
            annotation,
          },
          20,
        );
      }
      push(
        {
          type: "response.content_part.done",
          sequence_number: seq++,
          item_id: id,
          output_index: outputIndex,
          content_index: 0,
          part: { type: "output_text", text: step.text, annotations },
        },
        30,
      );
      const done: OutputItem = {
        ...item,
        status: "completed",
        content: [{ type: "output_text", text: step.text, annotations }],
      };
      push({ type: "response.output_item.done", sequence_number: seq++, output_index: outputIndex, item: done }, 30);
      output.push(done);
      outputIndex += 1;
      continue;
    }

    if (step.kind === "fail") {
      const response: ResponseObject = {
        ...shellResponse(input, "failed", step.error),
        output,
      };
      push({ type: "error", sequence_number: seq++, code: step.error.code, message: step.error.message, param: step.error.param ?? undefined }, 80);
      push({ type: "response.failed", sequence_number: seq++, response }, 160);
      return timed;
    }

    if (step.kind === "done") {
      const response: ResponseObject = {
        ...shellResponse(input, "completed", null),
        output,
      };
      push({ type: "response.completed", sequence_number: seq++, response }, 160);
      return timed;
    }
  }

  const response: ResponseObject = {
    ...shellResponse(input, "completed", null),
    output,
  };
  push({ type: "response.completed", sequence_number: seq++, response }, 160);
  return timed;
}

export function assertSequence(events: UhpEvent[]): void {
  events.forEach((event, index) => {
    if (event.sequence_number !== index) {
      throw new Error(`sequence_number gap at ${index}: got ${event.sequence_number}`);
    }
  });
  if (events[0]?.type !== "response.created") {
    throw new Error("stream must start with response.created");
  }
  const last = events[events.length - 1];
  if (!last || !isTerminalEvent(last)) {
    throw new Error("stream must end with a terminal event");
  }
}

export function lineDiff(before: string, after: string): { type: "eq" | "add" | "del"; text: string }[] {
  const a = before.split("\n");
  const b = after.split("\n");
  if (before === after) return a.map((text) => ({ type: "eq" as const, text }));
  if (!before) return b.map((text) => ({ type: "add" as const, text }));
  if (!after) return a.map((text) => ({ type: "del" as const, text }));

  const rows: { type: "eq" | "add" | "del"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ type: "eq", text: a[i] ?? "" });
      i += 1;
      j += 1;
      continue;
    }
    const laterInB = b.indexOf(a[i] ?? "", j);
    const laterInA = a.indexOf(b[j] ?? "", i);
    if (laterInB !== -1 && (laterInA === -1 || laterInB - j <= laterInA - i)) {
      rows.push({ type: "add", text: b[j] ?? "" });
      j += 1;
    } else if (laterInA !== -1) {
      rows.push({ type: "del", text: a[i] ?? "" });
      i += 1;
    } else {
      rows.push({ type: "del", text: a[i] ?? "" });
      rows.push({ type: "add", text: b[j] ?? "" });
      i += 1;
      j += 1;
    }
  }
  while (i < a.length) {
    rows.push({ type: "del", text: a[i] ?? "" });
    i += 1;
  }
  while (j < b.length) {
    rows.push({ type: "add", text: b[j] ?? "" });
    j += 1;
  }
  return rows;
}
