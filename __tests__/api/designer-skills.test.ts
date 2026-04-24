/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { PUT } from "@/app/api/designers/[id]/skills/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let designerId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Skills Test", email: "designer.skills@test.example", passwordHash: "hash" },
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
  await prisma.designerSkill.deleteMany({ where: { designerId } })
})

function makeReq(url: string, body: object) {
  return new Request(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const FULL_SKILLS = [
  { skillName: "visual_design", value: 7 },
  { skillName: "interaction", value: 5 },
  { skillName: "prototyping", value: 3 },
  { skillName: "ia", value: 4 },
  { skillName: "research", value: 6 },
  { skillName: "facilitation", value: 2 },
  { skillName: "empathy", value: 8 },
  { skillName: "analytical", value: 5 },
  { skillName: "communication", value: 7 },
  { skillName: "leadership", value: 4 },
  { skillName: "balancing", value: 3 },
  { skillName: "process", value: 6 },
]

describe("PUT /api/designers/[id]/skills", () => {
  it("batch upserts all 12 skills", async () => {
    const res = await PUT(
      makeReq(`http://localhost/api/designers/${designerId}/skills`, { skills: FULL_SKILLS }),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(200)
    const skills = await prisma.designerSkill.findMany({ where: { designerId } })
    expect(skills).toHaveLength(12)
  })

  it("updates existing skills on second call", async () => {
    await PUT(
      makeReq(`http://localhost/api/designers/${designerId}/skills`, { skills: FULL_SKILLS }),
      { params: { id: designerId } }
    )
    const updated = FULL_SKILLS.map(s => s.skillName === "visual_design" ? { ...s, value: 9 } : s)
    await PUT(
      makeReq(`http://localhost/api/designers/${designerId}/skills`, { skills: updated }),
      { params: { id: designerId } }
    )
    const vd = await prisma.designerSkill.findFirst({ where: { designerId, skillName: "visual_design" } })
    expect(vd?.value).toBe(9)
    const allSkills = await prisma.designerSkill.findMany({ where: { designerId } })
    expect(allSkills).toHaveLength(12)
  })

  it("returns 403 for another user's designer", async () => {
    const other = await prisma.user.create({
      data: { name: "Other", email: "skills.other@test.example", passwordHash: "hash" },
    })
    const otherD = await prisma.designer.create({
      data: { userId: other.id, name: "Bob", role: "UX", roleLevel: "Lead Experience Designer", avatarClass: "av-purple" },
    })
    const res = await PUT(
      makeReq(`http://localhost/api/designers/${otherD.id}/skills`, { skills: FULL_SKILLS }),
      { params: { id: otherD.id } }
    )
    expect(res.status).toBe(403)
  })

  it("returns 422 when skills array is missing", async () => {
    const res = await PUT(
      makeReq(`http://localhost/api/designers/${designerId}/skills`, {}),
      { params: { id: designerId } }
    )
    expect(res.status).toBe(422)
  })
})
