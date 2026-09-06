"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CrawlResult = {
  url: string;
  title: string;
  markdown: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function crawl() {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Crawl failed.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Request failed. Is the dev server still running?");
    } finally {
      setLoading(false);
    }
  }

  async function copyMarkdown() {
    if (!result) return;
    await navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMarkdown() {
    if (!result) return;
    const name =
      (result.title || new URL(result.url).hostname).replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() ||
      "page";
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${name}.md`;
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">crawl4ai-md</h1>
        <p className="text-sm text-muted-foreground">
          Paste a URL, crawl it with{" "}
          <a
            href="https://github.com/unclecode/crawl4ai"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Crawl4AI
          </a>
          , get clean LLM-ready Markdown.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          crawl();
        }}
      >
        <Input
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          required
        />
        <Button type="submit" disabled={loading || !url.trim()}>
          {loading ? "Crawling…" : "Crawl"}
        </Button>
      </form>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Running Crawl4AI (headless browser) — this can take a few seconds…
        </p>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Crawl failed</CardTitle>
            <CardDescription className="break-words">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="break-words">{result.title || result.url}</CardTitle>
            <CardDescription className="break-words">
              {result.url} · {result.markdown.length.toLocaleString()} chars of Markdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={copyMarkdown}>
                {copied ? "Copied!" : "Copy Markdown"}
              </Button>
              <Button variant="secondary" size="sm" onClick={downloadMarkdown}>
                Download .md
              </Button>
            </div>
            <Textarea
              readOnly
              value={result.markdown}
              className="h-96 resize-y font-mono text-xs"
            />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
