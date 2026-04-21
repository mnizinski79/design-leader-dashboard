/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { GET, POST } from "@/app/api/tags/route"
import { DELETE } from "@/app/api/tags/[id]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Tags Test", email: "tags.test@test.example", passwordHash: "hash" },
  })
  testUserId = user.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
  await prisma.$disconnect()
})

beforeEach(() => {
  mockAuth.mockResolvedValue({
    user: { id: testUserId, name: "Tags Test", email: "tags.test@test.example" },
  })
})

afterEach(async () => {
  await prisma.noteTag.deleteMany({ where: { userId: testUserId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/tags", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns empty array when user has no tags", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("returns tags for the authenticated user only", async () => {
    await prisma.noteTag.create({ data: { userId: testUserId, name: "alpha" } })
    const other = await prisma.user.create({
      data: { name: "Other", email: "other.tags@test.example", passwordHash: "hash" },
    })
    await prisma.noteTag.create({ data: { userId: other.id, name: "beta" } })

    const res = await GET()
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("alpha")
  })
})

describe("POST /api/tags", () => {
  it("creates a tag and returns 201", async () => {
    const res = await POST(makeReq("http://localhost/api/tags", "POST", { name: "system" }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe("system")
    expect(body.userId).toBe(testUserId)
  })

  it("returns 409 when tag name already exists for user", async () => {
    await prisma.noteTag.create({ data: { userId: testUserId, name: "dup" } })
    const res = await POST(makeReq("http://localhost/api/tags", "POST", { name: "dup" }))
    expect(res.status).toBe(409)
  })

  it("returns 422 when name is missing", async () => {
    const res = await POST(makeReq("http://localhost/api/tags", "POST", {}))
    expect(res.status).toBe(422)
  })
})

describe("DELETE /api/tags/[id]", () => {
  it("deletes a tag and returns 204", async () => {
    const tag = await prisma.noteTag.create({ data: { userId: testUserId, name: "delete-me" } })
    const res = await DELETE(
      makeReq(`http://localhost/api/tags/${tag.id}`, "DELETE"),
      { params: { id: tag.id } }
    )
    expect(res.status).toBe(204)
    expect(await prisma.noteTag.findUnique({ where: { id: tag.id } })).toBeNull()
  })

  it("returns 403 for another user's tag", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "other2.tags@test.example", passwordHash: "hash" },
    })
    const tag = await prisma.noteTag.create({ data: { userId: other.id, name: "not-yours" } })
    const res = await DELETE(
      makeReq(`http://localhost/api/tags/${tag.id}`, "DELETE"),
      { params: { id: tag.id } }
    )
    expect(res.status).toBe(403)
  })
})
