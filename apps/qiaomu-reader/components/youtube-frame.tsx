"use client";

import { useEffect, useId, useRef } from "react";
import { youtubeEmbedSrc } from "@/lib/youtube";

type Player = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        id: string,
        opts: { events?: { onReady?: (e: { target: Player }) => void } },
      ) => Player;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYoutubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const existing = document.querySelector("script[data-qiaomu-yt]");
    if (existing) {
      window.onYouTubeIframeAPIReady = () => resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.qiaomuYt = "1";
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function YoutubeFrame({
  videoId,
  title,
  seekTo,
}: {
  videoId: string;
  title: string;
  seekTo: number | null;
}) {
  const iframeId = useId().replace(/:/g, "");
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(iframeId, {
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [iframeId, videoId]);

  useEffect(() => {
    if (seekTo == null) return;
    playerRef.current?.seekTo(seekTo, true);
  }, [seekTo]);

  return (
    <iframe
      id={iframeId}
      title={title}
      src={youtubeEmbedSrc(videoId)}
      className="absolute inset-0 size-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
