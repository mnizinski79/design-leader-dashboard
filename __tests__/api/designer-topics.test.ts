/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { POST } from "@/app/api/designers/[id]/topics/route"
import { PATCH, DELETE } from "@/app/api/designers/[id]/topics/[topicId]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let designerId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Topics Test", email: "designer.topics@test.example", passwordHash: "hash" },
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
  await prisma.designerTopic.deleteMany({ where: { designerId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/designers/[id]/topics", () => {
  it("creates a topic and returns 201", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/topics`, "POST", { title: "Presentation skills" }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.title).toBe("Presentation skills")
    expect(data.discussed).toBe(false)
  })

  it("returns 422 when title is missing", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/topics`, "POST", {}),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(422)
  })
})

describe("PATCH /api/designers/[id]/topics/[topicId]", () => {
  it("toggles discussed to true", async () => {
    const t = await prisma.designerTopic.create({ data: { designerId, title: "Test topic" } })
    const res = await PATCH(
      makeReq(`http://localhost/api/designers/${designerId}/topics/${t.id}`, "PATCH", { discussed: true }),
      { params: { id: designerId, topicId: t.id } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.discussed).toBe(true)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other", email: "topics.other@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const t = await prisma.designerTopic.create({ data: { designerId: otherD.id, title: "Other topic" } })
    const res = await PATCH(
      makeReq(`http://localhost/api/designers/${otherD.id}/topics/${t.id}`, "PATCH", { discussed: true }),
      { params: { id: otherD.id, topicId: t.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("DELETE /api/designers/[id]/topics/[topicId]", () => {
  it("deletes a topic and returns 204", async () => {
    const t = await prisma.designerTopic.create({ data: { designerId, title: "Delete me" } })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${designerId}/topics/${t.id}`, "DELETE"),
      { params: { id: designerId, topicId: t.id } }
    )
    expect(res.status).toBe(204)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "topics.other2@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const t = await prisma.designerTopic.create({ data: { designerId: otherD.id, title: "Other topic" } })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${otherD.id}/topics/${t.id}`, "DELETE"),
      { params: { id: otherD.id, topicId: t.id } }
    )
    expect(res.status).toBe(403)
  })
})
