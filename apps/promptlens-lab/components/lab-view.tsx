"use client";

/* Mixed public fixture URLs and paste/upload data URLs. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FIXTURES, SCENE_LABELS } from "@/lib/fixtures";
import { stringifyPack, stubPack } from "@/lib/stub";
import type { AnalyzeResult, AnalyzeSource, SceneTag } from "@/lib/types";

type Preview =
  | { kind: "fixture"; id: string; url: string; filename: string }
  | { kind: "file"; url: string; filename: string; dataUrl: string; source: AnalyzeSource };

const INITIAL_PROMPTS = stringifyPack(stubPack({ fixtureId: "portrait", source: "fixture" }));

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function LabView({ liveAvailable: initialLive }: { liveAvailable: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [liveAvailable, setLiveAvailable] = useState(initialLive);
  const [wantLive, setWantLive] = useState(false);
  const [preview, setPreview] = useState<Preview>({
    kind: "fixture",
    id: "portrait",
    url: "/fixtures/portrait.png",
    filename: "portrait.png",
  });
  const [scene, setScene] = useState<SceneTag>("portrait");
  const [mode, setMode] = useState<AnalyzeResult["mode"]>("fixture");
  const [prompts, setPrompts] = useState(INITIAL_PROMPTS);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/status")
      .then((res) => res.json())
      .then((data: { liveAvailable?: boolean }) => {
        if (typeof data.liveAvailable === "boolean") setLiveAvailable(data.liveAvailable);
      })
      .catch(() => undefined);
  }, []);

  const sceneLabel = SCENE_LABELS[scene];

  const analyze = useCallback(
    async (next: Preview, live = wantLive) => {
      setBusy(true);
      setError(null);
      setFallbackReason(undefined);
      try {
        const body =
          next.kind === "fixture"
            ? { fixtureId: next.id, source: "fixture" as const, live }
            : {
                image: next.dataUrl,
                filename: next.filename,
                source: next.source,
                live,
              };
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as AnalyzeResult | { ok: false; error?: string };
        if (!payload.ok) {
          setError("error" in payload ? payload.error || "Analyze failed" : "Analyze failed");
          return;
        }
        setScene(payload.scene);
        setMode(payload.mode);
        setPrompts(payload.prompts);
        setFallbackReason(payload.fallbackReason);
        if (typeof payload.liveAvailable === "boolean") setLiveAvailable(payload.liveAvailable);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analyze failed");
      } finally {
        setBusy(false);
      }
    },
    [wantLive],
  );

  const selectFixture = (id: string) => {
    const card = FIXTURES.find((item) => item.id === id);
    if (!card) return;
    const next: Preview = {
      kind: "fixture",
      id: card.id,
      url: card.src,
      filename: card.filename,
    };
    setPreview(next);
    void analyze(next);
  };

  const takeFile = useCallback(
    async (file: File, source: AnalyzeSource) => {
      if (!file.type.startsWith("image/")) {
        setError("Please drop or paste an image file.");
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      const next: Preview = {
        kind: "file",
        url: dataUrl,
        filename: file.name || (source === "paste" ? "clipboard.png" : "upload.png"),
        dataUrl,
        source,
      };
      setPreview(next);
      void analyze(next);
    },
    [analyze],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = [...(event.clipboardData?.files ?? [])].find((item) => item.type.startsWith("image/"));
      if (file) void takeFile(file, "paste");
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [takeFile]);

  const markCopied = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1400);
  };

  const headerBadge = useMemo(() => {
    if (mode === "live") return { label: "Live", variant: "default" as const };
    if (liveAvailable) return { label: "Live ready", variant: "secondary" as const };
    return { label: "Fixture", variant: "secondary" as const };
  }, [liveAvailable, mode]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-medium tracking-tight">PromptLens Lab</h1>
            <Badge variant={headerBadge.variant}>{headerBadge.label}</Badge>
            <Badge variant="outline">
              {sceneLabel.zh} / {sceneLabel.en}
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Reverse an image into editable Chinese, English, and JSON image-gen prompts. Inspired by
            PromptLens — this is an original fixture-first web lab, not a redistribution of the
            proprietary extension.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sample fixtures</CardTitle>
              <CardDescription>Zero-key path. Click a card to fill the prompt panes.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {FIXTURES.map((card) => {
                const selected = preview.kind === "fixture" && preview.id === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => selectFixture(card.id)}
                    className={`overflow-hidden rounded-lg text-left ring-1 transition-shadow ${
                      selected ? "ring-foreground" : "ring-foreground/10 hover:ring-foreground/30"
                    }`}
                  >
                    <img src={card.src} alt={card.title} className="aspect-4/3 w-full object-cover" />
                    <div className="space-y-0.5 p-2">
                      <div className="text-sm font-medium">{card.titleZh}</div>
                      <div className="text-xs text-muted-foreground">{card.title}</div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload or paste</CardTitle>
              <CardDescription>Local file or clipboard image. Stub still runs without a key.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0];
                  if (file) void takeFile(file, "upload");
                }}
                onPaste={(event) => {
                  const file = [...event.clipboardData.files].find((item) => item.type.startsWith("image/"));
                  if (file) void takeFile(file, "paste");
                }}
              >
                Drop, paste, or choose an image
                <Input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void takeFile(file, "upload");
                    event.target.value = "";
                  }}
                />
              </label>
              <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
                <img src={preview.url} alt={preview.filename} className="max-h-72 w-full object-contain bg-muted" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{preview.filename}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-foreground"
                    checked={wantLive}
                    disabled={!liveAvailable}
                    onChange={(event) => setWantLive(event.target.checked)}
                  />
                  Use live vision
                </label>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => void analyze(preview)}
              >
                {busy ? "Analyzing…" : wantLive && liveAvailable ? "Analyze with live vision" : "Analyze with fixture stub"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Prompts</CardTitle>
            <CardDescription>
              Scene tag plus editable ZH / EN / JSON and negatives. Copy any pane.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {fallbackReason ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Fell back to the fixture stub: {fallbackReason}
              </p>
            ) : null}

            <Tabs defaultValue="zh">
              <TabsList className="w-full">
                <TabsTrigger value="zh">中文</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="neg">Negatives</TabsTrigger>
              </TabsList>
              <TabsContent value="zh" className="space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zh">Chinese prompt</Label>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      void copyText(prompts.chinese).then(() => markCopied("zh"));
                    }}
                  >
                    {copied === "zh" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  id="zh"
                  value={prompts.chinese}
                  onChange={(event) => setPrompts((current) => ({ ...current, chinese: event.target.value }))}
                  className="min-h-40"
                />
              </TabsContent>
              <TabsContent value="en" className="space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="en">English prompt</Label>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      void copyText(prompts.english).then(() => markCopied("en"));
                    }}
                  >
                    {copied === "en" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  id="en"
                  value={prompts.english}
                  onChange={(event) => setPrompts((current) => ({ ...current, english: event.target.value }))}
                  className="min-h-40"
                />
              </TabsContent>
              <TabsContent value="json" className="space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="json">Structured JSON</Label>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      void copyText(prompts.json).then(() => markCopied("json"));
                    }}
                  >
                    {copied === "json" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  id="json"
                  value={prompts.json}
                  onChange={(event) => setPrompts((current) => ({ ...current, json: event.target.value }))}
                  className="min-h-56 font-mono text-xs"
                />
              </TabsContent>
              <TabsContent value="neg" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="neg-zh">Negative · 中文</Label>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        void copyText(prompts.negativeChinese).then(() => markCopied("neg-zh"));
                      }}
                    >
                      {copied === "neg-zh" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <Textarea
                    id="neg-zh"
                    value={prompts.negativeChinese}
                    onChange={(event) =>
                      setPrompts((current) => ({ ...current, negativeChinese: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="neg-en">Negative · English</Label>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        void copyText(prompts.negativeEnglish).then(() => markCopied("neg-en"));
                      }}
                    >
                      {copied === "neg-en" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <Textarea
                    id="neg-en"
                    value={prompts.negativeEnglish}
                    onChange={(event) =>
                      setPrompts((current) => ({ ...current, negativeEnglish: event.target.value }))
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
