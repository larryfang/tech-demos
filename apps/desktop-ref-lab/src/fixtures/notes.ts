import type { FixtureApp } from "@/engine/types"
import { click, snap, typeActions, type Draft } from "./build"

const APP = "Notes"
const WIN = "w-notes"

function noteItem(name: string, eid: string, selected: boolean): Draft {
  return {
    role: "listitem",
    name,
    eid,
    actions: click,
    states: selected ? ["selected"] : undefined,
  }
}

function tree(opts: {
  notes: Array<{ name: string; eid: string; selected: boolean }>
  title: string
  body: string
  editorEid: string
}): Draft {
  const selected = opts.notes.find((note) => note.selected)
  return {
    role: "window",
    name: "Notes",
    children: [
      {
        role: "toolbar",
        name: "Notes toolbar",
        children: [
          { role: "button", name: "New", eid: "eNew", actions: click },
          { role: "button", name: "Delete", eid: "eDelete", actions: click },
        ],
      },
      {
        role: "list",
        name: "Notes",
        children: opts.notes.map((note) => noteItem(note.name, note.eid, note.selected)),
      },
      {
        role: "group",
        name: "Editor",
        children: [
          {
            role: "statictext",
            name: opts.title,
            eid: "eNoteTitle",
          },
          {
            role: "textfield",
            name: selected ? `Body of ${selected.name}` : "Note body",
            value: opts.body,
            eid: opts.editorEid,
            actions: typeActions,
          },
        ],
      },
    ],
  }
}

const launch = { name: "Launch checklist", eid: "eNote1", selected: true }
const weekend = { name: "Weekend sketch", eid: "eNote2", selected: false }

export const notes: FixtureApp = {
  id: "notes",
  name: APP,
  description: "A two-note window. New creates a row, Type fills the editor, Delete removes a note.",
  hint: "Click New, type a title, then Delete a note to see added and removed list items.",
  staleRef: { action: "click", elementId: "eNew" },
  initialSnapshotId: "sn0",
  snapshots: {
    sn0: snap(
      APP,
      "sn0",
      WIN,
      "Notes",
      tree({
        notes: [launch, weekend],
        title: "Launch checklist",
        body: "- freeze UI\n- ship snapshot loop",
        editorEid: "eEditor",
      }),
    ),
    sn1: snap(
      APP,
      "sn1",
      WIN,
      "Notes",
      tree({
        notes: [
          { ...launch, selected: false },
          weekend,
          { name: "Untitled", eid: "eNote3", selected: true },
        ],
        title: "Untitled",
        body: "",
        editorEid: "eEditor",
      }),
    ),
    sn2: snap(
      APP,
      "sn2",
      WIN,
      "Notes",
      tree({
        notes: [
          { ...launch, selected: false },
          weekend,
          { name: "Sprint retro", eid: "eNote3", selected: true },
        ],
        title: "Sprint retro",
        body: "Sprint retro",
        editorEid: "eEditor",
      }),
    ),
    sn3: snap(
      APP,
      "sn3",
      WIN,
      "Notes",
      tree({
        notes: [
          { ...launch, selected: false },
          { ...weekend, selected: true },
          { name: "Sprint retro", eid: "eNote3", selected: false },
        ],
        title: "Weekend sketch",
        body: "ink + coffee",
        editorEid: "eEditor",
      }),
    ),
    sn4: snap(
      APP,
      "sn4",
      WIN,
      "Notes",
      tree({
        notes: [
          { ...launch, selected: false },
          { name: "Sprint retro", eid: "eNote3", selected: true },
        ],
        title: "Sprint retro",
        body: "Sprint retro",
        editorEid: "eEditor",
      }),
    ),
  },
  transitions: [
    { from: "sn0", action: "click", elementId: "eNew", to: "sn1" },
    { from: "sn1", action: "type", elementId: "eEditor", to: "sn2" },
    { from: "sn2", action: "click", elementId: "eNote2", to: "sn3" },
    { from: "sn3", action: "click", elementId: "eDelete", to: "sn4" },
    { from: "sn1", action: "click", elementId: "eNote2", to: "sn3" },
  ],
}
