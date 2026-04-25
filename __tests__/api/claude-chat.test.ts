/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }))
jest.mock("@anthropic-ai/sdk", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        stream: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hello " } }
            yield { type: "content_block_delta", delta: { type: "text_delta", text: "world" } }
            yield { type: "message_stop" }
          },
          abort: jest.fn(),
        }),
      },
    })),
  }
})

import { POST } from "@/app/api/claude/chat/route"
import { auth } from "@/lib/auth"

const mockAuth = auth as jest.Mock

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: { id: "user-1" } })
  process.env.ANTHROPIC_API_KEY = "sk-ant-test"
})

afterAll(async () => {
  const { prisma } = await import("@/lib/prisma")
  await prisma.$disconnect()
})

function makeReq(body: unknown) {
  return new Request("http://localhost/api/claude/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/claude/chat", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await POST(makeReq({ messages: [{ role: "user", content: "hi" }] }))
    expect(res.status).toBe(401)
  })

  it("returns 400 on invalid JSON", async () => {
    const req = new Request("http://localhost/api/claude/chat", {
      method: "POST",
      body: "not json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when messages is empty", async () => {
    const res = await POST(makeReq({ messages: [] }))
    expect(res.status).toBe(400)
  })

  it("streams text chunks for valid request", async () => {
    const res = await POST(makeReq({ messages: [{ role: "user", content: "Hello" }] }))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/plain")

    const text = await res.text()
    expect(text).toBe("Hello world")
  })
})
