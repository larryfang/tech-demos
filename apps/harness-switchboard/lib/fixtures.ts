import { harnessInfo } from "./catalog";
import {
  PACKAGE_JSON_AFTER,
  PACKAGE_JSON_BEFORE,
  REPO_AFTER,
  REPO_BEFORE,
  SCHEMA_AFTER,
  SCHEMA_BEFORE,
  SLUGIFY_TEST,
  SLUGIFY_TS,
  TYPES_AFTER,
} from "./files";
import type { HarnessId, ProducedFile, TaskId, TimedEvent } from "./types";
import { compileScript } from "./uhp";

function ids(harnessId: HarnessId, fixtureId: TaskId) {
  return {
    responseId: `resp_${fixtureId}_${harnessId}`,
    sessionId: `hsess_${fixtureId}_${harnessId}`,
    createdAt: 1_782_720_000,
  };
}

function slugifyCodex(prompt: string): TimedEvent[] {
  const files: ProducedFile[] = [
    { path: "src/slugify.ts", action: "create", before: "", after: SLUGIFY_TS },
    { path: "src/slugify.test.ts", action: "create", before: "", after: SLUGIFY_TEST },
  ];
  return compileScript({
    harnessId: "codex",
    model: harnessInfo("codex").model,
    prompt,
    ...ids("codex", "slugify"),
    usage: { input_tokens: 2140, output_tokens: 860, total_tokens: 3000 },
    costUsd: 0.014,
    elapsedMs: 9200,
    files,
    steps: [
      { kind: "think", text: "Look at the repo layout, then add a small helper plus a bun test." },
      { kind: "tool", name: "list_dir", args: { path: "." }, output: "package.json\nsrc/\nREADME.md" },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "package.json" },
        output: PACKAGE_JSON_BEFORE,
      },
      { kind: "think", text: "No existing string helpers. Write slugify.ts and a focused test." },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "src/slugify.ts" },
        output: "wrote 9 lines",
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "src/slugify.test.ts" },
        output: "wrote 9 lines",
      },
      {
        kind: "tool",
        name: "shell",
        args: { command: "bun test src/slugify.test.ts" },
        output: "1 pass\n 0 fail",
      },
      {
        kind: "text",
        text: "Added src/slugify.ts and a bun test. NFKD + strip marks so Café becomes cafe. bun test is green.",
      },
      { kind: "done" },
    ],
  });
}

function slugifyClaude(prompt: string): TimedEvent[] {
  const files: ProducedFile[] = [
    { path: "lib/slugify.ts", action: "create", before: "", after: SLUGIFY_TS },
    { path: "lib/slugify.test.ts", action: "create", before: "", after: SLUGIFY_TEST },
    { path: "package.json", action: "update", before: PACKAGE_JSON_BEFORE, after: PACKAGE_JSON_AFTER },
  ];
  return compileScript({
    harnessId: "claude-code",
    model: harnessInfo("claude-code").model,
    prompt,
    ...ids("claude-code", "slugify"),
    usage: { input_tokens: 4280, output_tokens: 1520, total_tokens: 5800 },
    costUsd: 0.031,
    elapsedMs: 12800,
    files,
    steps: [
      { kind: "think", text: "Match existing conventions before writing. Check README and scripts." },
      {
        kind: "tool",
        name: "glob",
        args: { pattern: "**/*.{ts,json,md}" },
        output: "README.md\npackage.json\nlib/utils.ts",
      },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "README.md" },
        output: "# demo-app\n\nBun + TypeScript. Tests live next to the module.",
      },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "package.json" },
        output: PACKAGE_JSON_BEFORE,
      },
      { kind: "think", text: "Helpers belong in lib/. Add a test script so the new file is easy to run." },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "lib/slugify.ts" },
        output: "wrote 9 lines",
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "lib/slugify.test.ts" },
        output: "wrote 9 lines",
      },
      {
        kind: "tool",
        name: "edit_file",
        args: { path: "package.json", old: '"dev":', new: '"dev": …, "test": "bun test"' },
        output: "updated scripts.test",
      },
      {
        kind: "tool",
        name: "shell",
        args: { command: "bun test" },
        output: "1 pass\n 0 fail",
      },
      {
        kind: "text",
        text: "Landed lib/slugify.ts beside the other helpers, added lib/slugify.test.ts, and wired a package.json test script. bun test passes.",
      },
      { kind: "done" },
    ],
  });
}

function slugifyHermes(prompt: string): TimedEvent[] {
  const files: ProducedFile[] = [
    { path: "slugify.ts", action: "create", before: "", after: SLUGIFY_TS },
    { path: "slugify.test.ts", action: "create", before: "", after: SLUGIFY_TEST },
  ];
  return compileScript({
    harnessId: "hermes",
    model: harnessInfo("hermes").model,
    prompt,
    ...ids("hermes", "slugify"),
    usage: { input_tokens: 980, output_tokens: 420, total_tokens: 1400 },
    costUsd: 0.004,
    elapsedMs: 6100,
    files,
    steps: [
      { kind: "think", text: "Small helper. Write both files at the repo root and move on." },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "slugify.ts" },
        output: "wrote 9 lines",
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "slugify.test.ts" },
        output: "wrote 9 lines",
      },
      {
        kind: "text",
        text: "Wrote slugify.ts and slugify.test.ts at the repo root. Did not run tests.",
      },
      { kind: "done" },
    ],
  });
}

function softdeleteCodex(prompt: string): TimedEvent[] {
  const files: ProducedFile[] = [
    { path: "db/schema.sql", action: "update", before: SCHEMA_BEFORE, after: SCHEMA_AFTER },
    { path: "src/users-repo.ts", action: "update", before: REPO_BEFORE, after: REPO_AFTER },
  ];
  return compileScript({
    harnessId: "codex",
    model: harnessInfo("codex").model,
    prompt,
    ...ids("codex", "softdelete"),
    usage: { input_tokens: 2680, output_tokens: 940, total_tokens: 3620 },
    costUsd: 0.016,
    elapsedMs: 10400,
    files,
    steps: [
      { kind: "think", text: "Find the users table and the repository that reads it." },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "db/schema.sql" },
        output: SCHEMA_BEFORE,
      },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "src/users-repo.ts" },
        output: REPO_BEFORE,
      },
      { kind: "think", text: "Add deleted_at, filter listUsers, expose softDeleteUser." },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "db/schema.sql" },
        output: "updated 6 lines",
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "src/users-repo.ts" },
        output: "updated 12 lines",
      },
      {
        kind: "text",
        text: "Added users.deleted_at and filtered listUsers. softDeleteUser stamps current_timestamp.",
      },
      { kind: "done" },
    ],
  });
}

function softdeleteClaude(prompt: string): TimedEvent[] {
  const files: ProducedFile[] = [
    { path: "db/schema.sql", action: "update", before: SCHEMA_BEFORE, after: SCHEMA_AFTER },
    { path: "src/users-repo.ts", action: "update", before: REPO_BEFORE, after: REPO_AFTER },
    { path: "src/types.ts", action: "create", before: "", after: TYPES_AFTER },
  ];
  return compileScript({
    harnessId: "claude-code",
    model: harnessInfo("claude-code").model,
    prompt,
    ...ids("claude-code", "softdelete"),
    usage: { input_tokens: 5120, output_tokens: 1680, total_tokens: 6800 },
    costUsd: 0.036,
    elapsedMs: 14100,
    files,
    steps: [
      { kind: "think", text: "Soft delete needs the column, the queries, and the TypeScript type." },
      {
        kind: "tool",
        name: "glob",
        args: { pattern: "**/*.{sql,ts}" },
        output: "db/schema.sql\nsrc/users-repo.ts\nsrc/index.ts",
      },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "db/schema.sql" },
        output: SCHEMA_BEFORE,
      },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "src/users-repo.ts" },
        output: REPO_BEFORE,
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "db/schema.sql" },
        output: "updated 6 lines",
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "src/users-repo.ts" },
        output: "updated 12 lines",
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "src/types.ts" },
        output: "wrote 7 lines",
      },
      {
        kind: "text",
        text: "Column, repository filter, and a User type with deleted_at: string | null. List queries ignore tombstones.",
      },
      { kind: "done" },
    ],
  });
}

function softdeleteHermes(prompt: string): TimedEvent[] {
  return compileScript({
    harnessId: "hermes",
    model: harnessInfo("hermes").model,
    prompt,
    ...ids("hermes", "softdelete"),
    usage: { input_tokens: 740, output_tokens: 180, total_tokens: 920 },
    costUsd: 0.002,
    elapsedMs: 4800,
    files: [],
    steps: [
      { kind: "think", text: "Read the schema and write deleted_at in place." },
      {
        kind: "tool",
        name: "read_file",
        args: { path: "db/schema.sql" },
        output: SCHEMA_BEFORE,
      },
      {
        kind: "tool",
        name: "write_file",
        args: { path: "db/schema.sql" },
        output: "",
      },
      {
        kind: "fail",
        error: {
          code: "sandbox_denied",
          message:
            "Hermes could not write db/schema.sql: path is outside the writable workspace.",
          param: "db/schema.sql",
        },
      },
    ],
  });
}

const BUILDERS: Record<TaskId, Record<HarnessId, (prompt: string) => TimedEvent[]>> = {
  slugify: {
    codex: slugifyCodex,
    "claude-code": slugifyClaude,
    hermes: slugifyHermes,
  },
  softdelete: {
    codex: softdeleteCodex,
    "claude-code": softdeleteClaude,
    hermes: softdeleteHermes,
  },
};

export function fixtureStream(fixtureId: TaskId, harnessId: HarnessId, prompt: string): TimedEvent[] {
  return BUILDERS[fixtureId][harnessId](prompt);
}
