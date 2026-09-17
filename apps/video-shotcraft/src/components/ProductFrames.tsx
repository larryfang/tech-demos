import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

function FixtureMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute top-1.5 right-1.5 z-20 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-white uppercase",
        className,
      )}
    >
      Fixture
    </span>
  )
}

function Paper({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#f2eee6] text-[#13110f]",
        className,
      )}
    >
      <FixtureMark />
      {children}
    </div>
  )
}

export function WordmarkFrame() {
  return (
    <Paper className="flex flex-col items-center justify-center gap-2">
      <div className="preview-crosshair absolute inset-0 opacity-40" />
      <p className="preview-stamp font-serif text-[22px] tracking-[0.28em]">
        MAILGUN
      </p>
      <p className="preview-stamp-late font-serif text-[28px] tracking-[0.18em] text-[#955905]">
        INSPECT
      </p>
      <p className="preview-kicker text-[10px] tracking-[0.22em] text-[#65635f] uppercase">
        Email testing on AgentExchange
      </p>
    </Paper>
  )
}

export function TitleCardFrame({
  line,
  accent,
}: {
  line: string
  accent: string
}) {
  return (
    <Paper className="flex flex-col items-center justify-center px-6 text-center">
      <p className="preview-stamp font-serif text-[18px] leading-snug">
        {line}{" "}
        <em className="text-[#955905] italic">{accent}</em>
      </p>
      <div className="preview-rule mt-3 h-px w-16 bg-[#955905]" />
    </Paper>
  )
}

export function ProblemDeskFrame() {
  return (
    <Paper className="p-3">
      <div className="mb-2 flex gap-1 text-[9px]">
        {["Litmus", "Outlook web", "Gmail", "Slack QA"].map((tab, i) => (
          <span
            key={tab}
            className={cn(
              "rounded-t border border-[#d8d2c6] bg-[#ebe6dc] px-1.5 py-0.5",
              i === 0 && "bg-white",
            )}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="preview-crane origin-top rounded border border-[#d8d2c6] bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-[10px] text-[#65635f]">
          <span>Campaign · Spring launch</span>
          <span className="text-[#b42318]">3 clients failed</span>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded bg-[#13110f]" />
          <div className="h-14 rounded bg-[#f6d0d0]" />
          <div className="ml-auto h-5 w-20 truncate rounded bg-[#00a1e0] text-[8px] leading-5 text-white">
            Shop now Shop n
          </div>
        </div>
      </div>
    </Paper>
  )
}

export function SalesforceLwcFrame() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#032d60] text-white">
      <FixtureMark />
      <div className="flex h-6 items-center gap-2 bg-[#0176d3] px-2 text-[9px]">
        <span className="font-semibold">Salesforce</span>
        <span className="opacity-80">Agentforce Marketing</span>
        <span className="ml-auto rounded bg-white/15 px-1.5">Mailgun Inspect</span>
      </div>
      <div className="grid h-[calc(100%-1.5rem)] grid-cols-[4.5rem_1fr] gap-2 p-2">
        <div className="space-y-1 rounded bg-white/10 p-1.5 text-[8px] text-white/80">
          <p>Journey</p>
          <p>Content</p>
          <p className="rounded bg-[#f22f46] px-1 text-white">Inspect</p>
          <p>Send</p>
        </div>
        <div className="preview-spotlight relative rounded bg-[#f2eee6] p-2 text-[#13110f]">
          <p className="text-[9px] tracking-wide text-[#65635f] uppercase">
            Lightning Web Component
          </p>
          <p className="font-serif text-[15px]">Mailgun Inspect</p>
          <div className="preview-hero-card mt-2 rounded border border-[#d8d2c6] bg-white p-2 shadow-md">
            <p className="text-[10px] font-medium">Welcome series · step 2</p>
            <p className="text-[9px] text-[#65635f]">104 clients · 2 issues</p>
            <div className="mt-1 h-8 rounded bg-[#f4efe4]" />
          </div>
        </div>
      </div>
    </div>
  )
}

const CLIENTS = [
  "Outlook 365",
  "Gmail web",
  "Apple Mail",
  "Outlook iOS",
  "Gmail Android",
  "Yahoo",
  "Outlook 2016",
  "iPad Mail",
]

export function ClientGridFrame() {
  return (
    <Paper className="p-2">
      <p className="mb-1 text-[9px] tracking-wide text-[#65635f] uppercase">
        100+ clients · fixture grid
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {CLIENTS.map((name, i) => (
          <div
            key={name}
            className="preview-deal rounded border border-[#d8d2c6] bg-white p-1.5 shadow-sm"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="mb-1 h-6 rounded bg-[#efe8d8]" />
            <p className="text-[8px] leading-tight">{name}</p>
          </div>
        ))}
      </div>
    </Paper>
  )
}

export function FilterFrame() {
  return (
    <Paper className="p-2">
      <div className="mb-2 flex items-center gap-1 rounded border border-[#d8d2c6] bg-white px-2 py-1 text-[10px]">
        <span className="text-[#65635f]">Filter</span>
        <span className="preview-type font-mono">outlook</span>
        <span className="preview-caret h-3 w-px bg-[#955905]" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {["Outlook 365", "Outlook iOS", "Outlook 2016"].map((name) => (
          <div key={name} className="preview-converge rounded border border-[#955905]/40 bg-white p-1.5">
            <div className="mb-1 h-8 rounded bg-[#efe8d8]" />
            <p className="text-[8px]">{name}</p>
          </div>
        ))}
        {["Gmail web", "Apple Mail", "Yahoo"].map((name) => (
          <div key={name} className="preview-fade rounded border border-[#d8d2c6] bg-white/50 p-1.5 opacity-30">
            <div className="mb-1 h-8 rounded bg-[#efe8d8]" />
            <p className="text-[8px]">{name}</p>
          </div>
        ))}
      </div>
    </Paper>
  )
}

const ISSUES = [
  { title: "Clipped CTA", detail: "Outlook 365 · button overflow" },
  { title: "Dark-mode invert", detail: "Apple Mail · logo unreadable" },
  { title: "Missing alt", detail: "Gmail Android · hero image" },
  { title: "Gap unsupported", detail: "Outlook 2016 · CSS gap" },
]

export function IssueRowsFrame() {
  return (
    <Paper className="p-2">
      <p className="mb-1 text-[9px] tracking-wide text-[#65635f] uppercase">
        Pre-send issues
      </p>
      <div className="space-y-1.5">
        {ISSUES.map((issue, i) => (
          <div
            key={issue.title}
            className="preview-embed flex items-center justify-between rounded border border-[#d8d2c6] bg-white px-2 py-1.5"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div>
              <p className="text-[11px] font-medium">{issue.title}</p>
              <p className="text-[9px] text-[#65635f]">{issue.detail}</p>
            </div>
            <span className="rounded bg-[#f22f46]/10 px-1.5 text-[9px] text-[#f22f46]">
              fail
            </span>
          </div>
        ))}
      </div>
    </Paper>
  )
}

export function ClientStackFrame() {
  return (
    <Paper className="flex items-center justify-between gap-3 p-3">
      <div className="relative h-28 w-32">
        {CLIENTS.slice(0, 5).map((name, i) => (
          <div
            key={name}
            className="preview-stack absolute inset-x-0 rounded border border-[#d8d2c6] bg-white px-2 py-1.5 text-[10px] shadow"
            style={{
              top: `${i * 14}px`,
              animationDelay: `${i * 140}ms`,
              zIndex: 5 - i,
            }}
          >
            {name}
          </div>
        ))}
      </div>
      <div className="text-right">
        <p className="text-[9px] tracking-wide text-[#65635f] uppercase">Clients</p>
        <p className="preview-counter font-serif text-4xl text-[#955905]">104</p>
        <p className="text-[10px] text-[#65635f]">and devices</p>
      </div>
    </Paper>
  )
}

export function AnalysisFrame() {
  return (
    <Paper className="grid grid-cols-[1fr_5.5rem] gap-2 p-2">
      <div className="rounded border border-[#d8d2c6] bg-white p-2 font-mono text-[9px] leading-relaxed">
        <p className="text-[#65635f]">inspect / analyze</p>
        <p className="preview-type">
          Outlook 2016 — <span className="text-[#b42318]">no CSS gap</span>
        </p>
        <p className="preview-type-late">Apple Mail — dark-mode invert on logo.png</p>
        <p className="preview-type-late2">Gmail — CTA readable · pass</p>
      </div>
      <div className="space-y-1 text-[8px]">
        {["Welcome v3", "Welcome v2", "Promo 08"].map((item, i) => (
          <div
            key={item}
            className="preview-embed rounded border border-[#d8d2c6] bg-white px-1.5 py-1"
            style={{ animationDelay: `${400 + i * 120}ms` }}
          >
            {item}
          </div>
        ))}
      </div>
    </Paper>
  )
}

export function ShipFrame() {
  return (
    <Paper className="flex flex-col items-center justify-center">
      <div className="preview-assemble mb-2 flex -space-x-2">
        {["OL", "GM", "AM", "YH"].map((code) => (
          <span
            key={code}
            className="grid size-8 place-items-center rounded-full border border-[#d8d2c6] bg-white text-[9px] font-medium shadow"
          >
            {code}
          </span>
        ))}
      </div>
      <p className="preview-stamp font-serif text-[20px]">Ship with confidence</p>
      <p className="preview-kicker text-[10px] text-[#65635f]">
        Rerun on demand · stay in Salesforce
      </p>
    </Paper>
  )
}

export function BeforeAfterFrame() {
  return (
    <Paper className="grid grid-cols-2">
      <div className="border-r border-[#d8d2c6] p-2">
        <p className="text-[9px] tracking-wide text-[#b42318] uppercase">Before</p>
        <div className="mt-2 h-16 rounded bg-[#f6d0d0]" />
        <div className="mt-2 h-4 w-16 truncate rounded bg-[#00a1e0] text-[8px] text-white">
          Shop
        </div>
      </div>
      <div className="preview-wipe bg-[#f8f4ea] p-2">
        <p className="text-[9px] tracking-wide text-[#0f6d3c] uppercase">After</p>
        <div className="mt-2 h-16 rounded bg-[#efe8d8]" />
        <div className="mt-2 h-5 w-20 rounded bg-[#f22f46] text-center text-[8px] leading-5 text-white">
          Shop now
        </div>
      </div>
    </Paper>
  )
}

export function WaterfallFrame() {
  return (
    <Paper className="p-2">
      <div className="preview-waterfall grid h-full grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded border border-[#d8d2c6] bg-white p-1">
            <div className="h-10 rounded bg-[#efe8d8]" />
            <p className="mt-1 text-[8px]">Client {i + 1}</p>
          </div>
        ))}
      </div>
    </Paper>
  )
}

export function AgentToolsFrame() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1b1b1f] text-[#e8e6e1]">
      <FixtureMark />
      <div className="flex h-5 items-center gap-2 bg-[#111114] px-2 text-[8px] text-white/60">
        <span>Cursor</span>
        <span>agent-tools / conversation.ts</span>
      </div>
      <div className="grid h-[calc(100%-1.25rem)] grid-cols-[7rem_1fr]">
        <div className="border-r border-white/10 p-2 text-[8px]">
          <p className="mb-1 text-white/40 uppercase">Skills</p>
          <p>sinch-conversation</p>
          <p>sinch-voice</p>
          <p>sinch-mailgun</p>
          <p className="mt-2 text-white/40 uppercase">MCP</p>
          <p className="text-[#7dd3a8]">connected</p>
        </div>
        <div className="p-2 font-mono text-[9px] leading-relaxed">
          <p className="text-white/40"># fixture — Agent Tools secondary card</p>
          <p>sinch.conversation.messages.send(&#123;</p>
          <p className="pl-3">channel: &quot;SMS&quot;,</p>
          <p className="pl-3">to: user.phone,</p>
          <p>&#125;)</p>
        </div>
      </div>
    </div>
  )
}

export function GenericCardsFrame({ label }: { label: string }) {
  return (
    <Paper className="flex items-center justify-center p-3">
      <div className="preview-fan flex -space-x-6">
        {["A", "B", "C"].map((id, i) => (
          <div
            key={id}
            className="h-20 w-16 rounded-lg border border-[#d8d2c6] bg-white p-2 shadow"
            style={{ transform: `rotate(${(i - 1) * 8}deg)` }}
          >
            <div className="h-8 rounded bg-[#efe8d8]" />
            <p className="mt-1 text-[8px]">{label}</p>
          </div>
        ))}
      </div>
    </Paper>
  )
}

export function GlitchFrame() {
  return (
    <Paper className="flex flex-col items-center justify-center">
      <p className="preview-glitch font-mono text-sm tracking-widest">
        RENDERING…
      </p>
      <p className="mt-2 text-[10px] text-[#65635f]">status slot · fixture</p>
    </Paper>
  )
}
