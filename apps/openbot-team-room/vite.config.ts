import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"
import { completeWithOpenAI, readBody, sendJson } from "./src/server/complete.ts"

function teamRoomApi(apiKey: string | undefined): Plugin {
  return {
    name: "team-room-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0]
        if (url === "/api/status" && req.method === "GET") {
          sendJson(res, 200, { configured: Boolean(apiKey) })
          return
        }
        if (url === "/api/complete" && req.method === "POST") {
          void (async () => {
            if (!apiKey) {
              sendJson(res, 501, { error: "OPENAI_API_KEY is not set." })
              return
            }
            try {
              const payload = JSON.parse(await readBody(req)) as {
                prompt?: string
                agentName?: string
                instructions?: string
              }
              const prompt = payload.prompt?.trim()
              if (!prompt) {
                sendJson(res, 400, { error: "prompt is required" })
                return
              }
              const result = await completeWithOpenAI({
                apiKey,
                prompt,
                agentName: payload.agentName,
                instructions: payload.instructions,
              })
              sendJson(res, result.status, result)
            } catch (error) {
              sendJson(res, 500, {
                error: error instanceof Error ? error.message : "failed",
              })
            }
          })()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
  return {
    plugins: [react(), tailwindcss(), teamRoomApi(apiKey)],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})
