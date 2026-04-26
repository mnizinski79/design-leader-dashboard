import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Configuration error — API key not set" },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const messages = raw.messages

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 })
  }

  const validRoles = new Set(["user", "assistant"])
  const invalid = messages.some(
    (m) =>
      typeof m !== "object" ||
      m === null ||
      !validRoles.has((m as Record<string, unknown>).role as string) ||
      typeof (m as Record<string, unknown>).content !== "string"
  )
  if (invalid) {
    return NextResponse.json({ error: "invalid message format" }, { status: 400 })
  }

  const typedMessages = messages as { role: "user" | "assistant"; content: string }[]

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system:
      "You are a coaching assistant for a design leader. Respond concisely and directly — this is a narrow side panel, not a document. " +
      "Use bullet lists or numbered lists instead of tables. Avoid headers unless the response has 4+ distinct sections. " +
      "Aim for responses that feel like a thoughtful colleague talking, not a consulting report. " +
      "If asked a follow-up question, keep it even shorter.",
    messages: typedMessages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
    cancel() {
      stream.abort()
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
