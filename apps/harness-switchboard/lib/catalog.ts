import type { HarnessId, TaskId } from "./types";

export type HarnessInfo = {
  id: HarnessId;
  name: string;
  short: string;
  model: string;
  blurb: string;
};

export const HARNESSES: HarnessInfo[] = [
  {
    id: "codex",
    name: "Codex",
    short: "CDX",
    model: "gpt-5.4",
    blurb: "Methodical CLI loop: read, write, then prove it with tests.",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    short: "CC",
    model: "claude-sonnet-4.6",
    blurb: "Explores more of the tree before it edits.",
  },
  {
    id: "hermes",
    name: "Hermes",
    short: "HRM",
    model: "grok-4.7",
    blurb: "Cheap and fast. One fixture ends in a structured failure.",
  },
];

export type SampleTask = {
  id: TaskId;
  title: string;
  prompt: string;
  hint: string;
};

export const SAMPLE_TASKS: SampleTask[] = [
  {
    id: "slugify",
    title: "Slugify helper",
    prompt: "Add a TypeScript slugify helper and a unit test.",
    hint: "All three harnesses finish. Compare files and cost.",
  },
  {
    id: "softdelete",
    title: "Soft-delete users",
    prompt: "Add a soft-delete column to the users table and update the repository.",
    hint: "Hermes fails with a structured sandbox_denied error.",
  },
];

export function harnessInfo(id: HarnessId): HarnessInfo {
  const found = HARNESSES.find((row) => row.id === id);
  if (!found) throw new Error(`Unknown harness: ${id}`);
  return found;
}

export function sampleTask(id: TaskId): SampleTask {
  const found = SAMPLE_TASKS.find((row) => row.id === id);
  if (!found) throw new Error(`Unknown task: ${id}`);
  return found;
}

export function isHarnessId(value: unknown): value is HarnessId {
  return value === "codex" || value === "claude-code" || value === "hermes";
}

export function isTaskId(value: unknown): value is TaskId {
  return value === "slugify" || value === "softdelete";
}

export function resolveTask(input: {
  taskId?: string;
  prompt?: string;
}): { id: TaskId | "custom"; prompt: string; fixtureId: TaskId } {
  const prompt = input.prompt?.trim();
  if (input.taskId && isTaskId(input.taskId)) {
    const sample = sampleTask(input.taskId);
    return { id: sample.id, prompt: prompt || sample.prompt, fixtureId: sample.id };
  }
  if (!prompt) {
    throw new Error("Enter a coding task or pick a sample.");
  }
  const fixtureId: TaskId = /schema|soft.?delete|repository|sql|users table/i.test(prompt)
    ? "softdelete"
    : "slugify";
  return { id: "custom", prompt, fixtureId };
}
