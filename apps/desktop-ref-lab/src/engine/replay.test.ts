import { describe, expect, test } from "bun:test"
import { parseRef } from "./refs"
import { act, demonstrateStaleRef, resetSession, resnapshot, startSession } from "./replay"
import { findByElementId } from "./tree"

describe("parseRef", () => {
  test("accepts snapshot-qualified refs", () => {
    expect(parseRef("@sc0:e7")).toEqual({
      ok: true,
      snapshotId: "sc0",
      elementId: "e7",
      raw: "@sc0:e7",
    })
  })

  test("rejects a bare @eN ref", () => {
    expect(parseRef("@e7")).toEqual({ ok: false, reason: "bare", raw: "@e7" })
  })

  test("rejects junk", () => {
    expect(parseRef("e7")).toEqual({ ok: false, reason: "invalid", raw: "e7" })
  })
})

describe("replay session", () => {
  test("loads calculator with qualified refs", () => {
    const session = startSession("calculator")
    expect(session.snapshot.ok).toBe(true)
    expect(session.snapshot.data.snapshot_id).toBe("sc0")
    expect(session.snapshot.data.tree.role).toBe("window")
    expect(findByElementId(session.snapshot.data.tree, "e7")?.ref_id).toBe("@sc0:e7")
  })

  test("click 7 updates the display and mints a new snapshot id", () => {
    const session = act(startSession("calculator"), "click", "@sc0:e7")
    expect(session.snapshot.data.snapshot_id).toBe("sc1")
    expect(findByElementId(session.snapshot.data.tree, "eDisplay")?.name).toBe("7")
    expect(session.lastDiff?.changed.some((item) => item.identity === "eDisplay")).toBe(true)
    expect(session.lastResult.ok).toBe(true)
    expect(session.history.some((entry) => entry.command === "click" && entry.ok)).toBe(true)
  })

  test("reusing the previous snapshot ref returns STALE_REF", () => {
    const after = act(startSession("calculator"), "click", "@sc0:e7")
    const stale = act(after, "click", "@sc0:e7")
    expect(stale.lastResult.ok).toBe(false)
    if (stale.lastResult.ok) throw new Error("expected error")
    expect(stale.lastResult.error.code).toBe("STALE_REF")
    expect(stale.lastResult.error.recovery?.requires_fresh_snapshot).toBe(true)
    expect(stale.snapshot.data.snapshot_id).toBe("sc1")
  })

  test("bare ref returns INVALID_ARGS", () => {
    const session = act(startSession("calculator"), "click", "@e7")
    expect(session.lastResult.ok).toBe(false)
    if (session.lastResult.ok) throw new Error("expected error")
    expect(session.lastResult.error.code).toBe("INVALID_ARGS")
  })

  test("missing element on the current snapshot is STALE_REF", () => {
    const session = act(startSession("calculator"), "click", "@sc0:eMissing")
    expect(session.lastResult.ok).toBe(false)
    if (session.lastResult.ok) throw new Error("expected error")
    expect(session.lastResult.error.code).toBe("STALE_REF")
  })

  test("clicking the display (no Click action) is ACTION_NOT_SUPPORTED", () => {
    const session = act(startSession("calculator"), "click", "@sc0:eDisplay")
    expect(session.lastResult.ok).toBe(false)
    if (session.lastResult.ok) throw new Error("expected error")
    expect(session.lastResult.error.code).toBe("ACTION_NOT_SUPPORTED")
  })

  test("7 + 5 = 12 adds history, then C removes it", () => {
    let session = startSession("calculator")
    session = act(session, "click", "@sc0:e7")
    session = act(session, "click", "@sc1:ePlus")
    session = act(session, "click", "@sc2:e5")
    session = act(session, "click", "@sc3:eEquals")
    expect(findByElementId(session.snapshot.data.tree, "eDisplay")?.name).toBe("12")
    expect(findByElementId(session.snapshot.data.tree, "eHist")?.name).toBe("7 + 5 = 12")
    expect(session.lastDiff?.added.some((item) => item.identity === "eHist")).toBe(true)
    session = act(session, "click", "@sc4:eClear")
    expect(findByElementId(session.snapshot.data.tree, "eHist")).toBeUndefined()
    expect(session.lastDiff?.removed.some((item) => item.identity === "eHist")).toBe(true)
  })

  test("demonstrateStaleRef clicks then retries the old ref", () => {
    const session = demonstrateStaleRef(startSession("calculator"))
    expect(session.lastResult.ok).toBe(false)
    if (session.lastResult.ok) throw new Error("expected error")
    expect(session.lastResult.error.code).toBe("STALE_REF")
    expect(session.snapshot.data.snapshot_id).toBe("sc1")
    expect(session.history.filter((entry) => !entry.ok).length).toBeGreaterThanOrEqual(1)
  })

  test("resnapshot rewrites refs so the previous id is stale", () => {
    const first = startSession("calculator")
    const oldRef = findByElementId(first.snapshot.data.tree, "e7")?.ref_id
    const next = resnapshot(first)
    expect(next.snapshot.data.snapshot_id).not.toBe("sc0")
    expect(oldRef).toBe("@sc0:e7")
    const stale = act(next, "click", oldRef ?? "")
    expect(stale.lastResult.ok).toBe(false)
    if (stale.lastResult.ok) throw new Error("expected error")
    expect(stale.lastResult.error.code).toBe("STALE_REF")
  })

  test("notes: New adds a list item, type renames it, delete removes another", () => {
    let session = startSession("notes")
    session = act(session, "click", "@sn0:eNew")
    expect(findByElementId(session.snapshot.data.tree, "eNote3")?.name).toBe("Untitled")
    expect(session.lastDiff?.added.some((item) => item.identity === "eNote3")).toBe(true)
    session = act(session, "type", "@sn1:eEditor", "Sprint retro")
    expect(findByElementId(session.snapshot.data.tree, "eNote3")?.name).toBe("Sprint retro")
    session = act(session, "click", "@sn2:eNote2")
    session = act(session, "click", "@sn3:eDelete")
    expect(findByElementId(session.snapshot.data.tree, "eNote2")).toBeUndefined()
    expect(session.lastDiff?.removed.some((item) => item.identity === "eNote2")).toBe(true)
  })

  test("settings Grant Accessibility returns PERM_DENIED without changing the tree", () => {
    let session = startSession("settings")
    session = act(session, "click", "@ss0:ePrivacy")
    const before = session.snapshot.data.snapshot_id
    session = act(session, "click", "@ss3:eGrant")
    expect(session.lastResult.ok).toBe(false)
    if (session.lastResult.ok) throw new Error("expected error")
    expect(session.lastResult.error.code).toBe("PERM_DENIED")
    expect(session.snapshot.data.snapshot_id).toBe(before)
  })

  test("resetSession restores the initial snapshot", () => {
    const dirty = act(startSession("calculator"), "click", "@sc0:e7")
    const reset = resetSession(dirty.appId)
    expect(reset.snapshot.data.snapshot_id).toBe("sc0")
    expect(reset.history).toHaveLength(1)
  })
})
