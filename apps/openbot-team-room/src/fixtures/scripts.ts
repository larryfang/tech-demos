import { CODER_ID, RESEARCHER_ID, REVIEWER_ID } from "@/fixtures/agents"
import type { WorkScript } from "@/engine/types"

export const SOLO_SCRIPT_ID = "solo-work"
export const OWNER_SCRIPT_ID = "owner-run"
export const LAUNCH_OWNER_SCRIPT_ID = "launch-owner"
export const LAUNCH_RESEARCH_SCRIPT_ID = "launch-research"
export const LAUNCH_CODE_SCRIPT_ID = "launch-code"
export const LAUNCH_REVIEW_SCRIPT_ID = "launch-review"

export const WORK_SCRIPTS: WorkScript[] = [
  {
    id: SOLO_SCRIPT_ID,
    durationMs: 6_000,
    beats: [
      {
        at: 1,
        kind: "result",
        text: "Solo item finished from the local fixture worker.",
      },
    ],
  },
  {
    id: OWNER_SCRIPT_ID,
    durationMs: 10_000,
    beats: [
      {
        at: 0.2,
        kind: "handoff",
        toAgentId: RESEARCHER_ID,
        title: "Scan the brief",
        text: "Need facts before anyone writes. Please scan the brief.",
        delegateScriptId: SOLO_SCRIPT_ID,
      },
      {
        at: 0.5,
        kind: "handoff",
        toAgentId: CODER_ID,
        title: "Draft the artifact",
        text: "Facts are in. Draft the artifact from the brief.",
        delegateScriptId: SOLO_SCRIPT_ID,
      },
      {
        at: 0.75,
        kind: "handoff",
        toAgentId: REVIEWER_ID,
        title: "Review the draft",
        text: "Draft is up. Please write a verdict.",
        delegateScriptId: SOLO_SCRIPT_ID,
      },
      {
        at: 1,
        kind: "close",
        text: "Owner closed the channel task after every handback.",
      },
    ],
  },
  {
    id: LAUNCH_OWNER_SCRIPT_ID,
    durationMs: 12_000,
    beats: [
      {
        at: 0.15,
        kind: "handoff",
        toAgentId: RESEARCHER_ID,
        title: "Scan launch risks",
        text: "Before we write a checklist, scan launch risks for v0.3.",
        delegateScriptId: LAUNCH_RESEARCH_SCRIPT_ID,
      },
      {
        at: 0.45,
        kind: "handoff",
        toAgentId: CODER_ID,
        title: "Draft the launch checklist",
        text: "Risks are in. Draft a 12-item launch checklist.",
        delegateScriptId: LAUNCH_CODE_SCRIPT_ID,
      },
      {
        at: 0.7,
        kind: "handoff",
        toAgentId: REVIEWER_ID,
        title: "Review the checklist",
        text: "Draft is up. Review it against the risk list.",
        delegateScriptId: LAUNCH_REVIEW_SCRIPT_ID,
      },
      {
        at: 1,
        kind: "close",
        text: "Launch checklist is closed. Research, draft, and review all came back.",
      },
    ],
  },
  {
    id: LAUNCH_RESEARCH_SCRIPT_ID,
    durationMs: 8_000,
    beats: [
      {
        at: 1,
        kind: "result",
        text: "Risks: rollback window, flag default, on-call paging.",
      },
    ],
  },
  {
    id: LAUNCH_CODE_SCRIPT_ID,
    durationMs: 10_000,
    beats: [
      {
        at: 0.6,
        kind: "direct",
        toAgentId: REVIEWER_ID,
        text: "Flagging the rollback section — please weight it.",
      },
      {
        at: 1,
        kind: "result",
        text: "Draft: 12 items covering freeze, flags, rollback, and comms.",
      },
    ],
  },
  {
    id: LAUNCH_REVIEW_SCRIPT_ID,
    durationMs: 8_000,
    beats: [
      {
        at: 1,
        kind: "result",
        text: "Approve with notes: add a paging drill and a flag-default check.",
      },
    ],
  },
]

export const SCRIPT_BY_ID: Record<string, WorkScript> = Object.fromEntries(
  WORK_SCRIPTS.map((script) => [script.id, script]),
)

export function scriptById(id: string | undefined): WorkScript {
  return SCRIPT_BY_ID[id ?? SOLO_SCRIPT_ID] ?? SCRIPT_BY_ID[SOLO_SCRIPT_ID]!
}
