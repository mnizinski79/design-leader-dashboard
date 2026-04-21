/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { GET, POST } from "@/app/api/ideas/route"
import { DELETE } from "@/app/api/ideas/[id]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Ideas Test", email: "ideas.test@test.example", passwordHash: "hash" },
  })
  testUserId = user.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
  await prisma.$disconnect()
})

beforeEach(() => {
  mockAuth.mockResolvedValue({
    user: { id: testUserId, name: "Ideas Test", email: "ideas.test@test.example" },
  })
})

afterEach(async () => {
  await prisma.idea.deleteMany({ where: { userId: testUserId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/ideas", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await GET(makeReq("http://localhost/api/ideas", "GET"))
    expect(res.status).toBe(401)
  })

  it("returns empty array when user has no ideas", async () => {
    const res = await GET(makeReq("http://localhost/api/ideas", "GET"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("returns ideas for the authenticated user only", async () => {
    await prisma.idea.create({ data: { userId: testUserId, title: "My idea", category: "Process Improvement" } })
    const other = await prisma.user.create({
      data: { name: "Other", email: "other.ideas@test.example", passwordHash: "hash" },
    })
    await prisma.idea.create({ data: { userId: other.id, title: "Not mine", category: "Other" } })

    const res = await GET(makeReq("http://localhost/api/ideas", "GET"))
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe("My idea")
  })

  it("filters by category query param", async () => {
    await prisma.idea.create({ data: { userId: testUserId, title: "Process idea", category: "Process Improvement" } })
    await prisma.idea.create({ data: { userId: testUserId, title: "Tool idea", category: "Tool / Technology" } })

    const res = await GET(makeReq("http://localhost/api/ideas?category=Process+Improvement", "GET"))
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe("Process idea")
  })
})

describe("POST /api/ideas", () => {
  it("creates an idea and returns 201", async () => {
    const res = await POST(makeReq("http://localhost/api/ideas", "POST", {
      title: "New idea",
      category: "Team Culture",
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe("New idea")
    expect(body.category).toBe("Team Culture")
    expect(body.userId).toBe(testUserId)
  })

  it("returns 422 when title is missing", async () => {
    const res = await POST(makeReq("http://localhost/api/ideas", "POST", { category: "Other" }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when category is missing", async () => {
    const res = await POST(makeReq("http://localhost/api/ideas", "POST", { title: "T" }))
    expect(res.status).toBe(422)
  })
})

describe("DELETE /api/ideas/[id]", () => {
  it("deletes an idea and returns 204", async () => {
    const idea = await prisma.idea.create({
      data: { userId: testUserId, title: "Delete me", category: "Other" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/ideas/${idea.id}`, "DELETE"),
      { params: { id: idea.id } }
    )
    expect(res.status).toBe(204)
    expect(await prisma.idea.findUnique({ where: { id: idea.id } })).toBeNull()
  })

  it("returns 404 when idea does not exist", async () => {
    const res = await DELETE(
      makeReq("http://localhost/api/ideas/00000000-0000-0000-0000-000000000000", "DELETE"),
      { params: { id: "00000000-0000-0000-0000-000000000000" } }
    )
    expect(res.status).toBe(404)
  })

  it("returns 403 for another user's idea", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "other2.ideas@test.example", passwordHash: "hash" },
    })
    const idea = await prisma.idea.create({
      data: { userId: other.id, title: "Not yours", category: "Other" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/ideas/${idea.id}`, "DELETE"),
      { params: { id: idea.id } }
    )
    expect(res.status).toBe(403)
  })
})
