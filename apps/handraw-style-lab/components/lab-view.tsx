"use client";

import { useEffect, useMemo, useState } from "react";
import { PromptPairView } from "@/components/prompt-pair";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_LAYOUT_ID,
  DEFAULT_PALETTE_ID,
  DEFAULT_STYLE_ID,
  DEFAULT_TOPIC,
  FAMILY_LABEL,
  LAYOUTS,
  PALETTES,
  STYLES,
  layoutById,
  paletteById,
  styleById,
} from "@/lib/catalog";
import { assemblePair, surpriseCards } from "@/lib/compose";
import { filterCatalog } from "@/lib/search";
import type { FamilyId, Palette, SurpriseCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const FAMILY_TINT: Record<FamilyId, string> = {
  graphite: "bg-zinc-400",
  ink: "bg-neutral-900",
  watercolor: "bg-sky-400",
  print: "bg-rose-700",
  collage: "bg-amber-500",
  marker: "bg-violet-500",
  crayon: "bg-orange-400",
  technical: "bg-cyan-700",
};

function Swatches({ palette }: { palette: Palette }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {palette.swatches.map((swatch) => (
        <span
          key={swatch}
          className="size-3 rounded-full ring-1 ring-foreground/15"
          style={{ backgroundColor: swatch }}
        />
      ))}
    </div>
  );
}

export function LabView({ liveAvailable: initialLive }: { liveAvailable: boolean }) {
  const [liveAvailable, setLiveAvailable] = useState(initialLive);
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [layoutId, setLayoutId] = useState(DEFAULT_LAYOUT_ID);
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("styles");
  const [surprise, setSurprise] = useState<SurpriseCard[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const style = styleById(styleId);
  const layout = layoutById(layoutId);
  const palette = paletteById(paletteId);
  const pair = useMemo(
    () => assemblePair({ topic, style, layout, palette }),
    [topic, style, layout, palette],
  );

  const styles = filterCatalog(STYLES, query);
  const layouts = filterCatalog(LAYOUTS, query);
  const palettes = filterCatalog(PALETTES, query);

  useEffect(() => {
    void fetch("/api/status")
      .then((response) => response.json())
      .then((payload: { liveAvailable?: boolean }) => {
        if (typeof payload.liveAvailable === "boolean") {
          setLiveAvailable(payload.liveAvailable);
        }
      })
      .catch(() => undefined);
  }, []);

  const runSurprise = () => {
    setSurprise(surpriseCards({ topic, styles: STYLES, layout, palette }));
    setImage(null);
    setImageError(null);
  };

  const generate = async () => {
    setBusy(true);
    setImageError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: pair.en }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        image?: string;
        error?: string;
      };
      if (!response.ok || !payload.ok || !payload.image) {
        setImageError(payload.error || "Image generation is off or failed.");
        setImage(null);
        return;
      }
      setImage(payload.image);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Image generation failed.");
      setImage(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Handraw Style Lab</h1>
            <Badge variant="outline">{liveAvailable ? "Live ready" : "Fixture"}</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Pick a style, layout, and palette, add a topic, and copy bilingual
            image prompts. Original offline catalog — not a copy of
            yang0/handraw-style.
          </p>
        </header>

        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Topic</CardTitle>
                <CardDescription>
                  One subject, reused by the assembled pair and Surprise me.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder={DEFAULT_TOPIC}
                    className="sm:flex-1"
                  />
                  <Button type="button" onClick={runSurprise}>
                    Surprise me
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">
                    {style.id} · {style.name.en}
                  </Badge>
                  <Badge variant="secondary">
                    {layout.id} · {layout.name.en}
                  </Badge>
                  <Badge variant="secondary">
                    {palette.id} · {palette.name.en}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
                <CardDescription>
                  Search and select one style, one layout, and one palette.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search id, name, family…"
                  aria-label="Search catalog"
                />
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList>
                    <TabsTrigger value="styles">Styles {STYLES.length}</TabsTrigger>
                    <TabsTrigger value="layouts">Layouts {LAYOUTS.length}</TabsTrigger>
                    <TabsTrigger value="palettes">Palettes {PALETTES.length}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="styles" className="pt-3">
                    <GalleryEmpty count={styles.length} />
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {styles.map((item) => {
                        const selected = item.id === styleId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setStyleId(item.id)}
                            className={cn(
                              "rounded-xl border px-3 py-3 text-left transition-colors",
                              selected
                                ? "border-foreground bg-muted ring-1 ring-foreground"
                                : "border-border hover:bg-muted/50",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">
                                {item.id} · {item.name.zh}
                              </span>
                              <span className={cn("size-2.5 rounded-full", FAMILY_TINT[item.family])} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.name.en} · {FAMILY_LABEL[item.family].en}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {item.description.en}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                  <TabsContent value="layouts" className="pt-3">
                    <GalleryEmpty count={layouts.length} />
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {layouts.map((item) => {
                        const selected = item.id === layoutId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLayoutId(item.id)}
                            className={cn(
                              "rounded-xl border px-3 py-3 text-left transition-colors",
                              selected
                                ? "border-foreground bg-muted ring-1 ring-foreground"
                                : "border-border hover:bg-muted/50",
                            )}
                          >
                            <div className="text-sm font-medium">
                              {item.id} · {item.name.zh}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.name.en}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {item.description.en}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                  <TabsContent value="palettes" className="pt-3">
                    <GalleryEmpty count={palettes.length} />
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {palettes.map((item) => {
                        const selected = item.id === paletteId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPaletteId(item.id)}
                            className={cn(
                              "rounded-xl border px-3 py-3 text-left transition-colors",
                              selected
                                ? "border-foreground bg-muted ring-1 ring-foreground"
                                : "border-border hover:bg-muted/50",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">
                                {item.id} · {item.name.zh}
                              </span>
                              <Swatches palette={item} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.name.en}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {item.description.en}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assembled prompts</CardTitle>
                <CardDescription>
                  Updates live from the current topic and selection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PromptPairView pair={pair} idPrefix="main" />
                <div className="space-y-2">
                  {liveAvailable ? (
                    <Button type="button" variant="outline" disabled={busy} onClick={() => void generate()}>
                      {busy ? "Generating…" : "Generate image"}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Image generation stays off unless <code>OPENAI_API_KEY</code> is set.
                    </p>
                  )}
                  {imageError ? <p className="text-xs text-destructive">{imageError}</p> : null}
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt="Optional live generation"
                      className="w-full rounded-lg border"
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
        </div>

        {surprise ? (
          <section className="mt-6 space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Surprise set</h2>
              <p className="text-sm text-muted-foreground">
                Five contrasting families, same topic, layout {layout.id}, palette{" "}
                {palette.id}.
              </p>
            </div>
            <div className="grid gap-4">
              {surprise.map((card) => (
                <Card key={card.style.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>
                        {card.style.id} · {card.style.name.zh}
                      </span>
                      <Badge variant="outline">{FAMILY_LABEL[card.style.family].en}</Badge>
                    </CardTitle>
                    <CardDescription>{card.style.name.en}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PromptPairView pair={card.pair} idPrefix={card.style.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function GalleryEmpty({ count }: { count: number }) {
  if (count > 0) return null;
  return <p className="mb-2 text-sm text-muted-foreground">No matches in this gallery.</p>;
}
