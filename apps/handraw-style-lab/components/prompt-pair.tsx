"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PromptPair } from "@/lib/types";

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to the execCommand path (some browsers block clipboard).
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export function PromptPairView({
  pair,
  idPrefix,
}: {
  pair: PromptPair;
  idPrefix: string;
}) {
  const [copied, setCopied] = useState<"zh" | "en" | null>(null);

  const mark = (key: "zh" | "en") => {
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1400);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-zh`}>中文提示词</Label>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => {
              mark("zh");
              void copyText(pair.zh).catch(() => undefined);
            }}
          >
            {copied === "zh" ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre
          id={`${idPrefix}-zh`}
          className="min-h-40 whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed"
        >
          {pair.zh}
        </pre>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-en`}>English prompt</Label>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => {
              mark("en");
              void copyText(pair.en).catch(() => undefined);
            }}
          >
            {copied === "en" ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre
          id={`${idPrefix}-en`}
          className="min-h-40 whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed"
        >
          {pair.en}
        </pre>
      </div>
    </div>
  );
}
