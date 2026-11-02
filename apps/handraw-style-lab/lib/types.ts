export type FamilyId =
  | "graphite"
  | "ink"
  | "watercolor"
  | "print"
  | "collage"
  | "marker"
  | "crayon"
  | "technical";

export type CatalogKind = "style" | "layout" | "palette";

export type Bilingual = {
  zh: string;
  en: string;
};

export type Style = {
  id: string;
  family: FamilyId;
  name: Bilingual;
  description: Bilingual;
  prompt: Bilingual;
};

export type Layout = {
  id: string;
  name: Bilingual;
  description: Bilingual;
  prompt: Bilingual;
};

export type Palette = {
  id: string;
  name: Bilingual;
  description: Bilingual;
  prompt: Bilingual;
  swatches: string[];
};

export type PromptPair = {
  zh: string;
  en: string;
};

export type SurpriseCard = {
  style: Style;
  pair: PromptPair;
};

export type ImageGenResult = {
  ok: true;
  mode: "live";
  image: string;
  mime: string;
} | {
  ok: false;
  error: string;
};
