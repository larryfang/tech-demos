import { PLANNER_ID } from "@/fixtures/agents"
import { LAUNCH_OWNER_SCRIPT_ID } from "@/fixtures/scripts"

export const SAMPLE_TASK = {
  title: "Ship the v0.3 launch checklist",
  body: "We need one checklist the team can run before flipping the launch flag.",
  ownerId: PLANNER_ID,
  scriptId: LAUNCH_OWNER_SCRIPT_ID,
}
