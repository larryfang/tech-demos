import type { FixtureApp } from "@/engine/types"
import { click, snap, toggle, typeActions, type Draft } from "./build"

const APP = "System Settings"
const WIN = "w-settings"

function sidebar(active: "general" | "appearance" | "privacy"): Draft {
  return {
    role: "list",
    name: "Sidebar",
    children: [
      {
        role: "listitem",
        name: "General",
        eid: "eGeneral",
        actions: click,
        states: active === "general" ? ["selected"] : undefined,
      },
      {
        role: "listitem",
        name: "Appearance",
        eid: "eAppearance",
        actions: click,
        states: active === "appearance" ? ["selected"] : undefined,
      },
      {
        role: "listitem",
        name: "Privacy",
        eid: "ePrivacy",
        actions: click,
        states: active === "privacy" ? ["selected"] : undefined,
      },
    ],
  }
}

const generalPane: Draft = {
  role: "group",
  name: "General",
  children: [
    {
      role: "textfield",
      name: "Computer Name",
      value: "Studio Mac",
      eid: "eComputerName",
      actions: typeActions,
    },
    {
      role: "checkbox",
      name: "Allow Handoff",
      eid: "eHandoff",
      actions: toggle,
      states: ["checked"],
    },
  ],
}

function appearancePane(dark: boolean): Draft {
  return {
    role: "group",
    name: "Appearance",
    children: [
      {
        role: "checkbox",
        name: dark ? "Dark Mode, on" : "Dark Mode, off",
        value: dark ? "1" : "0",
        eid: "eDarkMode",
        actions: toggle,
        states: dark ? ["checked"] : undefined,
      },
      {
        role: "checkbox",
        name: "True Tone",
        eid: "eTrueTone",
        actions: toggle,
        states: ["checked"],
      },
    ],
  }
}

const privacyPane: Draft = {
  role: "group",
  name: "Privacy",
  children: [
    {
      role: "statictext",
      name: "Accessibility access is required for live snapshots.",
    },
    {
      role: "button",
      name: "Grant Accessibility",
      eid: "eGrant",
      actions: click,
    },
  ],
}

function window(active: "general" | "appearance" | "privacy", pane: Draft): Draft {
  return {
    role: "window",
    name: "System Settings",
    children: [sidebar(active), pane],
  }
}

export const settings: FixtureApp = {
  id: "settings",
  name: APP,
  description: "A settings window. Switching panes replaces the content group; Dark Mode toggles state.",
  hint: "Open Appearance and toggle Dark Mode, then open Privacy and click Grant Accessibility for PERM_DENIED.",
  staleRef: { action: "click", elementId: "eAppearance" },
  initialSnapshotId: "ss0",
  snapshots: {
    ss0: snap(APP, "ss0", WIN, "System Settings", window("general", generalPane)),
    ss1: snap(APP, "ss1", WIN, "System Settings", window("appearance", appearancePane(false))),
    ss2: snap(APP, "ss2", WIN, "System Settings", window("appearance", appearancePane(true))),
    ss3: snap(APP, "ss3", WIN, "System Settings", window("privacy", privacyPane)),
  },
  transitions: [
    { from: "ss0", action: "click", elementId: "eAppearance", to: "ss1" },
    { from: "ss1", action: "click", elementId: "eDarkMode", to: "ss2" },
    { from: "ss2", action: "click", elementId: "eDarkMode", to: "ss1" },
    { from: "ss1", action: "click", elementId: "ePrivacy", to: "ss3" },
    { from: "ss2", action: "click", elementId: "ePrivacy", to: "ss3" },
    { from: "ss0", action: "click", elementId: "ePrivacy", to: "ss3" },
    { from: "ss3", action: "click", elementId: "eGeneral", to: "ss0" },
    { from: "ss3", action: "click", elementId: "eAppearance", to: "ss1" },
    {
      from: "ss3",
      action: "click",
      elementId: "eGrant",
      error: {
        code: "PERM_DENIED",
        message: "Accessibility permission is not granted for agent-desktop.",
        suggestion: "Replay mode does not need OS permissions. For Live, run `agent-desktop permissions --guide`.",
        disposition: { delivery: "not_delivered", retry: "safe" },
      },
    },
  ],
}
