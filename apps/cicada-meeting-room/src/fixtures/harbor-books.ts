import type { MeetingFixture } from "./types"

/** Harbor Books Bund pop-up kickoff — original ~75s bilingual fixture. */
export const HARBOR_BOOKS: MeetingFixture = {
  id: "harbor-books-bund",
  title: "Harbor Books",
  titleZh: "港湾书店",
  subtitle: "Bund pop-up opening sync · 外滩快闪开业同步",
  durationMs: 75_000,
  speakers: [
    {
      id: "lena",
      name: "Lena Park",
      nameZh: "朴莲娜",
      role: "Store lead",
      roleZh: "店长",
    },
    {
      id: "zhou",
      name: "Zhou Ning",
      nameZh: "周宁",
      role: "Ops",
      roleZh: "运营",
    },
    {
      id: "alex",
      name: "Alex Rivera",
      nameZh: "里维拉",
      role: "Merch",
      roleZh: "陈列",
    },
    {
      id: "lin",
      name: "Lin Xiaoyu",
      nameZh: "林小雨",
      role: "Community",
      roleZh: "社群",
    },
    {
      id: "you",
      name: "You",
      nameZh: "你",
      role: "Interpreter",
      roleZh: "口译",
    },
  ],
  lines: [
    {
      id: "l1",
      tMs: 0,
      speakerId: "lena",
      lang: "en",
      text: "Welcome in — this is the Harbor Books Bund pop-up kickoff. We'll lock the opening week today.",
      translation:
        "欢迎各位——这是港湾书店外滩快闪的启动会。今天要把开业周定下来。",
    },
    {
      id: "l2",
      tMs: 6_500,
      speakerId: "zhou",
      lang: "zh",
      text: "外滩铺位的进场窗口只有周四到周日，货柜必须周三晚到。",
      translation:
        "The Bund bay only has a Thursday-to-Sunday load-in window. Freight has to arrive Wednesday night.",
    },
    {
      id: "l3",
      tMs: 13_000,
      speakerId: "alex",
      lang: "en",
      text: "Window table is the Sister Cities table — SF poetry facing Shanghai lithographs. I need the bilingual cards by Friday noon.",
      translation:
        "橱窗是「姊妹城市」桌——旧金山诗集对着上海石版画。双语卡片周五中午前要给我。",
    },
    {
      id: "l4",
      tMs: 20_000,
      speakerId: "lin",
      lang: "zh",
      text: "社区侧我排了两场：周六下午儿童故事会，周日晚上双语朗读。场地只能坐四十人。",
      translation:
        "Community side: Saturday kids' story hour, Sunday night bilingual reading. The room only holds forty.",
    },
    {
      id: "l5",
      tMs: 27_000,
      speakerId: "lena",
      lang: "en",
      text: "Capacity of forty is fine if we ticket. Zhou, can facilities keep a rain plan for the sidewalk queue?",
      translation: "四十人有票就行。周宁，人行道排队能不能备个雨天方案？",
    },
    {
      id: "l6",
      tMs: 34_000,
      speakerId: "zhou",
      lang: "zh",
      text: "可以。雨天把队列折进骑楼，保安两人轮值。消防通道必须空着八十厘米。",
      translation:
        "Yes. Rain plan folds the queue under the arcade, two security on rotation. Keep eighty centimeters of fire lane clear.",
    },
    {
      id: "l7",
      tMs: 42_000,
      speakerId: "alex",
      lang: "en",
      text: "Then we drop the spinning rack — it eats the fire lane. I'll swap in a wall spine of paperbacks.",
      translation: "那就撤掉旋转架——它占消防通道。我改成墙面平装书脊。",
    },
    {
      id: "l8",
      tMs: 49_000,
      speakerId: "lin",
      lang: "zh",
      text: "导览词我用中英交替，专有名词第一次出现就给释义。比如 Sister Cities table 第一次说「姊妹城市桌」。",
      translation:
        "I'll alternate Chinese and English on the tour. First mention of a proper noun gets a gloss — Sister Cities table as 姊妹城市桌.",
    },
    {
      id: "l9",
      tMs: 56_000,
      speakerId: "lena",
      lang: "en",
      text: "Good. Decisions: Wednesday freight, Friday cards, Saturday story hour, Sunday reading, no spinning rack.",
      translation: "好。决议：周三货柜、周五卡片、周六故事会、周日朗读、不放旋转架。",
    },
    {
      id: "l10",
      tMs: 64_000,
      speakerId: "zhou",
      lang: "zh",
      text: "待办我记三件：货柜预约、骑楼雨天标识、开业晨会时间发给物业。",
      translation:
        "Three todos: book the freight slot, arcade rain signage, send the opening huddle time to building ops.",
    },
    {
      id: "l11",
      tMs: 70_000,
      speakerId: "alex",
      lang: "en",
      text: "I'll own the bilingual cards. See you on the Bund.",
      translation: "双语卡片我来。外滩见。",
    },
  ],
  notes: [
    {
      id: "summary",
      title: "Summary",
      titleZh: "摘要",
      unlockAtMs: 12_000,
      body: "Harbor Books is locking opening-week logistics for a Bund pop-up: load-in window, bilingual merch cards, and two ticketed community events in a forty-seat room.",
    },
    {
      id: "topics",
      title: "Topics",
      titleZh: "议题",
      unlockAtMs: 25_000,
      items: [
        "Wednesday-night freight vs Thursday–Sunday load-in",
        "Sister Cities window table and Friday bilingual cards",
        "Saturday story hour and Sunday bilingual reading (cap 40)",
        "Sidewalk queue rain plan under the arcade",
      ],
    },
    {
      id: "conclusions",
      title: "Conclusions",
      titleZh: "结论",
      unlockAtMs: 56_000,
      items: [
        "Freight arrives Wednesday night; load-in stays Thursday–Sunday.",
        "Ticket the two community sessions; room cap is forty.",
        "Drop the spinning rack so the fire lane stays 80 cm clear.",
        "Window is the Sister Cities table with bilingual cards by Friday noon.",
      ],
    },
    {
      id: "todos",
      title: "To-dos",
      titleZh: "待办",
      unlockAtMs: 64_000,
      items: [
        "Zhou: book the freight slot; send arcade rain signage and opening huddle time to building ops.",
        "Alex: deliver bilingual cards by Friday noon; wall-spine paperbacks instead of a spinning rack.",
        "Lin: run Saturday story hour and Sunday bilingual reading; gloss proper nouns on first mention.",
        "Lena: ticket the forty-seat sessions.",
      ],
    },
    {
      id: "glossary",
      title: "Glossary",
      titleZh: "术语",
      unlockAtMs: 72_000,
      terms: [
        {
          term: "Sister Cities table / 姊妹城市桌",
          gloss: "Window display pairing SF poetry with Shanghai lithographs.",
        },
        {
          term: "Load-in window / 进场窗口",
          gloss: "Thursday–Sunday access to the Bund bay; freight must land Wednesday night.",
        },
        {
          term: "Arcade rain plan / 骑楼雨天方案",
          gloss: "Fold the sidewalk queue under the arcade; keep an 80 cm fire lane.",
        },
      ],
    },
  ],
  utterances: [
    {
      id: "u1",
      lang: "en",
      text: "Can we delay the window cards until Friday evening?",
      translation: "橱窗卡片可以推迟到周五晚上吗？",
    },
    {
      id: "u2",
      lang: "zh",
      text: "双语导览我来排班。",
      translation: "I'll take the bilingual tour shifts.",
    },
    {
      id: "u3",
      lang: "en",
      text: "I'll cover Saturday story hour if Lin needs a backup.",
      translation: "如果小雨需要替补，周六故事会我可以顶上。",
    },
  ],
}
