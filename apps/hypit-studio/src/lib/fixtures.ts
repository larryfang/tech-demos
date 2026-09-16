import type { SampleClone } from "./types"

export const CLONES: SampleClone[] = [
  {
    id: "ranking-goat",
    title: "GOAT Debate",
    format: "ranking",
    duration: "20s",
    aspect: "9:16",
    source: "Inspired by Hypit examples/ranking-football",
    hook: "A 20s football tier list that keeps the board, karaoke, and cut rhythm locked.",
    script: [
      "Welcome back. Today we're ranking the most ridiculous football takes.",
      "Hair gel era. Greek god? More like Greek tragedy.",
      "Messi? Man won a World Cup looking like somebody's tired dad.",
      "Walks around for 89 minutes, touches the ball three times, and somehow you just watched a hat trick.",
      "Definitely S tier.",
    ],
    invariants: [
      {
        id: "shot-right",
        kind: "shot",
        label: "Talking-head right",
        detail: "Host seated right with a desk + player-icon slot on the left.",
      },
      {
        id: "pacing-hook",
        kind: "pacing",
        label: "Hook → board → sting",
        detail: "Opening take, then the ranking board holds state while inserts fire.",
      },
      {
        id: "karaoke-box",
        kind: "karaoke",
        label: "Color-box karaoke",
        detail: "Word-level captions, not second-locked lower thirds.",
      },
      {
        id: "format-916",
        kind: "format",
        label: "9:16 ranking short",
        detail: "Vertical UGC skeleton. Structure survives a topic swap.",
      },
    ],
    variables: [
      {
        id: "broll",
        kind: "broll",
        label: "B-roll pack",
        options: [
          {
            id: "comedy-sports",
            label: "Comedy sports",
            summary: "Gel jar, Greek statue, tired-dad uncle, three hats.",
            insert: "gel-jar / greek-statue / uncle-trophy / hat-trick-ball",
          },
          {
            id: "banana-cat",
            label: "Banana cat",
            summary: "Swap the insert language to banana-cat reaction stills.",
            insert: "banana-stare / peel-explode / cat-with-cup",
          },
          {
            id: "founders",
            label: "Tech founders",
            summary: "Same board, founder portraits instead of players.",
            insert: "hoodie-keynote / whiteboard / laptop-glow",
          },
        ],
      },
      {
        id: "caption",
        kind: "caption",
        label: "Caption style",
        options: [
          {
            id: "color-box",
            label: "Color-box karaoke",
            summary: "Filled word boxes that flip color on the spoken token.",
            insert: "karaoke-box",
          },
          {
            id: "outline-stack",
            label: "Outline stack",
            summary: "Stacked outline type, one line per beat.",
            insert: "outline-stack",
          },
          {
            id: "sticker-punch",
            label: "Sticker punch",
            summary: "Die-cut sticker words that pop on the anchor.",
            insert: "sticker-punch",
          },
        ],
      },
      {
        id: "effect",
        kind: "effect",
        label: "Board effect",
        options: [
          {
            id: "board-slide",
            label: "Ranking slide",
            summary: "Sound-synced tile that slides a name into S or D.",
            insert: "ranking-board-slide",
          },
          {
            id: "emoji-flash",
            label: "Emoji flash",
            summary: "Full-frame emoji sting on the ranked word.",
            insert: "emoji-flash",
          },
          {
            id: "glitch-sting",
            label: "Glitch sting",
            summary: "One-frame RGB split when the tier lands.",
            insert: "glitch-sting",
          },
        ],
      },
    ],
    anchors: [
      {
        id: "hair-gel",
        word: "hair gel",
        line: "Hair gel era. Greek god? More like Greek tragedy.",
        beat: "First joke insert over the left icon slot.",
        slots: ["broll", "caption"],
      },
      {
        id: "greek-god",
        word: "Greek god",
        line: "Hair gel era. Greek god? More like Greek tragedy.",
        beat: "Statue insert; host gives an appraising look.",
        slots: ["broll", "caption"],
      },
      {
        id: "tired-dad",
        word: "tired dad",
        line: "Messi? Man won a World Cup looking like somebody's tired dad.",
        beat: "Affectionate roast still; board holds Messi.",
        slots: ["broll", "caption"],
      },
      {
        id: "hat-trick",
        word: "hat trick",
        line: "…and somehow you just watched a hat trick.",
        beat: "Visual pun lands; free-hand open gesture.",
        slots: ["broll", "caption", "effect"],
      },
      {
        id: "s-tier",
        word: "S tier",
        line: "Definitely S tier.",
        beat: "Board tile locks. Structure never moves; only the name does.",
        slots: ["caption", "effect"],
      },
    ],
  },
  {
    id: "podcast-creatine",
    title: "Daily Creatine",
    format: "podcast",
    duration: "18s",
    aspect: "9:16",
    source: "Inspired by Hypit examples/podcast",
    hook: "An 18s two-host clip: split screen, speaker karaoke, then a product handoff.",
    script: [
      "OK Sarah, so what is the one single thing that you literally can't live without?",
      "Creatine. Five grams a day, every day.",
      "I put it in my coffee, my smoothie, and even my pasta water.",
      "God I think you're treating this as flour.",
      "But actually you need this way more than I do.",
      "Wait what? I didn't ask for that!",
      "Of course you did. Look at your arms!",
    ],
    invariants: [
      {
        id: "split-screen",
        kind: "layout",
        label: "Split-screen interview",
        detail: "Host A right / Host B left. Listener stays silent on the other panel.",
      },
      {
        id: "speaker-karaoke",
        kind: "karaoke",
        label: "Speaker-aware karaoke",
        detail: "Caption color follows who is talking, not a global clock.",
      },
      {
        id: "handoff",
        kind: "pacing",
        label: "Product-handoff cut",
        detail: "Offer on A's line, receive on B's cut. Possession is the edit.",
      },
      {
        id: "format-pod",
        kind: "format",
        label: "9:16 podcast short",
        detail: "Same two-chair geometry; swap hosts or SKU and re-run.",
      },
    ],
    variables: [
      {
        id: "broll",
        kind: "broll",
        label: "B-roll pack",
        options: [
          {
            id: "lifestyle",
            label: "Lifestyle montage",
            summary: "Cafe selfie, dessert shop, courtyard pasta.",
            insert: "cafe-selfie / bingsu-mirror / pasta-pot",
          },
          {
            id: "gym-memes",
            label: "Gym memes",
            summary: "Pepe/Doge style reaction stills for the roast.",
            insert: "tiny-arms / protein-spill / gym-bro-stare",
          },
          {
            id: "skincare",
            label: "Skincare closeups",
            summary: "Retinol remix: pores, dropper, bathroom mirror.",
            insert: "dropper / pore-macro / mirror-roast",
          },
        ],
      },
      {
        id: "caption",
        kind: "caption",
        label: "Caption style",
        options: [
          {
            id: "speaker-karaoke",
            label: "Speaker karaoke",
            summary: "A/B color on the spoken token.",
            insert: "speaker-karaoke",
          },
          {
            id: "nameplates",
            label: "Dual nameplates",
            summary: "Pinned A/B nameplates; line updates under the speaker.",
            insert: "nameplates",
          },
          {
            id: "lower-third",
            label: "Lower third",
            summary: "Single lower third, still word-anchored.",
            insert: "lower-third",
          },
        ],
      },
      {
        id: "effect",
        kind: "effect",
        label: "Handoff effect",
        options: [
          {
            id: "handoff-zoom",
            label: "Handoff zoom",
            summary: "Push in on the tub as it crosses the cut.",
            insert: "product-handoff-zoom",
          },
          {
            id: "split-wipe",
            label: "Split wipe",
            summary: "Horizontal wipe follows the offer → receive.",
            insert: "split-wipe",
          },
          {
            id: "sticker-burst",
            label: "Sticker burst",
            summary: "Comment-sticker pop on the roast line.",
            insert: "sticker-burst",
          },
        ],
      },
    ],
    anchors: [
      {
        id: "creatine",
        word: "Creatine",
        line: "Creatine. Five grams a day, every day.",
        speaker: "Host A",
        beat: "Label-forward product insert. One indicating nod.",
        slots: ["broll", "caption"],
      },
      {
        id: "pasta-water",
        word: "pasta water",
        line: "I put it in my coffee, my smoothie, and even my pasta water.",
        speaker: "Host A",
        beat: "Lifestyle montage over the list.",
        slots: ["broll", "caption"],
      },
      {
        id: "flour",
        word: "flour",
        line: "God I think you're treating this as flour.",
        speaker: "Host B",
        beat: "Listener becomes speaker; compact open-hand roast.",
        slots: ["caption", "effect"],
      },
      {
        id: "need-this",
        word: "need this",
        line: "But actually you need this way more than I do.",
        speaker: "Host A",
        beat: "Offer toward the left edge — cut on the handoff.",
        slots: ["broll", "caption", "effect"],
      },
      {
        id: "your-arms",
        word: "your arms",
        line: "Of course you did. Look at your arms!",
        speaker: "Host A",
        beat: "Empty hands, folded arms, one pointing gesture.",
        slots: ["caption", "effect"],
      },
    ],
  },
]

export function cloneById(id: string): SampleClone {
  return CLONES.find((clone) => clone.id === id) ?? CLONES[0]
}
