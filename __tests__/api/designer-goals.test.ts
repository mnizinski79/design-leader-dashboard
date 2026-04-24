/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { POST } from "@/app/api/designers/[id]/goals/route"
import { PATCH, DELETE } from "@/app/api/designers/[id]/goals/[goalId]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let designerId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Goals Test", email: "designer.goals@test.example", passwordHash: "hash" },
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
  await prisma.designerGoal.deleteMany({ where: { designerId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/designers/[id]/goals", () => {
  it("creates a goal and returns 201", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/goals`, "POST", {
        title: "Improve presentation skills",
        timeline: "Q3 2026",
        meetsCriteria: "Delivers clear presentations",
        exceedsCriteria: "Facilitates design reviews",
      }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.title).toBe("Improve presentation skills")
    expect(data.status).toBe("ON_TRACK")
  })

  it("returns 422 when title or timeline is missing", async () => {
    const res = await POST(
      makeReq(`http://localhost/api/designers/${designerId}/goals`, "POST", { title: "Missing timeline" }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(422)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other", email: "goals.other@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const res = await POST(
      makeReq(`http://localhost/api/designers/${otherD.id}/goals`, "POST", { title: "Goal", timeline: "Q1" }),
      { params: { id: otherD.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/designers/[id]/goals/[goalId]", () => {
  it("updates goal status", async () => {
    const g = await prisma.designerGoal.create({
      data: { designerId, title: "Test goal", timeline: "Q1", status: "ON_TRACK" },
    })
    const res = await PATCH(
      makeReq(`http://localhost/api/designers/${designerId}/goals/${g.id}`, "PATCH", { status: "AT_RISK" }),
      { params: { id: designerId, goalId: g.id } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe("AT_RISK")
  })
})

describe("DELETE /api/designers/[id]/goals/[goalId]", () => {
  it("deletes a goal and returns 204", async () => {
    const g = await prisma.designerGoal.create({
      data: { designerId, title: "Delete me", timeline: "Q1" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${designerId}/goals/${g.id}`, "DELETE"),
      { params: { id: designerId, goalId: g.id } }
    )
    expect(res.status).toBe(204)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "goals.other2@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const g = await prisma.designerGoal.create({
      data: { designerId: otherD.id, title: "Other goal", timeline: "Q1" },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/designers/${otherD.id}/goals/${g.id}`, "DELETE"),
      { params: { id: otherD.id, goalId: g.id } }
    )
    expect(res.status).toBe(403)
  })
})
