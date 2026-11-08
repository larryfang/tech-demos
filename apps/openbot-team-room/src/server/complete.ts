import type { IncomingMessage, ServerResponse } from "node:http"

export async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
}

export async function completeWithOpenAI(input: {
  apiKey: string
  prompt: string
  agentName?: string
  instructions?: string
}): Promise<{ text?: string; error?: string; status: number }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are ${input.agentName ?? "a teammate"} in a local team room. ${input.instructions ?? ""} Reply in two to four short sentences.`,
        },
        { role: "user", content: input.prompt },
      ],
    }),
  })
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
    error?: { message?: string }
  }
  if (!response.ok) {
    return {
      status: 502,
      error: data.error?.message ?? "Model request failed.",
    }
  }
  return {
    status: 200,
    text: data.choices?.[0]?.message?.content?.trim() ?? "",
  }
}
