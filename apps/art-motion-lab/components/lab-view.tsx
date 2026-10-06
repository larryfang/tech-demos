"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "@/components/stage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { currentBeatIndex, formatClock, stubPlan } from "@/lib/beats";
import { SAMPLES, STRUCTURES, STYLES } from "@/lib/catalog";
import { downloadBlob, pickRecorderMime } from "@/lib/recorder";
import type {
  BeatsResult,
  MotionSettings,
  ScenePlan,
  StructureId,
  StyleId,
} from "@/lib/types";

const DEFAULT = SAMPLES[0];

export function LabView({ liveAvailable: initialLive }: { liveAvailable: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const exportingRef = useRef(false);
  const speedRef = useRef(1);
  const durationRef = useRef(10);
  const stopExportRef = useRef<(() => void) | null>(null);

  const [liveAvailable, setLiveAvailable] = useState(initialLive);
  const [wantLive, setWantLive] = useState(false);
  const [narration, setNarration] = useState(DEFAULT.narration);
  const [style, setStyle] = useState<StyleId>(DEFAULT.style);
  const [structure, setStructure] = useState<StructureId>(DEFAULT.structure);
  const [plan, setPlan] = useState<ScenePlan>(() =>
    stubPlan({
      narration: DEFAULT.narration,
      style: DEFAULT.style,
      structure: DEFAULT.structure,
    }),
  );
  const [mode, setMode] = useState<BeatsResult["mode"]>("fixture");
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const [settings, setSettings] = useState<MotionSettings>({
    speed: 1,
    intensity: 1,
  });
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);

  const applyPlan = (next: ScenePlan, nextMode: BeatsResult["mode"], reason?: string) => {
    setPlan(next);
    setMode(nextMode);
    setFallbackReason(reason);
    setTime(0);
    timeRef.current = 0;
    setPlaying(false);
    playingRef.current = false;
  };

  useEffect(() => {
    durationRef.current = plan.duration;
    speedRef.current = settings.speed;
  }, [plan.duration, settings.speed]);

  useEffect(() => {
    void fetch("/api/status")
      .then((res) => res.json())
      .then((data: { liveAvailable?: boolean }) => {
        if (typeof data.liveAvailable === "boolean") setLiveAvailable(data.liveAvailable);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (playingRef.current) {
        const next = Math.min(
          durationRef.current,
          timeRef.current + dt * speedRef.current,
        );
        timeRef.current = next;
        setTime(next);
        if (next >= durationRef.current) {
          playingRef.current = false;
          setPlaying(false);
          if (exportingRef.current) {
            stopExportRef.current?.();
          }
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const loadSample = (id: string) => {
    const sample = SAMPLES.find((item) => item.id === id);
    if (!sample) return;
    setNarration(sample.narration);
    setStyle(sample.style);
    setStructure(sample.structure);
    applyPlan(
      stubPlan({
        narration: sample.narration,
        style: sample.style,
        structure: sample.structure,
      }),
      "fixture",
    );
    setComposeError(null);
    setExportNote(null);
  };

  const composeFixture = () => {
    applyPlan(stubPlan({ narration, style, structure }), "fixture");
    setComposeError(null);
  };

  const compose = async () => {
    setBusy(true);
    setComposeError(null);
    try {
      const response = await fetch("/api/beats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          narration,
          style,
          structure,
          live: wantLive,
        }),
      });
      const payload = (await response.json()) as BeatsResult | { ok: false; error: string };
      if (!payload.ok) {
        composeFixture();
        setComposeError(payload.error);
        return;
      }
      applyPlan(payload.plan, payload.mode, payload.fallbackReason);
      if (typeof payload.liveAvailable === "boolean") {
        setLiveAvailable(payload.liveAvailable);
      }
    } catch (error) {
      composeFixture();
      setComposeError(error instanceof Error ? error.message : "Compose failed");
    } finally {
      setBusy(false);
    }
  };

  const pickStyle = (next: StyleId) => {
    setStyle(next);
    applyPlan(stubPlan({ narration, style: next, structure }), "fixture");
  };

  const pickStructure = (next: StructureId) => {
    setStructure(next);
    applyPlan(stubPlan({ narration, style, structure: next }), "fixture");
  };

  const togglePlay = () => {
    if (time >= plan.duration - 0.05) {
      timeRef.current = 0;
      setTime(0);
    }
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
  };

  const exportClip = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = pickRecorderMime();
    if (!mime || typeof canvas.captureStream !== "function") {
      setExportNote("This browser cannot record WebM from a canvas.");
      return;
    }

    setExportNote(null);
    setExporting(true);
    exportingRef.current = true;
    timeRef.current = 0;
    setTime(0);
    playingRef.current = true;
    setPlaying(true);

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const finished = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("MediaRecorder failed"));
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
    });

    stopExportRef.current = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };

    recorder.start();
    try {
      const blob = await finished;
      downloadBlob(blob, `art-motion-lab-${style}.webm`);
      setExportNote(`Saved ${style} clip (${Math.round(blob.size / 1024)} KB).`);
    } catch (error) {
      setExportNote(error instanceof Error ? error.message : "Export failed");
    } finally {
      stream.getTracks().forEach((track) => track.stop());
      stopExportRef.current = null;
      setExporting(false);
      exportingRef.current = false;
      setPlaying(false);
      playingRef.current = false;
    }
  }, [style]);

  const beatIndex = useMemo(() => currentBeatIndex(plan.beats, time), [plan.beats, time]);

  return (
    <div className="min-h-full bg-zinc-50 text-foreground">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Parametric narrated painting
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Art Motion Lab</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Inspired by{" "}
                <a
                  className="underline underline-offset-2"
                  href="https://github.com/alchaincyf/huashu-art-motion"
                >
                  huashu-art-motion
                </a>{" "}
                (花叔). Original fixture-first web lab — not a fork or redistribution of the
                skill pack.
              </p>
            </div>
            <Badge variant={liveAvailable ? "default" : "secondary"}>
              {liveAvailable ? "Live ready" : "Fixture"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <section className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Narration</CardTitle>
              <CardDescription>One or two lines. The lab times them to the painting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={narration}
                onChange={(event) => setNarration(event.target.value)}
                rows={3}
                maxLength={220}
                aria-label="Narration"
              />
              <div className="flex flex-wrap gap-2">
                {SAMPLES.map((sample) => (
                  <Button
                    key={sample.id}
                    type="button"
                    size="sm"
                    variant={
                      narration === sample.narration && style === sample.style
                        ? "default"
                        : "outline"
                    }
                    onClick={() => loadSample(sample.id)}
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Art style</CardTitle>
              <CardDescription>Six original canvas starters — not the skill pack scenes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {STYLES.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={style === item.id ? "default" : "outline"}
                  title={item.hint}
                  onClick={() => pickStyle(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Narration structure</CardTitle>
              <CardDescription>How the line is cut into timed captions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {STRUCTURES.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={structure === item.id ? "default" : "outline"}
                  title={item.hint}
                  onClick={() => pickStructure(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Motion</CardTitle>
              <CardDescription>Tweaks apply live while the clip plays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="speed">Speed</Label>
                  <span className="font-mono tabular-nums">{settings.speed.toFixed(1)}×</span>
                </div>
                <Slider
                  id="speed"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[settings.speed]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    if (typeof next === "number") {
                      setSettings((current) => ({ ...current, speed: next }));
                    }
                  }}
                  aria-label="Playback speed"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="intensity">Intensity</Label>
                  <span className="font-mono tabular-nums">
                    {settings.intensity.toFixed(1)}
                  </span>
                </div>
                <Slider
                  id="intensity"
                  min={0.3}
                  max={1.8}
                  step={0.1}
                  value={[settings.intensity]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    if (typeof next === "number") {
                      setSettings((current) => ({ ...current, intensity: next }));
                    }
                  }}
                  aria-label="Motion intensity"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wantLive}
                  disabled={!liveAvailable}
                  onChange={(event) => setWantLive(event.target.checked)}
                />
                Use live model for beats
                {!liveAvailable ? (
                  <span className="text-muted-foreground">(no key)</span>
                ) : null}
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" disabled={busy} onClick={() => void compose()}>
                  {busy ? "Composing…" : "Compose beats"}
                </Button>
                <Button type="button" onClick={togglePlay} disabled={exporting}>
                  {playing ? "Pause" : "Play"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={exporting}
                  onClick={() => void exportClip()}
                >
                  {exporting ? "Exporting…" : "Export WebM"}
                </Button>
              </div>
              {composeError ? <p className="text-destructive text-xs">{composeError}</p> : null}
              {fallbackReason ? (
                <p className="text-muted-foreground text-xs">Fell back to fixture: {fallbackReason}</p>
              ) : null}
              {exportNote ? <p className="text-xs text-muted-foreground">{exportNote}</p> : null}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{plan.title}</CardTitle>
              <CardDescription>
                {mode === "live" ? "Live beats" : "Fixture beats"} · {formatClock(time)} /{" "}
                {formatClock(plan.duration)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                <Stage
                  canvasRef={canvasRef}
                  style={style}
                  plan={plan}
                  time={time}
                  settings={settings}
                />
              </div>
              <ol className="space-y-2">
                {plan.beats.map((beat, index) => (
                  <li
                    key={`${beat.at}-${beat.caption}`}
                    data-active={index === beatIndex ? "true" : "false"}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      index === beatIndex
                        ? "border-foreground/20 bg-amber-50"
                        : "border-transparent bg-white"
                    }`}
                  >
                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                      {formatClock(beat.at)}
                    </span>
                    {beat.caption}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
