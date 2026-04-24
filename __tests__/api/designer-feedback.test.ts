/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { POST } from "@/app/api/designers/[id]/feedback/route"
import { DELETE } from "@/app/api/designers/[id]/feedback/[feedbackId]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let designerId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Feedback Test", email: "designer.feedback@test.example", passwordHash: "hash" },
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
  await prisma.designerFeedback.deleteMany({ where: { designerId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/designers/[id]/feedback", () => {
  it("creates feedback and returns 201", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/feedback`, "POST", {
        sourceName: "John PM", date: "2026-04-01", body: "Great collaboration this sprint.",
      }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.sourceName).toBe("John PM")
    expect(data.body).toBe("Great collaboration this sprint.")
  })

  it("returns 422 when required fields are missing", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/feedback`, "POST", { sourceName: "John PM" }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(422)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other", email: "feedback.other@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const res = await POST(
      makeReq(`http://localhost/api/designers/${otherD.id}/feedback`, "POST", {
        sourceName: "PM", date: "2026-04-01", body: "Good work",
      }),
      { params: { id: otherD.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("DELETE /api/designers/[id]/feedback/[feedbackId]", () => {
  it("deletes feedback and returns 204", async () => {
    const f = await prisma.designerFeedback.create({
      data: { designerId, sourceName: "PM", date: new Date("2026-04-01"), body: "Good job" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${designerId}/feedback/${f.id}`, "DELETE"),
      { params: { id: designerId, feedbackId: f.id } }
    )
    expect(res.status).toBe(204)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "feedback.other2@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const f = await prisma.designerFeedback.create({
      data: { designerId: otherD.id, sourceName: "PM", date: new Date("2026-04-01"), body: "Good" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${otherD.id}/feedback/${f.id}`, "DELETE"),
      { params: { id: otherD.id, feedbackId: f.id } }
    )
    expect(res.status).toBe(403)
  })
})
