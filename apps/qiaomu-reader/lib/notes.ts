import { formatTimestamp, slugify } from "@/lib/playback";
import type { AskExchange, NoteClip, Talk } from "@/lib/types";

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function noteFilename(talk: Talk, date = new Date()): string {
  return `${isoDate(date)}-${slugify(talk.title)}.md`;
}

export function buildMarkdown(input: {
  talk: Talk;
  clips: NoteClip[];
  asks: AskExchange[];
  freeform: string;
  date?: Date;
}): string {
  const date = input.date ?? new Date();
  const source =
    input.talk.kind === "youtube" && input.talk.youtubeId
      ? `https://www.youtube.com/watch?v=${input.talk.youtubeId}`
      : `fixture:${input.talk.id}`;

  const clips =
    input.clips.length === 0
      ? "_No clipped lines yet._"
      : input.clips
          .map((clip) => {
            const comment = clip.comment.trim()
              ? `\n\n> ${clip.comment.trim().replaceAll("\n", "\n> ")}`
              : "";
            return `### ${formatTimestamp(clip.start)} — ${clip.en}\n\n${clip.en}\n\n${clip.zh}${comment}`;
          })
          .join("\n\n");

  const asks =
    input.asks.length === 0
      ? "_No Ask AI turns yet._"
      : input.asks
          .map((ask) => {
            const q = ask.question.trim() || "Explain this selection.";
            return `### ${q}\n\n**Selection:** ${ask.selection}\n\n**Answer (${ask.mode}):** ${ask.answer}`;
          })
          .join("\n\n");

  const freeform = input.freeform.trim() ? input.freeform.trim() : "_No free notes._";

  return `---
title: ${input.talk.title}
title_zh: ${input.talk.titleZh}
speaker: ${input.talk.speaker}
source: ${source}
created: ${isoDate(date)}
tags:
  - qiaomu-reader
  - transcript
---

# ${input.talk.title}

${input.talk.titleZh}

${input.talk.blurb}

## Clips

${clips}

## Ask AI

${asks}

## Notes

${freeform}
`;
}
