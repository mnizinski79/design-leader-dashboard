/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { POST } from "@/app/api/designers/[id]/sessions/route"
import { DELETE } from "@/app/api/designers/[id]/sessions/[sessionId]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let designerId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Sessions Test", email: "designer.sessions@test.example", passwordHash: "hash" },
  })
  testUserId = user.id
  const d = await prisma.designer.create({
    data: { userId: testUserId, name: "Alice", role: "UX", roleLevel: "Senior Experience Designer", avatarClass: "av-blue" },
  })
  designerId = d.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
  await prisma.$disconnect()
})

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: { id: testUserId } })
})

afterEach(async () => {
  await prisma.designerSession.deleteMany({ where: { designerId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/designers/[id]/sessions", () => {
  it("creates a session and returns 201", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/sessions`, "POST", {
        date: "2026-04-01", notes: "Good session", flag: "POSITIVE",
      }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.notes).toBe("Good session")
    expect(data.flag).toBe("POSITIVE")
  })

  it("returns 422 when date or notes is missing", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/sessions`, "POST", { flag: "POSITIVE" }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(422)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other", email: "sessions.other@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const res = await POST(
      makeReq(`http://localhost/api/designers/${otherD.id}/sessions`, "POST", { date: "2026-04-01", notes: "hi" }),
      { params: { id: otherD.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("DELETE /api/designers/[id]/sessions/[sessionId]", () => {
  it("deletes a session and returns 204", async () => {
    const s = await prisma.designerSession.create({
      data: { designerId, date: new Date("2026-04-01"), notes: "test" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${designerId}/sessions/${s.id}`, "DELETE"),
      { params: { id: designerId, sessionId: s.id } }
    )
    expect(res.status).toBe(204)
  })

  it("returns 403 when session belongs to another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "sessions.other2@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const s = await prisma.designerSession.create({
      data: { designerId: otherD.id, date: new Date("2026-04-01"), notes: "test" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${otherD.id}/sessions/${s.id}`, "DELETE"),
      { params: { id: otherD.id, sessionId: s.id } }
    )
    expect(res.status).toBe(403)
  })
})
