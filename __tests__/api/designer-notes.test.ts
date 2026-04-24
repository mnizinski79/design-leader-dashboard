/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { POST } from "@/app/api/designers/[id]/notes/route"
import { PATCH, DELETE } from "@/app/api/designers/[id]/notes/[noteId]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let designerId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "DNotes Test", email: "designer.dnotes@test.example", passwordHash: "hash" },
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
  await prisma.designerNote.deleteMany({ where: { designerId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/designers/[id]/notes", () => {
  it("creates a note and returns 201", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/notes`, "POST", { body: "Remember to follow up on the Figma critique." }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.body).toBe("Remember to follow up on the Figma critique.")
  })

  it("creates a note with empty body", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/notes`, "POST", { body: "" }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(201)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other", email: "dnotes.other@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const res = await POST(
      makeReq(`http://localhost/api/designers/${otherD.id}/notes`, "POST", { body: "hi" }),
      { params: { id: otherD.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/designers/[id]/notes/[noteId]", () => {
  it("updates note body", async () => {
    const n = await prisma.designerNote.create({ data: { designerId, body: "old text" } })
    const res = await PATCH(
      makeReq(`http://localhost/api/designers/${designerId}/notes/${n.id}`, "PATCH", { body: "new text" }),
      { params: { id: designerId, noteId: n.id } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.body).toBe("new text")
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "dnotes.other2@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const n = await prisma.designerNote.create({ data: { designerId: otherD.id, body: "text" } })
    const res = await PATCH(
      makeReq(`http://localhost/api/designers/${otherD.id}/notes/${n.id}`, "PATCH", { body: "hacked" }),
      { params: { id: otherD.id, noteId: n.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("DELETE /api/designers/[id]/notes/[noteId]", () => {
  it("deletes a note and returns 204", async () => {
    const n = await prisma.designerNote.create({ data: { designerId, body: "delete me" } })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${designerId}/notes/${n.id}`, "DELETE"),
      { params: { id: designerId, noteId: n.id } }
    )
    expect(res.status).toBe(204)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other3", email: "dnotes.other3@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const n = await prisma.designerNote.create({ data: { designerId: otherD.id, body: "text" } })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${otherD.id}/notes/${n.id}`, "DELETE"),
      { params: { id: otherD.id, noteId: n.id } }
    )
    expect(res.status).toBe(403)
  })
})
