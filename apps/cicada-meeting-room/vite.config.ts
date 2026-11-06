import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

function optionalTranslate(apiKey: string | undefined): Plugin {
  return {
    name: "optional-translate",
    configureServer(server) {
      server.middlewares.use("/api/translate", (req, res, next) => {
        if (req.method !== "POST") {
          next()
          return
        }
        const chunks: Buffer[] = []
        req.on("data", (chunk: Buffer) => chunks.push(chunk))
        req.on("end", () => {
          res.setHeader("Content-Type", "application/json")
          const key = apiKey || process.env.OPENAI_API_KEY
          if (!key) {
            res.statusCode = 501
            res.end(
              JSON.stringify({
                error: "no_key",
                message: "OPENAI_API_KEY is not set; use the fixture translation path.",
              }),
            )
            return
          }
          let body: { text?: string; source?: string; target?: string } = {}
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as typeof body
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: "invalid_json" }))
            return
          }
          const text = body.text?.trim() ?? ""
          if (!text) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: "missing_text" }))
            return
          }
          const source = body.source === "zh" ? "zh" : "en"
          const target = body.target === "en" ? "en" : "zh"
          fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.2,
              messages: [
                {
                  role: "system",
                  content:
                    source === "zh"
                      ? "Translate the user's Chinese meeting remark into concise natural English. Return only the translation."
                      : "Translate the user's English meeting remark into concise natural Chinese. Return only the translation.",
                },
                { role: "user", content: text },
              ],
            }),
          })
            .then(async (upstream) => {
              if (!upstream.ok) {
                res.statusCode = 502
                res.end(JSON.stringify({ error: "upstream", status: upstream.status }))
                return
              }
              const json = (await upstream.json()) as {
                choices?: Array<{ message?: { content?: string } }>
              }
              const translation = json.choices?.[0]?.message?.content?.trim() ?? ""
              res.end(JSON.stringify({ text, translation, source, target, provider: "openai" }))
            })
            .catch(() => {
              res.statusCode = 502
              res.end(JSON.stringify({ error: "upstream_failed" }))
            })
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [react(), tailwindcss(), optionalTranslate(env.OPENAI_API_KEY)],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})
