/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { PATCH as patchProfile } from "@/app/api/account/profile/route"
import { PATCH as patchPassword } from "@/app/api/account/password/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const mockAuth = auth as jest.Mock
let testUserId: string

beforeAll(async () => {
  const hash = await bcrypt.hash("currentpassword", 12)
  const user = await prisma.user.create({
    data: {
      name: "Account Test",
      email: "account.test@test.example",
      passwordHash: hash,
    },
  })
  testUserId = user.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
  await prisma.$disconnect()
})

beforeEach(() => {
  mockAuth.mockResolvedValue({
    user: { id: testUserId, name: "Account Test", email: "account.test@test.example" },
  })
})

function makeReq(url: string, body: object) {
  return new Request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─── Profile ─────────────────────────────────────────────────────────────────

describe("PATCH /api/account/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await patchProfile(makeReq("http://localhost/api/account/profile", { name: "New Name" }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when name is empty", async () => {
    const res = await patchProfile(makeReq("http://localhost/api/account/profile", { name: "" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when name exceeds 100 characters", async () => {
    const res = await patchProfile(makeReq("http://localhost/api/account/profile", { name: "a".repeat(101) }))
    expect(res.status).toBe(400)
  })

  it("updates name and returns new name", async () => {
    const res = await patchProfile(makeReq("http://localhost/api/account/profile", { name: "Updated Name" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe("Updated Name")

    const user = await prisma.user.findUnique({ where: { id: testUserId } })
    expect(user?.name).toBe("Updated Name")
  })
})
