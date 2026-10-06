import type { SampleLine, StructureId, StyleId } from "@/lib/types";

export const DEFAULT_NARRATION =
  "A lantern drifts across the river. The night remembers every brushstroke.";

export const STYLES: Array<{
  id: StyleId;
  label: string;
  hint: string;
}> = [
  { id: "cave", label: "Cave painting", hint: "Ochre, torch flicker, charcoal dust" },
  { id: "monet", label: "Monet", hint: "Lily pond, dabs, shimmering water" },
  { id: "ukiyo", label: "Ukiyo-e", hint: "Woodblock wave, flat ink, grain" },
  { id: "eightbit", label: "8-bit", hint: "Pixel tiles, coins, scanlines" },
  { id: "bauhaus", label: "Bauhaus", hint: "Primary geometry on a grid" },
  { id: "starry", label: "Starry Night", hint: "Impasto swirls, pulsing stars" },
];

export const STRUCTURES: Array<{
  id: StructureId;
  label: string;
  hint: string;
}> = [
  { id: "storytime", label: "Storytime", hint: "Setup → turn → close" },
  { id: "kinetic", label: "Kinetic type", hint: "Short words punched on the beat" },
  { id: "whiteboard", label: "Whiteboard", hint: "Numbered steps that build" },
  { id: "vox", label: "Vox", hint: "Question, context, kicker" },
];

export const SAMPLES: SampleLine[] = [
  {
    id: "lantern",
    label: "Lantern river",
    narration: DEFAULT_NARRATION,
    style: "monet",
    structure: "storytime",
  },
  {
    id: "coin-pipe",
    label: "Coin pipe",
    narration: "Coins hop out of the brick. The pipe leads somewhere louder.",
    style: "eightbit",
    structure: "kinetic",
  },
  {
    id: "grid-circle",
    label: "Grid first",
    narration: "First the grid. Then the circle finds the square.",
    style: "bauhaus",
    structure: "whiteboard",
  },
  {
    id: "wave-question",
    label: "Who carved the wave",
    narration: "Who carved the wave before the mountain? The printer did, one block at a time.",
    style: "ukiyo",
    structure: "vox",
  },
];

export function styleLabel(id: StyleId): string {
  return STYLES.find((item) => item.id === id)?.label ?? id;
}

export function structureLabel(id: StructureId): string {
  return STRUCTURES.find((item) => item.id === id)?.label ?? id;
}
