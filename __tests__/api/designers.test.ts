/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { GET, POST } from "@/app/api/designers/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let otherUserId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Designer Test", email: "designers.test@test.example", passwordHash: "hash" },
  })
  testUserId = user.id
  const other = await prisma.user.create({
    data: { name: "Other User", email: "designers.other@test.example", passwordHash: "hash" },
  })
  otherUserId = other.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
  await prisma.$disconnect()
})

beforeEach(() => {
  mockAuth.mockResolvedValue({
    user: { id: testUserId, name: "Designer Test", email: "designers.test@test.example" },
  })
})

afterEach(async () => {
  await prisma.designer.deleteMany({ where: { userId: testUserId } })
  await prisma.designer.deleteMany({ where: { userId: otherUserId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/designers", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await GET(makeReq("http://localhost/api/designers", "GET"))
    expect(res.status).toBe(401)
  })

  it("returns empty array when user has no designers", async () => {
    const res = await GET(makeReq("http://localhost/api/designers", "GET"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("returns only the current user's designers", async () => {
    await prisma.designer.create({
      data: { userId: testUserId, name: "Alice", role: "UX Designer", roleLevel: "Senior Experience Designer", avatarClass: "av-blue" },
    })
    await prisma.designer.create({
      data: { userId: otherUserId, name: "Bob", role: "UX Designer", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const res = await GET(makeReq("http://localhost/api/designers", "GET"))
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe("Alice")
  })

  it("includes nested sub-resources", async () => {
    const d = await prisma.designer.create({
      data: { userId: testUserId, name: "Carol", role: "UX Designer", roleLevel: "Level 1 Experience Designer", avatarClass: "av-teal" },
    })
    await prisma.designerSkill.create({ data: { designerId: d.id, skillName: "visual_design", value: 5 } })
    const res = await GET(makeReq("http://localhost/api/designers", "GET"))
    const data = await res.json()
    expect(data[0].skills).toHaveLength(1)
    expect(data[0].skills[0].skillName).toBe("visual_design")
  })
})

describe("POST /api/designers", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await POST(makeReq("http://localhost/api/designers", "POST", {
      name: "Alice", role: "UX Designer", roleLevel: "Senior Experience Designer", dreyfusStage: "COMPETENT",
    }))
    expect(res.status).toBe(401)
  })

  it("creates a designer and returns 201", async () => {
    const res = await POST(makeReq("http://localhost/api/designers", "POST", {
      name: "Alice", role: "UX Designer", roleLevel: "Senior Experience Designer", dreyfusStage: "COMPETENT",
    }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.name).toBe("Alice")
    expect(data.dreyfusStage).toBe("COMPETENT")
    expect(data.userId).toBe(testUserId)
    expect(data.avatarClass).toMatch(/^av-/)
  })

  it("returns 422 when name is missing", async () => {
    const res = await POST(makeReq("http://localhost/api/designers", "POST", {
      role: "UX Designer", roleLevel: "Senior Experience Designer",
    }))
    expect(res.status).toBe(422)
  })
})
