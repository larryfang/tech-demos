import { ScrollArea } from "@/components/ui/scroll-area"

export function MotionNotes({ markdown }: { markdown: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Motion.md</p>
      <ScrollArea className="min-h-0 flex-1 rounded-lg bg-muted/30 ring-1 ring-foreground/10">
        <pre
          data-motion-md
          className="whitespace-pre-wrap px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground"
        >
          {markdown}
        </pre>
      </ScrollArea>
    </div>
  )
}
