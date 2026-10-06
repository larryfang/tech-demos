"use client";

import { useEffect, useRef } from "react";
import { currentBeatIndex } from "@/lib/beats";
import { styleLabel } from "@/lib/catalog";
import { drawScene } from "@/lib/paint";
import type { MotionSettings, ScenePlan, StyleId } from "@/lib/types";

const VIEW_W = 1280;
const VIEW_H = 720;

export function Stage({
  canvasRef,
  style,
  plan,
  time,
  settings,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  style: StyleId;
  plan: ScenePlan;
  time: number;
  settings: MotionSettings;
}) {
  const frame = useRef({ style, plan, time, settings });

  useEffect(() => {
    frame.current = { style, plan, time, settings };
  }, [style, plan, time, settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const current = frame.current;
      const beatIndex = currentBeatIndex(current.plan.beats, current.time);
      const beat = current.plan.beats[Math.max(0, beatIndex)];
      const progress =
        current.plan.duration > 0 ? current.time / current.plan.duration : 0;
      drawScene(current.style, {
        ctx,
        width: VIEW_W,
        height: VIEW_H,
        time: current.time,
        progress,
        intensity: current.settings.intensity,
        motif: beat?.motif ?? "pulse",
        caption: beat?.caption ?? "",
        styleLabel: styleLabel(current.style),
      });
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_W}
      height={VIEW_H}
      className="h-auto w-full bg-zinc-900"
      aria-label="Art motion stage"
    />
  );
}
