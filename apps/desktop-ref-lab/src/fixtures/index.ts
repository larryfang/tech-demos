import type { FixtureApp } from "@/engine/types"
import { calculator } from "./calculator"
import { notes } from "./notes"
import { settings } from "./settings"

export const APPS: FixtureApp[] = [calculator, notes, settings]

export function appById(id: string): FixtureApp | undefined {
  return APPS.find((app) => app.id === id)
}
