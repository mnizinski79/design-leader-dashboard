/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { PATCH } from "@/app/api/designers/[id]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let designerId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Patch Test", email: "designer.patch@test.example", passwordHash: "hash" },
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

function makeReq(url: string, body: object) {
  return new Request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/designers/[id]", () => {
  it("updates dreyfusStage", async () => {
    const res = await PATCH(makeReq(`http://localhost/api/designers/${designerId}`, { dreyfusStage: "PROFICIENT" }), { params: { id: designerId } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.dreyfusStage).toBe("PROFICIENT")
  })

  it("returns 403 for a designer owned by another user", async () => {
    const other = await prisma.user.create({
      data: { name: "Other", email: "patch.other@test.example", passwordHash: "hash" },
    })
    const otherDesigner = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const res = await PATCH(makeReq(`http://localhost/api/designers/${otherDesigner.id}`, { dreyfusStage: "NOVICE" }), { params: { id: otherDesigner.id } })
    expect(res.status).toBe(403)
  })

  it("returns 404 for a non-existent designer", async () => {
    const res = await PATCH(makeReq("http://localhost/api/designers/non-existent", { dreyfusStage: "NOVICE" }), { params: { id: "non-existent" } })
    expect(res.status).toBe(404)
  })
})
