import type { Agent } from "@/engine/types"

export const PLANNER_ID = "planner"
export const CODER_ID = "coder"
export const REVIEWER_ID = "reviewer"
export const RESEARCHER_ID = "researcher"

export const SEED_AGENTS: Agent[] = [
  {
    id: PLANNER_ID,
    name: "Mira Chen",
    role: "Planner",
    instructions:
      "Break the room task into owned slices, wait for each handback, then close the loop.",
    status: "idle",
  },
  {
    id: CODER_ID,
    name: "Jonah Vale",
    role: "Coder",
    instructions:
      "Turn a slice into a concrete artifact. Flag risky sections to the reviewer.",
    status: "idle",
  },
  {
    id: REVIEWER_ID,
    name: "Ada Ruiz",
    role: "Reviewer",
    instructions:
      "Read the draft against the risks. Write a verdict with the gaps that still matter.",
    status: "idle",
  },
  {
    id: RESEARCHER_ID,
    name: "Sol Park",
    role: "Researcher",
    instructions:
      "Gather the facts the others should not invent. Return a short risk list.",
    status: "idle",
  },
]
