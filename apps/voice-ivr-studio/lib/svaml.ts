/**
 * Flow model + SVAML generation for the Sinch Voice API.
 *
 * SVAML allows many `instructions` but exactly ONE `action` per response.
 * The builder maps "say" steps to instructions and one terminal step to the
 * action. The generated document is the ACE response (runs when the callee
 * answers a callout).
 *
 * Reference: https://developers.sinch.com/docs/voice/api-reference/svaml.md
 */

export type SayStep = {
  id: string;
  text: string;
};

export type MenuOption = {
  id: string;
  dtmf: string; // single digit 0-9, * or #
  label: string; // used as return(value)
};

export type TerminalAction =
  | { kind: "hangup" }
  | { kind: "connectPstn"; number: string }
  | { kind: "menu"; prompt: string; options: MenuOption[] }
  | { kind: "collect"; prompt: string; maxDigits: number };

export type Flow = {
  locale: string;
  saySteps: SayStep[];
  action: TerminalAction;
};

export const LOCALES = [
  "en-US",
  "en-GB",
  "en-AU",
  "es-ES",
  "fr-FR",
  "de-DE",
  "sv-SE",
  "ja-JP",
] as const;

type SvamlInstruction = { name: "say"; text: string; locale: string };

type SvamlAction =
  | { name: "hangup" }
  | { name: "connectPstn"; number: string }
  | {
      name: "runMenu";
      locale: string;
      mainMenu: string;
      enableVoice?: boolean;
      menus: Array<{
        id: string;
        mainPrompt: string;
        repeatPrompt?: string;
        repeats?: number;
        maxDigits?: number;
        options?: Array<{ dtmf: string; action: string }>;
      }>;
    };

export type SvamlDocument = {
  instructions: SvamlInstruction[];
  action: SvamlAction;
};

export function buildSvaml(flow: Flow): SvamlDocument {
  const instructions: SvamlInstruction[] = flow.saySteps
    .filter((s) => s.text.trim().length > 0)
    .map((s) => ({ name: "say", text: s.text.trim(), locale: flow.locale }));

  let action: SvamlAction;
  switch (flow.action.kind) {
    case "hangup":
      action = { name: "hangup" };
      break;
    case "connectPstn":
      action = { name: "connectPstn", number: flow.action.number.trim() };
      break;
    case "menu":
      action = {
        name: "runMenu",
        locale: flow.locale,
        mainMenu: "main",
        menus: [
          {
            id: "main",
            mainPrompt: `#tts[${flow.action.prompt.trim()}]`,
            repeatPrompt: `#tts[${flow.action.prompt.trim()}]`,
            repeats: 2,
            options: flow.action.options
              .filter((o) => o.dtmf.trim() !== "")
              .map((o) => ({
                dtmf: o.dtmf.trim(),
                action: `return(${(o.label.trim() || o.dtmf.trim()).replace(/[()]/g, "")})`,
              })),
          },
        ],
      };
      break;
    case "collect":
      action = {
        name: "runMenu",
        locale: flow.locale,
        mainMenu: "main",
        menus: [
          {
            id: "main",
            mainPrompt: `#tts[${flow.action.prompt.trim()}]`,
            maxDigits: flow.action.maxDigits,
          },
        ],
      };
      break;
  }

  return { instructions, action };
}

/** Problems that would make the flow invalid on a real call. */
export function validateFlow(flow: Flow): string[] {
  const problems: string[] = [];
  if (flow.action.kind === "connectPstn" && !/^\+\d{6,15}$/.test(flow.action.number.trim())) {
    problems.push("Connect: number must be E.164 (e.g. +14045009000).");
  }
  if (flow.action.kind === "menu") {
    if (!flow.action.prompt.trim()) problems.push("Menu: prompt text is required.");
    const opts = flow.action.options.filter((o) => o.dtmf.trim() !== "");
    if (opts.length === 0) problems.push("Menu: add at least one DTMF option.");
    const digits = opts.map((o) => o.dtmf.trim());
    if (new Set(digits).size !== digits.length) problems.push("Menu: DTMF keys must be unique.");
    for (const d of digits) {
      if (!/^[0-9*#]$/.test(d)) problems.push(`Menu: "${d}" is not a valid DTMF key (0-9, * or #).`);
    }
  }
  if (flow.action.kind === "collect" && !flow.action.prompt.trim()) {
    problems.push("Collect digits: prompt text is required.");
  }
  return problems;
}
