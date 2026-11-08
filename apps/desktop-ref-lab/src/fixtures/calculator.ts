import type { FixtureApp } from "@/engine/types"
import { click, snap, type Draft } from "./build"

const APP = "Calculator"
const WIN = "w-calculator"

function button(name: string, eid: string): Draft {
  return { role: "button", name, eid, actions: click }
}

function keypad(): Draft {
  return {
    role: "group",
    name: "Keypad",
    children: [
      {
        role: "group",
        name: "Row 1",
        children: [button("7", "e7"), button("8", "e8"), button("9", "e9")],
      },
      {
        role: "group",
        name: "Row 2",
        children: [button("4", "e4"), button("5", "e5"), button("6", "e6")],
      },
      {
        role: "group",
        name: "Row 3",
        children: [button("1", "e1"), button("2", "e2"), button("3", "e3")],
      },
      {
        role: "group",
        name: "Row 4",
        children: [button("C", "eClear"), button("0", "e0"), button("=", "eEquals")],
      },
      {
        role: "group",
        name: "Operators",
        children: [button("+", "ePlus"), button("−", "eMinus")],
      },
    ],
  }
}

function tree(display: string, history?: string): Draft {
  const children: Draft[] = [
    {
      role: "group",
      name: "Display",
      children: [{ role: "statictext", name: display, value: display, eid: "eDisplay" }],
    },
  ]
  if (history) {
    children.push({
      role: "group",
      name: "History",
      children: [{ role: "statictext", name: history, eid: "eHist" }],
    })
  }
  children.push(keypad())
  return { role: "window", name: "Calculator", children }
}

function shot(id: string, display: string, history?: string) {
  return snap(APP, id, WIN, "Calculator", tree(display, history))
}

export const calculator: FixtureApp = {
  id: "calculator",
  name: APP,
  description: "A four-function keypad. Click digits and operators, then = to add a history row.",
  hint: "Click 7 → + → 5 → = to watch the display change and a History node appear. Then run the STALE_REF demo.",
  staleRef: { action: "click", elementId: "e7" },
  initialSnapshotId: "sc0",
  snapshots: {
    sc0: shot("sc0", "0"),
    sc1: shot("sc1", "7"),
    sc2: shot("sc2", "7 +"),
    sc3: shot("sc3", "7 + 5"),
    sc4: shot("sc4", "12", "7 + 5 = 12"),
    sc5: shot("sc5", "0"),
  },
  transitions: [
    { from: "sc0", action: "click", elementId: "e7", to: "sc1" },
    { from: "sc1", action: "click", elementId: "ePlus", to: "sc2" },
    { from: "sc2", action: "click", elementId: "e5", to: "sc3" },
    { from: "sc3", action: "click", elementId: "eEquals", to: "sc4" },
    { from: "sc4", action: "click", elementId: "eClear", to: "sc5" },
    { from: "sc5", action: "click", elementId: "e7", to: "sc1" },
  ],
}
