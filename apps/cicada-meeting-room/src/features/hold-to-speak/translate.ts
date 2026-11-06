import type { Lang, SpeakUtterance } from "../../fixtures/types"

export type TranslateResult = {
  text: string
  translation: string
  lang: Lang
  source: "fixture" | "api"
}

export function fixtureTranslate(utterance: SpeakUtterance): TranslateResult {
  return {
    text: utterance.text,
    translation: utterance.translation,
    lang: utterance.lang,
    source: "fixture",
  }
}

/** Optional live path. Never required — fixture translate is the default. */
export async function tryApiTranslate(
  text: string,
  lang: Lang,
): Promise<TranslateResult | null> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        source: lang,
        target: lang === "en" ? "zh" : "en",
      }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { translation?: string }
    if (!json.translation) return null
    return {
      text,
      translation: json.translation,
      lang,
      source: "api",
    }
  } catch {
    return null
  }
}
