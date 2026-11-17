import fs from "node:fs"

export function findChrome(): string | null {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ]
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate
  }
  return null
}

export function findFfmpeg(): string | null {
  const envPath = process.env.FFMPEG_PATH
  if (envPath && fs.existsSync(envPath)) return envPath
  if (fs.existsSync("/usr/bin/ffmpeg")) return "/usr/bin/ffmpeg"
  return null
}

export function missingToolsMessage(ffmpeg: string | null, chrome: string | null): string {
  const parts: string[] = []
  if (!ffmpeg) parts.push("ffmpeg is not installed — cannot encode MP4.")
  if (!chrome) {
    parts.push(
      "Chrome/Chromium is not installed — cannot capture frames. Set CHROME_PATH if it lives elsewhere.",
    )
  }
  return parts.join(" ")
}
