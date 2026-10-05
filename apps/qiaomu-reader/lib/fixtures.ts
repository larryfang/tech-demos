import type { Talk } from "@/lib/types";

export const HARBOR_ID = "harbor-tasting";
export const BOOK_ID = "video-as-book";

export const HARBOR_TALK: Talk = {
  id: HARBOR_ID,
  kind: "fixture",
  title: "The 90-second tasting menu",
  titleZh: "九十秒的品尝菜单",
  speaker: "Mira Chen · Harbor Kitchen",
  duration: 96,
  blurb: "A short kitchen-systems talk: tickets, mise en place, and why a tasting menu is a queue.",
  aliases: ["smpHarbor01", "sampleHarbor"],
  cues: [
    {
      start: 0,
      en: "A tasting menu is not a poem. It is a queue with butter.",
      zh: "品尝菜单不是一首诗，而是一条抹了黄油的队列。",
    },
    {
      start: 7,
      en: "Every ticket is a promise: this plate leaves the pass in ninety seconds.",
      zh: "每张单据都是承诺：这道菜要在九十秒内离开出餐台。",
    },
    {
      start: 15,
      en: "Mise en place is just caching. If the garnish is not ready, the whole line stalls.",
      zh: "备料其实就是缓存。配菜没好，整条线都会卡住。",
    },
    {
      start: 24,
      en: "We batch the slow work: reductions, pickles, the stock that tastes like Tuesday.",
      zh: "我们把慢活批量做完：浓缩汁、腌菜，还有带着周二味道的高汤。",
    },
    {
      start: 33,
      en: "The pass is a scheduler. Hot food waits for cold food, never the other way around.",
      zh: "出餐台是调度器。热菜等冷菜，绝不能反过来。",
    },
    {
      start: 42,
      en: "If two tables fire at once, we do not cook faster. We drop a course.",
      zh: "两桌同时催菜时，我们不会煮得更快，而是先拿掉一道。",
    },
    {
      start: 50,
      en: "Guests remember the pause between plates more than the sauce.",
      zh: "客人记住的往往是盘子之间的停顿，而不是酱汁。",
    },
    {
      start: 58,
      en: "So we write the menu as timing, then we write the flavors on top.",
      zh: "所以我们先按时间写菜单，再把风味叠上去。",
    },
    {
      start: 66,
      en: "A ninety-second plate is kindness: it stays hot, and the next table stays on time.",
      zh: "九十秒出餐是一种善意：菜还热着，下一桌也不迟到。",
    },
    {
      start: 75,
      en: "If you only remember one thing: protect the pass. Everything else is prep.",
      zh: "如果只记一件事：守住出餐台。其余都是备料。",
    },
    {
      start: 84,
      en: "Tomorrow we will cook the same queue with different fish. The clock does not change.",
      zh: "明天我们会用不同的鱼再走同一条队列。时钟不会变。",
    },
  ],
};

export const BOOK_TALK: Talk = {
  id: BOOK_ID,
  kind: "fixture",
  title: "Read the video like a book",
  titleZh: "像读书一样看视频",
  speaker: "Lin Zhao · Studio Notes",
  duration: 88,
  blurb: "Why pause-and-rewind fails, and how a bilingual transcript turns a lecture into a page.",
  aliases: ["smpBookLab1", "sampleBook"],
  cues: [
    {
      start: 0,
      en: "Watching a lecture like a stream is how we lose the argument.",
      zh: "把讲座当直播看，我们就会丢掉论点。",
    },
    {
      start: 7,
      en: "Pause, rewind, copy a subtitle — that is not reading. That is firefighting.",
      zh: "暂停、回放、抄一行字幕——那不是阅读，那是救火。",
    },
    {
      start: 16,
      en: "A transcript beside the player turns time into a page you can scan.",
      zh: "播放器旁边放文稿，时间就变成可以扫读的一页。",
    },
    {
      start: 24,
      en: "English on top, Chinese under it. One idea, two doors in.",
      zh: "英文在上，中文在下。同一个想法，两扇门。",
    },
    {
      start: 32,
      en: "Click a timestamp when a sentence snags. Do not hunt with the scrubber.",
      zh: "某句卡住时点时间戳，不要在进度条上瞎找。",
    },
    {
      start: 40,
      en: "Highlight a claim and ask why it is there. The model should answer the line, not the video.",
      zh: "划出一句主张，问它为什么在这里。模型该回答这行字，而不是整段视频。",
    },
    {
      start: 50,
      en: "Then keep a note with the timestamp. Future-you will not rewatch the hour.",
      zh: "然后留下带时间戳的笔记。未来的你不会重看那一小时。",
    },
    {
      start: 58,
      en: "Obsidian is just a folder of pages. Export Markdown and the clip becomes a file.",
      zh: "Obsidian 不过是一叠页面。导出 Markdown，这一段就变成一个文件。",
    },
    {
      start: 67,
      en: "The player is still there if you need the voice. The book is there if you need the thought.",
      zh: "需要声音时播放器还在；需要想法时，书就在旁边。",
    },
    {
      start: 76,
      en: "Read first. Seek second. That is the whole lab.",
      zh: "先读，再跳转。这就是整个实验室。",
    },
  ],
};

export const FIXTURES: Talk[] = [HARBOR_TALK, BOOK_TALK];

export function getFixture(id?: string): Talk | undefined {
  if (!id) return undefined;
  const needle = id.trim();
  return FIXTURES.find(
    (talk) => talk.id === needle || talk.aliases.includes(needle) || talk.youtubeId === needle,
  );
}
