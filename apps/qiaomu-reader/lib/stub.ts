import { getFixture } from "@/lib/fixtures";
import type { Cue, Talk } from "@/lib/types";

const STUB_TEMPLATES: Array<{ en: string; zh: string }> = [
  {
    en: "This demo did not fetch live captions for video {id}.",
    zh: "这个演示没有为视频 {id} 拉取在线字幕。",
  },
  {
    en: "The player on the left is the YouTube embed. The page on the right is a stub transcript.",
    zh: "左边是 YouTube 嵌入播放器，右边是一份占位文稿。",
  },
  {
    en: "Pick a bundled fixture if you want a real bilingual reading — Harbor or Video as a book.",
    zh: "若要完整的双语阅读，请选用自带样例：港口品尝或像读书一样看视频。",
  },
  {
    en: "Click a timestamp to jump. The highlight follows the scrubber even without captions.",
    zh: "点击时间戳即可跳转。即使没有字幕，高亮也会跟着进度条走。",
  },
  {
    en: "Select a line and ask AI. With no API key you still get a deterministic study note.",
    zh: "划线后可以问 AI。没有密钥时，也会得到一条确定的学习笔记。",
  },
  {
    en: "Export the notes panel as Obsidian-ready Markdown when a sentence is worth keeping.",
    zh: "值得留下的句子，可以从笔记面板导出成适合 Obsidian 的 Markdown。",
  },
  {
    en: "Live captions would belong in a later integration. This lab stays fixture-first and offline-safe.",
    zh: "在线字幕留给以后的接入。这个实验室坚持样例优先，并能离线运行。",
  },
  {
    en: "Video id {id} is only used to title this stub. Nothing was scraped from YouTube.",
    zh: "视频编号 {id} 只用来给这份占位文稿起名，没有从 YouTube 抓取任何内容。",
  },
];

function fill(template: string, id: string): string {
  return template.replaceAll("{id}", id);
}

export function stubTalkForVideo(videoId: string): Talk {
  const cues: Cue[] = STUB_TEMPLATES.map((line, index) => ({
    start: index * 8,
    en: fill(line.en, videoId),
    zh: fill(line.zh, videoId),
  }));

  return {
    id: `yt-${videoId}`,
    kind: "youtube",
    title: `YouTube clip ${videoId}`,
    titleZh: `YouTube 片段 ${videoId}`,
    speaker: "Untitled upload",
    duration: 64,
    blurb: "Deterministic stub transcript — this lab does not scrape YouTube captions.",
    aliases: [videoId],
    youtubeId: videoId,
    cues,
  };
}

export function stubAnswer(selection: string, question?: string): string {
  const text = selection.replace(/\s+/g, " ").trim();
  const asked = question?.trim();
  const lower = `${text} ${asked ?? ""}`.toLowerCase();

  let body: string;
  if (/(mise|ticket|pass|tasting|queue|九十|出餐|备料)/i.test(lower)) {
    body =
      "The speaker is treating service as a scheduler: cache prep (mise), protect the pass, and drop work instead of rushing. The 90-second rule is a latency budget, not a slogan.";
  } else if (/(transcript|rewind|bilingual|obsidian|timestamp|文稿|回放|双语|笔记)/i.test(lower)) {
    body =
      "The claim is that reading beats scrubbing. A bilingual line is a paragraph; a timestamp is a bookmark; Ask AI should answer the highlighted sentence, not summarize the whole hour.";
  } else if (/(caption|youtube|stub|字幕|占位)/i.test(lower)) {
    body =
      "This line is from the offline stub. The lab will not invent real captions for a pasted URL; use a fixture when you want a written talk.";
  } else {
    body = `Study note: the selected line is making one claim — “${text.slice(0, 180)}${text.length > 180 ? "…" : ""}”. Ask what would have to be true for that claim to fail.`;
  }

  const q = asked ? `Question: ${asked}\n` : "";
  return `${q}${body}\n\n中文复述：把划线当作一段落来读，而不是再看一遍视频。`;
}

export function resolveTalk(input: { fixtureId?: string; url?: string }): Talk | { error: string } {
  if (input.fixtureId) {
    const fixture = getFixture(input.fixtureId);
    if (fixture) return fixture;
    return { error: `Unknown fixture: ${input.fixtureId}` };
  }

  const fixtureFromUrl = input.url ? getFixture(input.url) : undefined;
  if (fixtureFromUrl) return fixtureFromUrl;

  return { error: "Pick a fixture or paste a YouTube URL." };
}
