import { describe, expect, test } from "bun:test"
import { calculator } from "@/fixtures/calculator"
import { diffSummary, diffTrees, displayTree } from "./diff"
import { identityOf } from "./tree"

const sc0 = calculator.snapshots.sc0?.tree
const sc1 = calculator.snapshots.sc1?.tree
const sc4 = calculator.snapshots.sc4?.tree
const sc5 = calculator.snapshots.sc5?.tree

describe("diffTrees", () => {
  test("identical trees report no added/removed/changed", () => {
    if (!sc0) throw new Error("missing sc0")
    const diff = diffTrees(sc0, sc0)
    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
    expect(diff.changed).toEqual([])
    expect(diffSummary(diff)).toBe("no changes")
  })

  test("clicking 7 marks the display name as changed, not a new identity", () => {
    if (!sc0 || !sc1) throw new Error("missing snapshots")
    const diff = diffTrees(sc0, sc1)
    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
    expect(diff.changed.map((item) => item.identity)).toContain("eDisplay")
    const display = diff.changed.find((item) => item.identity === "eDisplay")
    expect(display?.changes).toContain("name")
    expect(display?.before?.name).toBe("0")
    expect(display?.after?.name).toBe("7")
  })

  test("identity is the element id, ignoring snapshot prefix", () => {
    if (!sc0 || !sc1) throw new Error("missing snapshots")
    const beforeDisplay = sc0.children?.[0]?.children?.[0]
    const afterDisplay = sc1.children?.[0]?.children?.[0]
    if (!beforeDisplay || !afterDisplay) throw new Error("missing display")
    expect(identityOf(beforeDisplay, "/x")).toBe("eDisplay")
    expect(identityOf(afterDisplay, "/y")).toBe("eDisplay")
    expect(beforeDisplay.ref_id).toBe("@sc0:eDisplay")
    expect(afterDisplay.ref_id).toBe("@sc1:eDisplay")
  })

  test("equals adds a History node", () => {
    if (!sc1 || !sc4) throw new Error("missing snapshots")
    const diff = diffTrees(sc1, sc4)
    expect(diff.added.map((item) => item.identity)).toContain("eHist")
    expect(diff.changed.map((item) => item.identity)).toContain("eDisplay")
    expect(diffSummary(diff)).toContain("+")
  })

  test("clear removes the History node and restores 0", () => {
    if (!sc4 || !sc5) throw new Error("missing snapshots")
    const diff = diffTrees(sc4, sc5)
    expect(diff.removed.map((item) => item.identity)).toContain("eHist")
    const display = diff.changed.find((item) => item.identity === "eDisplay")
    expect(display?.after?.name).toBe("0")
  })

  test("displayTree keeps removed nodes as ghosts in place", () => {
    if (!sc4 || !sc5) throw new Error("missing snapshots")
    const diff = diffTrees(sc4, sc5)
    const display = displayTree(sc4, sc5, diff)
    const kinds = new Map<string, string>()
    function walk(node: typeof display) {
      kinds.set(node.identity, node.kind)
      node.children.forEach(walk)
    }
    walk(display)
    expect(kinds.get("eHist")).toBe("removed")
    expect(kinds.get("eDisplay")).toBe("changed")
    expect(display.children.some((child) => child.identity === "eHist" || child.name === "History")).toBe(true)
  })
})
