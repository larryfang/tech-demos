"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { YoutubeFrame } from "@/components/youtube-frame";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { FIXTURES } from "@/lib/fixtures";
import { buildMarkdown, noteFilename } from "@/lib/notes";
import { clampTime, cueIndexAt, formatTimestamp } from "@/lib/playback";
import { resolveSource } from "@/lib/resolve";
import type { AskExchange, AskResult, NoteClip, Talk } from "@/lib/types";

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function downloadText(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function LabView({ liveAvailable: initialLive }: { liveAvailable: boolean }) {
  const [liveAvailable, setLiveAvailable] = useState(initialLive);
  const [wantLive, setWantLive] = useState(false);
  const [talk, setTalk] = useState<Talk>(FIXTURES[0]);
  const [urlInput, setUrlInput] = useState("https://youtu.be/smpHarbor01");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [askMode, setAskMode] = useState<AskResult["mode"]>("fixture");
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [clips, setClips] = useState<NoteClip[]>([]);
  const [asks, setAsks] = useState<AskExchange[]>([]);
  const [freeform, setFreeform] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [ytSeek, setYtSeek] = useState<number | null>(null);
  const cueRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    void fetch("/api/status")
      .then((res) => res.json())
      .then((data: { liveAvailable?: boolean }) => {
        if (typeof data.liveAvailable === "boolean") setLiveAvailable(data.liveAvailable);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setTime((current) => {
        const next = current + 0.25;
        if (next >= talk.duration) {
          setPlaying(false);
          return talk.duration;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, talk.duration]);

  const currentIndex = useMemo(() => cueIndexAt(talk.cues, time), [talk.cues, time]);
  const currentCue = talk.cues[currentIndex];

  useEffect(() => {
    cueRefs.current[currentIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIndex]);

  const markdown = useMemo(
    () => buildMarkdown({ talk, clips, asks, freeform }),
    [talk, clips, asks, freeform],
  );
  const filename = useMemo(() => noteFilename(talk), [talk]);
  const showEmbed = talk.kind === "youtube" && Boolean(talk.youtubeId);

  const loadTalk = (next: Talk) => {
    setTalk(next);
    setTime(0);
    setPlaying(false);
    setSelection("");
    setAnswer(null);
    setAskError(null);
    setFallbackReason(undefined);
    setClips([]);
    setAsks([]);
    setFreeform("");
    setYtSeek(null);
    setUrlError(null);
  };

  const seek = (seconds: number) => {
    const next = clampTime(seconds, talk.duration);
    setTime(next);
    if (showEmbed) setYtSeek(next);
  };

  const loadUrl = (raw: string) => {
    const resolved = resolveSource(raw);
    if (!resolved.ok) {
      setUrlError(resolved.error);
      return;
    }
    setUrlInput(raw);
    loadTalk(resolved.talk);
  };

  const captureSelection = () => {
    const text = window.getSelection()?.toString().replace(/\s+/g, " ").trim() ?? "";
    if (text) setSelection(text);
  };

  const ask = useCallback(async () => {
    const picked = selection.trim();
    if (!picked) {
      setAskError("Select transcript text, or pin a line first.");
      return;
    }
    setBusy(true);
    setAskError(null);
    setFallbackReason(undefined);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          selection: picked,
          question,
          talkId: talk.id,
          live: wantLive,
        }),
      });
      const payload = (await response.json()) as AskResult | { ok: false; error?: string };
      if (!payload.ok) {
        setAskError("error" in payload ? payload.error || "Ask failed" : "Ask failed");
        return;
      }
      setAnswer(payload.answer);
      setAskMode(payload.mode);
      setFallbackReason(payload.fallbackReason);
      if (typeof payload.liveAvailable === "boolean") setLiveAvailable(payload.liveAvailable);
      setAsks((prev) => [
        ...prev,
        {
          id: newId("ask"),
          selection: picked,
          question: question.trim() || "Explain this selection.",
          answer: payload.answer,
          mode: payload.mode,
        },
      ]);
    } catch (error) {
      setAskError(error instanceof Error ? error.message : "Ask failed");
    } finally {
      setBusy(false);
    }
  }, [question, selection, talk.id, wantLive]);

  const pinCurrent = () => {
    if (!currentCue) return;
    setClips((prev) => [
      ...prev,
      {
        id: newId("clip"),
        start: currentCue.start,
        en: currentCue.en,
        zh: currentCue.zh,
        comment: selection && selection.includes(currentCue.en) ? "" : "",
      },
    ]);
    setSelection(`${currentCue.en} / ${currentCue.zh}`);
  };

  const flash = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1400);
  };

  return (
    <div className="min-h-full bg-zinc-50 text-foreground">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Video → readable transcript
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Qiaomu Reader <span className="text-muted-foreground font-normal">乔木阅读</span>
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Inspired by{" "}
                <a
                  className="underline underline-offset-2"
                  href="https://github.com/joeseesun/qiaomu-clipper"
                >
                  Qiaomu Clipper
                </a>
                . Original fixture-first web lab — not a fork or redistribution of the extension.
              </p>
            </div>
            <Badge variant={liveAvailable ? "default" : "secondary"}>
              {liveAvailable ? "Live ready" : "Fixture"}
            </Badge>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
            <div className="flex flex-wrap gap-2">
              {FIXTURES.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={talk.id === item.id ? "default" : "outline"}
                  onClick={() => {
                    setUrlInput(`https://youtu.be/${item.aliases[0]}`);
                    loadTalk(item);
                  }}
                >
                  {item.id === "harbor-tasting" ? "Harbor tasting" : "Video as a book"}
                </Button>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <div className="flex gap-2">
                <Input
                  id="youtube-url"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="https://youtu.be/smpHarbor01"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadUrl(urlInput);
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => loadUrl(urlInput)}>
                  Load URL
                </Button>
              </div>
              {urlError ? <p className="text-destructive text-xs">{urlError}</p> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_minmax(280px,0.9fr)]">
        <section className="flex flex-col gap-3">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{talk.title}</CardTitle>
              <CardDescription>
                {talk.titleZh} · {talk.speaker}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-foreground text-background relative aspect-video overflow-hidden rounded-xl">
                {showEmbed && talk.youtubeId ? (
                  <YoutubeFrame videoId={talk.youtubeId} title={talk.title} seekTo={ytSeek} />
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-between p-5">
                    <p className="text-background/70 text-xs tracking-[0.18em] uppercase">
                      Fixture player
                    </p>
                    <div>
                      <p className="max-w-sm text-2xl leading-tight font-semibold">{talk.titleZh}</p>
                      <p className="text-background/80 mt-2 text-sm">{talk.blurb}</p>
                    </div>
                    <p className="font-mono text-sm">
                      {formatTimestamp(time)} / {formatTimestamp(talk.duration)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={() => setPlaying((value) => !value)}>
                  {playing ? "Pause" : "Play"}
                </Button>
                <p className="w-24 font-mono text-sm tabular-nums">
                  {formatTimestamp(time)} / {formatTimestamp(talk.duration)}
                </p>
              </div>
              <Slider
                value={[time]}
                min={0}
                max={talk.duration}
                step={0.25}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value;
                  if (typeof next === "number") seek(next);
                }}
                aria-label="Transcript scrubber"
              />
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bilingual transcript</CardTitle>
              <CardDescription>
                English on top, Chinese under each line. Click a timestamp to jump.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[34rem] pr-3">
                <ol className="space-y-2" onMouseUp={captureSelection}>
                  {talk.cues.map((cue, index) => {
                    const active = index === currentIndex;
                    return (
                      <li key={`${talk.id}-${cue.start}-${index}`}>
                        <article
                          ref={(node) => {
                            cueRefs.current[index] = node;
                          }}
                          data-active={active ? "true" : "false"}
                          className={`rounded-xl border px-3 py-2 transition-colors ${
                            active
                              ? "border-foreground/20 bg-amber-50 shadow-sm"
                              : "border-transparent bg-transparent hover:bg-zinc-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              className="font-mono"
                              onClick={() => seek(cue.start)}
                            >
                              {formatTimestamp(cue.start)}
                            </Button>
                            <div className="min-w-0 flex-1 select-text">
                              <p className="text-sm leading-6">{cue.en}</p>
                              <p className="text-muted-foreground mt-0.5 text-sm leading-6">
                                {cue.zh}
                              </p>
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ask AI</CardTitle>
              <CardDescription>
                Select transcript text, then ask. No key → stubbed answer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-zinc-50 px-3 py-2 text-sm">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Selection</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {selection || "Highlight a line in the transcript."}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ask-question">Question (optional)</Label>
                <Textarea
                  id="ask-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Why does the speaker protect the pass?"
                  rows={2}
                />
              </div>
              {liveAvailable ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={wantLive}
                    onChange={(event) => setWantLive(event.target.checked)}
                  />
                  Use live model
                </label>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void ask()} disabled={busy}>
                  {busy ? "Asking…" : "Ask AI"}
                </Button>
                <Button type="button" variant="outline" onClick={pinCurrent}>
                  Pin current line
                </Button>
              </div>
              {askError ? <p className="text-destructive text-sm">{askError}</p> : null}
              {fallbackReason ? (
                <p className="text-muted-foreground text-xs">Fell back to stub: {fallbackReason}</p>
              ) : null}
              {answer ? (
                <div className="rounded-lg border px-3 py-2 text-sm">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Answer · {askMode}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{answer}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Obsidian notes</CardTitle>
              <CardDescription>
                Filename <span className="font-mono">{filename}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="free-notes">Free notes</Label>
                <Textarea
                  id="free-notes"
                  value={freeform}
                  onChange={(event) => setFreeform(event.target.value)}
                  placeholder="Protect the pass. Revisit the 90-second budget."
                  rows={3}
                />
              </div>
              <Separator />
              <pre className="bg-muted max-h-56 overflow-auto rounded-lg p-3 font-mono text-xs leading-5 whitespace-pre-wrap">
                {markdown}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void copyText(markdown).then(() => flash("copy"));
                  }}
                >
                  {copied === "copy" ? "Copied" : "Copy Markdown"}
                </Button>
                <Button type="button" onClick={() => downloadText(filename, markdown)}>
                  Download Markdown
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
