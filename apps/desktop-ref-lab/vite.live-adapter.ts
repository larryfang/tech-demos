import { spawn } from "node:child_process"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"

const CLI = "agent-desktop"
const TIMEOUT_MS = 20_000
const PREFIX = "/api/live"

type CliResult = {
  code: number | null
  stdout: string
  stderr: string
  spawnError?: string
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk: Buffer) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function runCli(args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(CLI, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      resolve({
        code: null,
        stdout,
        stderr,
        spawnError: `agent-desktop timed out after ${TIMEOUT_MS}ms`,
      })
    }, TIMEOUT_MS)
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8")
    })
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8")
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({
        code: null,
        stdout,
        stderr,
        spawnError: err.message,
      })
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
  })
}

function envelopeOrFallback(result: CliResult, command: string): unknown {
  const trimmed = result.stdout.trim()
  if (trimmed) {
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      // fall through
    }
  }
  const missing =
    result.spawnError?.includes("ENOENT") ||
    /not found|ENOENT/i.test(result.spawnError ?? "")
  if (missing) {
    return {
      version: "2.6",
      ok: false,
      command,
      error: {
        code: "INTERNAL",
        message: "agent-desktop CLI is not installed on this machine.",
        suggestion: "Stay in Replay mode, or install with `npm install -g agent-desktop`.",
        disposition: { delivery: "not_delivered", retry: "safe" },
      },
    }
  }
  return {
    version: "2.6",
    ok: false,
    command,
    error: {
      code: "INTERNAL",
      message:
        result.spawnError ||
        result.stderr.trim() ||
        `agent-desktop ${command} produced no JSON envelope`,
      disposition: { delivery: "not_delivered", retry: "safe" },
    },
  }
}

function safeAppName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const name = value.trim()
  if (!name || name.length > 120) return undefined
  if (!/^[\w .+()-]+$/u.test(name)) return undefined
  return name
}

function safeRef(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const ref = value.trim()
  if (!/^@[\w.-]+:[\w]+$/u.test(ref)) return undefined
  return ref
}

function safeWindowId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const id = value.trim()
  if (!id || id.length > 80) return undefined
  if (!/^[\w-]+$/u.test(id)) return undefined
  return id
}

async function handleStatus(_req: IncomingMessage, res: ServerResponse) {
  const result = await runCli(["version"])
  const missing =
    result.spawnError?.includes("ENOENT") ||
    /not found|ENOENT/i.test(result.spawnError ?? "")
  if (missing) {
    json(res, 200, {
      available: false,
      reason: "not_installed",
      message:
        "agent-desktop is not installed. Replay mode keeps working; Live needs `npm install -g agent-desktop`.",
    })
    return
  }
  if (result.spawnError) {
    json(res, 200, {
      available: false,
      reason: "error",
      message: result.spawnError,
    })
    return
  }
  json(res, 200, {
    available: true,
    version: result.stdout.trim() || "installed",
    stderr: result.stderr.trim() || undefined,
  })
}

async function handleApps(_req: IncomingMessage, res: ServerResponse) {
  const result = await runCli(["list-apps"])
  json(res, 200, envelopeOrFallback(result, "list-apps"))
}

async function handleSnapshot(req: IncomingMessage, res: ServerResponse) {
  let body: { app?: string; windowId?: string } = {}
  try {
    body = JSON.parse((await readBody(req)) || "{}") as typeof body
  } catch {
    json(res, 400, { error: "invalid_json" })
    return
  }
  const args = ["snapshot", "-i"]
  const app = safeAppName(body.app)
  const windowId = safeWindowId(body.windowId)
  if (app) args.push("--app", app)
  if (windowId) args.push("--window-id", windowId)
  const result = await runCli(args)
  json(res, 200, envelopeOrFallback(result, "snapshot"))
}

async function handleClick(req: IncomingMessage, res: ServerResponse) {
  let body: { ref?: string } = {}
  try {
    body = JSON.parse((await readBody(req)) || "{}") as typeof body
  } catch {
    json(res, 400, { error: "invalid_json" })
    return
  }
  const ref = safeRef(body.ref)
  if (!ref) {
    json(res, 400, {
      version: "2.6",
      ok: false,
      command: "click",
      error: {
        code: "INVALID_ARGS",
        message: "Expected a snapshot-qualified ref such as @s8f3k2p9:e8.",
        disposition: { delivery: "not_delivered", retry: "safe" },
      },
    })
    return
  }
  const result = await runCli(["click", ref])
  json(res, 200, envelopeOrFallback(result, "click"))
}

async function handleType(req: IncomingMessage, res: ServerResponse) {
  let body: { ref?: string; text?: string } = {}
  try {
    body = JSON.parse((await readBody(req)) || "{}") as typeof body
  } catch {
    json(res, 400, { error: "invalid_json" })
    return
  }
  const ref = safeRef(body.ref)
  const text = typeof body.text === "string" ? body.text : ""
  if (!ref) {
    json(res, 400, {
      version: "2.6",
      ok: false,
      command: "type",
      error: {
        code: "INVALID_ARGS",
        message: "Expected a snapshot-qualified ref such as @s8f3k2p9:e8.",
        disposition: { delivery: "not_delivered", retry: "safe" },
      },
    })
    return
  }
  if (text.length > 4000) {
    json(res, 400, { error: "text_too_long" })
    return
  }
  const result = await runCli(["type", ref, text])
  json(res, 200, envelopeOrFallback(result, "type"))
}

export function liveAdapter(): Plugin {
  return {
    name: "live-adapter",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? ""
        if (!url.startsWith(PREFIX)) {
          next()
          return
        }
        try {
          if (req.method === "GET" && url === `${PREFIX}/status`) {
            await handleStatus(req, res)
            return
          }
          if (req.method === "GET" && url === `${PREFIX}/apps`) {
            await handleApps(req, res)
            return
          }
          if (req.method === "POST" && url === `${PREFIX}/snapshot`) {
            await handleSnapshot(req, res)
            return
          }
          if (req.method === "POST" && url === `${PREFIX}/click`) {
            await handleClick(req, res)
            return
          }
          if (req.method === "POST" && url === `${PREFIX}/type`) {
            await handleType(req, res)
            return
          }
          json(res, 404, { error: "not_found" })
        } catch (err) {
          json(res, 500, {
            error: "internal",
            message: err instanceof Error ? err.message : "unknown",
          })
        }
      })
    },
  }
}
