import { useEffect, useRef } from "react"
import type { HtmlScene } from "@/engine"
import type { LayerVisual } from "@/engine/interpolate"

type SceneLayerProps = {
  scene: HtmlScene
  localMs: number
  visual: LayerVisual
}

export function SceneLayer({ scene, localMs, visual }: SceneLayerProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<Animation | null>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const frames = scene.keyframes.map((kf) => ({
      offset: kf.at,
      transform: `translate(${kf.x ?? 0}%, ${kf.y ?? 0}%) scale(${kf.scale ?? 1}) rotate(${kf.rotate ?? 0}deg)`,
    }))
    const anim = node.animate(frames, {
      duration: Math.max(1, scene.durationMs),
      fill: "both",
      easing: "linear",
    })
    anim.pause()
    animRef.current = anim
    return () => {
      anim.cancel()
      animRef.current = null
    }
  }, [scene.id, scene.durationMs, scene.keyframes])

  useEffect(() => {
    const anim = animRef.current
    if (anim) anim.currentTime = localMs
  }, [localMs])

  return (
    <div
      className="om-layer"
      data-scene-layer={scene.id}
      style={{
        opacity: visual.opacity,
        clipPath: visual.clipPath === "none" ? undefined : visual.clipPath,
        transform: `translate(${visual.extraX}%, 0) scale(${visual.extraScale})`,
        zIndex: scene.index + 1,
      }}
    >
      <div
        ref={nodeRef}
        className="h-full w-full"
        style={{ transformOrigin: "center center" }}
        dangerouslySetInnerHTML={{ __html: scene.html }}
      />
    </div>
  )
}
