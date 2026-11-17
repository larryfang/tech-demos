import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

function findChrome(): string | null {
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

function findFfmpeg(): string | null {
  const envPath = process.env.FFMPEG_PATH
  if (envPath && fs.existsSync(envPath)) return envPath
  const fallback = "/usr/bin/ffmpeg"
  if (fs.existsSync(fallback)) return fallback
  return null
}

function renderApi(liveEnabled: boolean): Plugin {
  return {
    name: "openmotion-render-api",
    configureServer(server) {
      server.middlewares.use("/out", (req, res, next) => {
        const name = path.basename(req.url?.split("?")[0] ?? "")
        if (!name.endsWith(".mp4")) {
          next()
          return
        }
        const file = path.join(process.cwd(), "out", name)
        if (!fs.existsSync(file)) {
          res.statusCode = 404
          res.end("not found")
          return
        }
        res.setHeader("Content-Type", "video/mp4")
        fs.createReadStream(file).pipe(res)
      })

      server.middlewares.use("/api/status", (_req, res) => {
        const ffmpeg = findFfmpeg()
        const chrome = findChrome()
        res.setHeader("Content-Type", "application/json")
        res.end(
          JSON.stringify({
            ffmpeg: Boolean(ffmpeg),
            chrome: Boolean(chrome),
            live: liveEnabled,
            ffmpegPath: ffmpeg,
            chromePath: chrome,
            message:
              ffmpeg && chrome
                ? "Ready to render."
                : [
                    !ffmpeg ? "ffmpeg is not installed (needed to encode MP4)." : null,
                    !chrome
                      ? "Chrome/Chromium is not installed (needed for headless frames). Set CHROME_PATH if it lives elsewhere."
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" "),
          }),
        )
      })

      server.middlewares.use("/api/render", (req, res, next) => {
        if (req.method !== "POST") {
          next()
          return
        }
        const chunks: Buffer[] = []
        req.on("data", (chunk: Buffer) => chunks.push(chunk))
        req.on("end", () => {
          res.setHeader("Content-Type", "application/json")
          const ffmpeg = findFfmpeg()
          const chrome = findChrome()
          if (!ffmpeg || !chrome) {
            res.statusCode = 501
            res.end(
              JSON.stringify({
                ok: false,
                message: [
                  !ffmpeg ? "ffmpeg is not installed — cannot encode MP4." : null,
                  !chrome
                    ? "Chrome/Chromium is not installed — cannot capture frames. Set CHROME_PATH if needed."
                    : null,
                ]
                  .filter(Boolean)
                  .join(" "),
              }),
            )
            return
          }

          let body: { clipId?: string; kitId?: string; edits?: unknown } = {}
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as typeof body
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, message: "Invalid JSON body." }))
            return
          }

          const editsPath = path.join(os.tmpdir(), `om-edits-${Date.now()}.json`)
          fs.writeFileSync(editsPath, JSON.stringify(body.edits ?? {}))
          const args = [
            "run",
            "src/render/cli.ts",
            "--json",
            "--clip",
            body.clipId ?? "launch-teaser",
            "--kit",
            body.kitId ?? "northstar",
            "--edits-file",
            editsPath,
          ]
          const bunBin = process.execPath.includes("bun") ? process.execPath : "bun"
          const child = spawn(bunBin, args, { cwd: process.cwd(), env: process.env })
          let stdout = ""
          let stderr = ""
          child.stdout.on("data", (chunk: Buffer) => {
            stdout += chunk.toString("utf8")
          })
          child.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString("utf8")
          })
          child.on("close", (code) => {
            try {
              fs.unlinkSync(editsPath)
            } catch {
              /* ignore */
            }
            const line = stdout.trim().split("\n").at(-1) ?? ""
            try {
              const parsed = JSON.parse(line) as { ok?: boolean; message?: string }
              res.statusCode = parsed.ok ? 200 : 500
              res.end(line)
            } catch {
              res.statusCode = code === 0 ? 200 : 500
              res.end(
                JSON.stringify({
                  ok: false,
                  message: stderr.trim() || stdout.trim() || "Render process failed.",
                }),
              )
            }
          })
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const liveEnabled = env.OPENMOTION_LIVE === "1" || env.VITE_OPENMOTION_LIVE === "1"
  return {
    plugins: [react(), tailwindcss(), renderApi(liveEnabled)],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})
