import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatClock } from "@/engine/engine"
import type { NoteSection } from "@/fixtures/types"

type Props = {
  unlocked: NoteSection[]
  locked: NoteSection[]
}

export function NotesPanel({ unlocked, locked }: Props) {
  return (
    <Card className="flex min-h-0 flex-1 flex-col py-0">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm tracking-wide uppercase">
            Structured notes
          </CardTitle>
          <Badge variant="outline">
            {unlocked.length}/{unlocked.length + locked.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-0">
        <ScrollArea className="h-full">
          <div className="space-y-4 px-4 py-3">
            {unlocked.map((section) => (
              <section
                key={section.id}
                data-note-id={section.id}
                className="note-in space-y-2"
              >
                <header className="flex items-baseline justify-between gap-2">
                  <h3 className="font-heading text-sm font-medium">
                    {section.title}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {section.titleZh}
                    </span>
                  </h3>
                  <Badge variant="secondary">live</Badge>
                </header>
                {section.body ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                ) : null}
                {section.items ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {section.terms ? (
                  <dl className="space-y-2 text-sm">
                    {section.terms.map((term) => (
                      <div key={term.term}>
                        <dt className="font-medium">{term.term}</dt>
                        <dd className="text-muted-foreground">{term.gloss}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </section>
            ))}
            {locked.map((section) => (
              <section
                key={section.id}
                data-note-locked={section.id}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground ring-1 ring-dashed ring-foreground/10"
              >
                <span className="font-medium text-foreground/70">
                  {section.title}
                </span>
                <span className="ml-2">{section.titleZh}</span>
                <span className="ml-2 font-mono tabular-nums">
                  unlocks {formatClock(section.unlockAtMs)}
                </span>
              </section>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
