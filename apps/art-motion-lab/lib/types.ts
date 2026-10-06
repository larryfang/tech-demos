export type StyleId =
  | "cave"
  | "monet"
  | "ukiyo"
  | "eightbit"
  | "bauhaus"
  | "starry";

export type StructureId = "storytime" | "kinetic" | "whiteboard" | "vox";

export type Motif = "rise" | "pan" | "pulse" | "scatter" | "reveal";

export type Beat = {
  at: number;
  caption: string;
  motif: Motif;
};

export type ScenePlan = {
  title: string;
  duration: number;
  beats: Beat[];
};

export type MotionSettings = {
  speed: number;
  intensity: number;
};

export type BeatsMode = "fixture" | "live";

export type BeatsRequest = {
  narration: string;
  style: StyleId;
  structure: StructureId;
  live?: boolean;
};

export type BeatsResult = {
  ok: true;
  mode: BeatsMode;
  liveAvailable: boolean;
  plan: ScenePlan;
  fallbackReason?: string;
};

export type BeatsError = {
  ok: false;
  liveAvailable: boolean;
  error: string;
};

export type SampleLine = {
  id: string;
  label: string;
  narration: string;
  style: StyleId;
  structure: StructureId;
};
