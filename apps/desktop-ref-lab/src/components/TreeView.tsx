import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DisplayNode } from "@/engine/types"

function kindClass(kind: DisplayNode["kind"]): string {
  if (kind === "added") return "node-added"
  if (kind === "removed") return "node-removed"
  if (kind === "changed") return "node-changed"
  return ""
}

function kindMark(kind: DisplayNode["kind"]): string {
  if (kind === "added") return "+"
  if (kind === "removed") return "−"
  if (kind === "changed") return "~"
  return ""
}

function shouldOpen(node: DisplayNode, depth: number): boolean {
  if (depth < 4) return true
  if (node.kind !== "unchanged") return true
  return node.children.some((child) => child.kind !== "unchanged")
}

function NodeRow({
  node,
  depth,
  selectedRef,
  onSelect,
}: {
  node: DisplayNode
  depth: number
  selectedRef?: string
  onSelect: (ref: string) => void
}) {
  const [open, setOpen] = useState(() => shouldOpen(node, depth))
  const hasKids = node.children.length > 0
  const selected = Boolean(node.ref_id && node.ref_id === selectedRef)
  const mark = kindMark(node.kind)
  const label = node.name ?? node.value ?? ""

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-1 rounded-md px-1.5 py-1 text-[13px] leading-5",
          kindClass(node.kind),
          selected && "ring-1 ring-ring",
          node.ref_id && node.kind !== "removed" && "cursor-pointer hover:bg-muted/60",
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          if (node.ref_id) onSelect(node.ref_id)
        }}
        data-kind={node.kind}
        data-ref={node.ref_id}
      >
        <button
          type="button"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-label={open ? "Collapse" : "Expand"}
          disabled={!hasKids}
          onClick={(event) => {
            event.stopPropagation()
            setOpen((value) => !value)
          }}
        >
          {hasKids ? (
            open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />
          ) : (
            <span className="block size-3.5" />
          )}
        </button>
        {mark ? (
          <span
            className={cn(
              "mt-px w-3 shrink-0 font-mono text-[11px] font-semibold",
              node.kind === "added" && "text-emerald-600 dark:text-emerald-400",
              node.kind === "removed" && "text-red-600 dark:text-red-400",
              node.kind === "changed" && "text-amber-700 dark:text-amber-400",
            )}
          >
            {mark}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="shrink-0 font-medium text-muted-foreground">{node.role}</span>
        {label ? <span className="min-w-0 truncate text-foreground">{label}</span> : null}
        {node.states?.length ? (
          <span className="shrink-0 text-[11px] text-muted-foreground">{node.states.join(", ")}</span>
        ) : null}
        {node.changes?.length ? (
          <span className="shrink-0 text-[11px] text-amber-700 dark:text-amber-400">
            {node.changes.join(" · ")}
          </span>
        ) : null}
        {node.ref_id ? (
          <button
            type="button"
            className={cn(
              "ref-chip ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground",
              selected && "bg-primary text-primary-foreground hover:text-primary-foreground",
            )}
            onClick={(event) => {
              event.stopPropagation()
              if (node.ref_id) onSelect(node.ref_id)
            }}
          >
            {node.ref_id}
          </button>
        ) : null}
      </div>
      {open && hasKids
        ? node.children.map((child) => (
            <NodeRow
              key={`${child.identity}:${child.kind}:${child.ref_id ?? child.role}`}
              node={child}
              depth={depth + 1}
              selectedRef={selectedRef}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  )
}

export function TreeView({
  root,
  selectedRef,
  onSelect,
}: {
  root: DisplayNode
  selectedRef?: string
  onSelect: (ref: string) => void
}) {
  const node = useMemo(() => root, [root])
  return (
    <div data-testid="ax-tree" className="font-sans">
      <NodeRow node={node} depth={0} selectedRef={selectedRef} onSelect={onSelect} />
    </div>
  )
}
