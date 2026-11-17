import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { HtmlScene } from "@/engine"
import type { SceneEdit, TransitionKind } from "@/fixtures/types"

const TRANSITIONS: TransitionKind[] = ["cut", "fade", "wipe", "slide", "zoom"]

type SceneInspectorProps = {
  scene: HtmlScene | null
  onChange: (id: string, edit: SceneEdit) => void
}

export function SceneInspector({ scene, onChange }: SceneInspectorProps) {
  if (!scene) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a scene on the timeline to edit copy, colour, duration and transition.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3" data-inspector>
      <div>
        <p className="text-sm font-medium">{scene.label}</p>
        <p className="text-xs text-muted-foreground">
          {scene.layout} · {scene.transitionIn}
        </p>
      </div>

      {scene.slots.map((slot) => (
        <div key={slot.id} className="grid gap-1.5">
          <Label htmlFor={`slot-${slot.id}`}>{slot.role}</Label>
          {slot.text.length > 42 ? (
            <Textarea
              id={`slot-${slot.id}`}
              value={slot.text}
              rows={2}
              onChange={(event) =>
                onChange(scene.id, { text: { [slot.id]: event.target.value } })
              }
            />
          ) : (
            <Input
              id={`slot-${slot.id}`}
              value={slot.text}
              onChange={(event) =>
                onChange(scene.id, { text: { [slot.id]: event.target.value } })
              }
            />
          )}
        </div>
      ))}

      <div className="grid gap-1.5">
        <Label htmlFor="duration">Duration (ms)</Label>
        <Input
          id="duration"
          type="number"
          min={400}
          max={8000}
          step={100}
          value={scene.durationMs}
          onChange={(event) =>
            onChange(scene.id, { durationMs: Number(event.target.value) })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="transition">Transition</Label>
          <select
            id="transition"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
            value={scene.transitionIn}
            onChange={(event) =>
              onChange(scene.id, {
                transitionIn: event.target.value as TransitionKind,
                transitionMs:
                  event.target.value === "cut" ? 0 : Math.max(scene.transitionMs, 280),
              })
            }
          >
            {TRANSITIONS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="transitionMs">Overlap (ms)</Label>
          <Input
            id="transitionMs"
            type="number"
            min={0}
            max={1200}
            step={20}
            value={scene.transitionMs}
            disabled={scene.transitionIn === "cut"}
            onChange={(event) =>
              onChange(scene.id, { transitionMs: Number(event.target.value) })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["primary", "accent", "background", "foreground"] as const).map((key) => (
          <div key={key} className="grid gap-1.5">
            <Label htmlFor={`color-${key}`}>{key}</Label>
            <Input
              id={`color-${key}`}
              type="color"
              value={scene.tokens[key]}
              onChange={(event) =>
                onChange(scene.id, { colors: { [key]: event.target.value } })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
