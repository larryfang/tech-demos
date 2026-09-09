/**
 * Deterministic "show-me" generator.
 *
 * Ports the judgment of HumanLayer's show-me skill into local heuristics:
 * pick the smallest view that makes the key point clear.
 *
 *  - arrows / sequential steps  -> mermaid flowchart (or sequence diagram)
 *  - indentation / hierarchy    -> call/file tree
 *  - anything else              -> one focused HTML card
 */

export type VisualKind = "tree" | "mermaid" | "card"
export type Mode = "auto" | VisualKind

export interface Visual {
  kind: VisualKind
  title: string
  /** copyable source: tree text or mermaid source */
  source: string
  /** card-only: distilled key points */
  points: string[]
  /** why auto mode picked this view */
  reason: string
}

// ---------------------------------------------------------------------------
// cleanup

const NOISE_RE = /^\d[\d,.]* ?(likes?|reposts?|replies|views|retweets?)\b/i

interface Line {
  raw: string
  indent: number
  text: string
  ordered: boolean
}

function stripInline(s: string): string {
  return s
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^RT\s+/i, "")
    .replace(/^(@\w+[:,]?\s*)+/, "")
    .replace(/\b\d{1,2}:\d{2}\s*(AM|PM)?\b/gi, "")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

function parseLines(input: string): Line[] {
  const out: Line[] = []
  for (const raw of input.split(/\r?\n/)) {
    if (!raw.trim() || NOISE_RE.test(raw.trim())) continue
    const indent = (raw.match(/^[\t ]*/)?.[0] ?? "")
      .replace(/\t/g, "  ").length
    let text = raw.trim()
    let ordered = false
    // strip bullets and numbering, remember if it was an ordered step
    const numbered = text.match(/^(?:step\s*)?(\d+)[.):]\s+(.*)$/i)
    if (numbered) {
      ordered = true
      text = numbered[2]
    } else {
      text = text.replace(/^[-*•>]+\s+/, "")
    }
    text = stripInline(text)
    if (text) out.push({ raw, indent, text, ordered })
  }
  return out
}

// ---------------------------------------------------------------------------
// signal detection

const ARROW_RE = /(->|→|=>|—>|⇒)/
const SEQ_WORDS_RE =
  /^(first|then|next|after(wards| that)?|finally|lastly|second|third)\b[,:]?\s*/i

function deriveTitle(lines: Line[], fallback: string): string {
  const first = lines[0]?.text ?? fallback
  // a short first line with no terminal period reads like a title
  const t = first.replace(/[.!?]+$/, "")
  return t.length <= 60 ? t : t.slice(0, 57).trimEnd() + "…"
}

// ---------------------------------------------------------------------------
// mermaid flow

function shorten(s: string, max = 42): string {
  const c = s.trim()
  return c.length <= max ? c : c.slice(0, max - 1).trimEnd() + "…"
}

/**
 * Mermaid html-escapes quotes/apostrophes in labels, which inflates its text
 * measurement and clips the rendered label mid-word — so drop them entirely,
 * along with mermaid's structural characters.
 */
function mermaidLabel(s: string, max = 42): string {
  return shorten(s.replace(/["'’]/g, "").replace(/[[\]{}()<>#;&|]/g, " ").replace(/\s+/g, " "), max)
}

interface FlowResult {
  source: string
  stepCount: number
  isSequenceDiagram: boolean
}

function buildFlow(lines: Line[]): FlowResult | null {
  // "Actor -> Actor: message" on 2+ lines reads as a sequence diagram
  const actorLines = lines.filter(
    (l) => /^[\w .]+ *(->|→|=>) *[\w .]+ *:/.test(l.text),
  )
  if (actorLines.length >= 2) {
    const stmts: string[] = []
    const seen = new Set<string>()
    for (const l of actorLines) {
      const m = l.text.match(/^([\w .]+?) *(?:->|→|=>) *([\w .]+?) *: *(.+)$/)
      if (!m) continue
      const [, from, to, msg] = m
      const a = mermaidLabel(from, 20).replace(/\s+/g, "_")
      const b = mermaidLabel(to, 20).replace(/\s+/g, "_")
      for (const p of [a, b]) {
        if (!seen.has(p)) {
          seen.add(p)
          stmts.push(`    participant ${p}`)
        }
      }
      stmts.push(`    ${a}->>${b}: ${mermaidLabel(msg, 40)}`)
    }
    return {
      source: `sequenceDiagram\n${stmts.join("\n")}`,
      stepCount: actorLines.length,
      isSequenceDiagram: true,
    }
  }

  // collect steps: arrow chains, numbered lines, or sequence-word lines
  const steps: string[] = []
  for (const l of lines) {
    if (ARROW_RE.test(l.text)) {
      for (const part of l.text.split(/\s*(?:->|→|=>|—>|⇒)\s*/)) {
        const p = part.trim()
        if (p) steps.push(p)
      }
    } else if (l.ordered) {
      steps.push(l.text)
    } else if (SEQ_WORDS_RE.test(l.text)) {
      steps.push(l.text.replace(SEQ_WORDS_RE, ""))
    }
  }
  const uniq = steps.filter((s, i) => steps.indexOf(s) === i)
  if (uniq.length < 2) return null

  const nodes = uniq.map((s, i) => `    S${i}["${mermaidLabel(s)}"]`)
  const edges = uniq.slice(1).map((_, i) => `    S${i} --> S${i + 1}`)
  return {
    source: `flowchart TD\n${nodes.join("\n")}\n${edges.join("\n")}`,
    stepCount: uniq.length,
    isSequenceDiagram: false,
  }
}

// ---------------------------------------------------------------------------
// tree

interface TreeNode {
  label: string
  children: TreeNode[]
}

function buildTreeNodes(lines: Line[]): TreeNode[] {
  const roots: TreeNode[] = []
  const stack: { indent: number; node: TreeNode }[] = []
  for (const l of lines) {
    const node: TreeNode = { label: shorten(l.text, 60), children: [] }
    while (stack.length && stack[stack.length - 1].indent >= l.indent) {
      stack.pop()
    }
    if (stack.length) stack[stack.length - 1].node.children.push(node)
    else roots.push(node)
    stack.push({ indent: l.indent, node })
  }
  return roots
}

function renderTree(nodes: TreeNode[], prefix = ""): string {
  const out: string[] = []
  nodes.forEach((n, i) => {
    const last = i === nodes.length - 1
    out.push(prefix + (last ? "└── " : "├── ") + n.label)
    if (n.children.length) {
      out.push(renderTree(n.children, prefix + (last ? "    " : "│   ")))
    }
  })
  return out.join("\n")
}

function buildTree(lines: Line[], title: string): string {
  const body = lines.slice(1)
  const nodes = buildTreeNodes(body.length ? body : lines)
  return `${title}\n${renderTree(nodes)}`
}

function hierarchyDepth(lines: Line[]): number {
  return new Set(lines.map((l) => l.indent)).size
}

// ---------------------------------------------------------------------------
// card

function buildPoints(lines: Line[]): string[] {
  const seen = new Set<string>()
  const points: string[] = []
  // skip the title line, keep the first 5 distinct substantial lines
  for (const l of lines.slice(1)) {
    const key = l.text.toLowerCase()
    if (seen.has(key) || l.text.length < 3) continue
    seen.add(key)
    points.push(l.text.length > 120 ? l.text.slice(0, 117).trimEnd() + "…" : l.text)
    if (points.length === 5) break
  }
  // single-blob input: fall back to sentences
  if (!points.length && lines[0]) {
    for (const s of lines[0].text.split(/(?<=[.!?])\s+/)) {
      const t = s.trim()
      if (t.length > 8) points.push(t)
      if (points.length === 4) break
    }
  }
  return points
}

/** standalone HTML for the card, for the download button */
export function cardHtml(title: string, points: string[]): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const items = points
    .map(
      (p, i) =>
        `      <li><span class="n">${i + 1}</span><span>${esc(p)}</span></li>`,
    )
    .join("\n")
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#fafafa; font-family:ui-sans-serif,system-ui,sans-serif; }
  .card { max-width:560px; margin:24px; background:#fff; border:1px solid #e5e5e5;
          border-radius:16px; padding:32px 36px; box-shadow:0 1px 3px rgb(0 0 0 / .06); }
  .kicker { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#737373; }
  h1 { font-size:22px; margin:6px 0 18px; color:#171717; }
  ul { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
  li { display:flex; gap:12px; align-items:baseline; font-size:15px;
       line-height:1.5; color:#404040; }
  .n { flex:none; width:22px; height:22px; border-radius:999px; background:#171717;
       color:#fff; font-size:11px; display:grid; place-items:center; transform:translateY(3px); }
</style>
</head>
<body>
  <main class="card">
    <div class="kicker">show-me</div>
    <h1>${esc(title)}</h1>
    <ul>
${items}
    </ul>
  </main>
</body>
</html>
`
}

// ---------------------------------------------------------------------------
// entry point

export function generate(input: string, mode: Mode): Visual {
  const lines = parseLines(input)
  const title = deriveTitle(lines, "Untitled")

  const flow = buildFlow(lines)
  const depth = hierarchyDepth(lines)

  const makeTree = (reason: string): Visual => ({
    kind: "tree",
    title,
    source: buildTree(lines, title),
    points: [],
    reason,
  })
  const makeMermaid = (f: FlowResult, reason: string): Visual => ({
    kind: "mermaid",
    title,
    source: f.source,
    points: [],
    reason,
  })
  const makeCard = (reason: string): Visual => {
    const points = buildPoints(lines)
    return { kind: "card", title, source: cardHtml(title, points), points, reason }
  }

  if (mode === "tree") return makeTree("you picked tree")
  if (mode === "mermaid") {
    if (flow) return makeMermaid(flow, "you picked mermaid")
    // no sequence signal: still draw something honest — a linear chain of lines
    const steps = lines.slice(1, 7).map((l) => l.text)
    if (steps.length >= 2) {
      const nodes = steps.map((s, i) => `    S${i}["${mermaidLabel(s)}"]`)
      const edges = steps.slice(1).map((_, i) => `    S${i} --> S${i + 1}`)
      return makeMermaid(
        {
          source: `flowchart TD\n${nodes.join("\n")}\n${edges.join("\n")}`,
          stepCount: steps.length,
          isSequenceDiagram: false,
        },
        "you picked mermaid",
      )
    }
    return makeCard("not enough structure for a diagram — showing a card")
  }
  if (mode === "card") return makeCard("you picked card")

  // auto: smallest clear view
  if (flow?.isSequenceDiagram) {
    return makeMermaid(flow, "actor → actor messages read as a sequence diagram")
  }
  if (flow && flow.stepCount >= 3) {
    return makeMermaid(flow, "sequential steps read as a flow")
  }
  if (depth >= 2 && lines.length >= 3) {
    return makeTree("indentation reads as a hierarchy")
  }
  if (flow) {
    return makeMermaid(flow, "sequential steps read as a flow")
  }
  return makeCard("no strong structure — distilled to one focused card")
}
