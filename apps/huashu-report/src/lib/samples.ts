import type { PrototypeId } from "./types"

export interface Sample {
  id: string
  label: string
  prototype: PrototypeId
  topic: string
}

export const SAMPLES: Sample[] = [
  {
    id: "agents",
    label: "Agents",
    prototype: "academic",
    topic: "Enterprise AI agent deployment",
  },
  {
    id: "headcount",
    label: "Headcount deck",
    prototype: "deck",
    topic: "Where AI headcount is growing",
  },
  {
    id: "news",
    label: "News avoidance",
    prototype: "survey",
    topic: "News avoidance among under-35s",
  },
  {
    id: "hbm",
    label: "HBM exhibits",
    prototype: "research",
    topic: "HBM vs other DRAM wafer share",
  },
  {
    id: "exposure",
    label: "Exposure paper",
    prototype: "paper",
    topic: "Task-level exposure to generative AI",
  },
  {
    id: "feed",
    label: "Orange book",
    prototype: "popular",
    topic: "Why your news feed feels empty",
  },
]
