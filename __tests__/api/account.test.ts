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

// ─── Password ────────────────────────────────────────────────────────────────

describe("PATCH /api/account/password", () => {
  beforeEach(async () => {
    // Reset password to known value before each test
    const hash = await bcrypt.hash("currentpassword", 12)
    await prisma.user.update({ where: { id: testUserId }, data: { passwordHash: hash } })
  })

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await patchPassword(makeReq("http://localhost/api/account/password", {
      currentPassword: "currentpassword",
      newPassword: "newpassword123",
    }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when current password is wrong", async () => {
    const res = await patchPassword(makeReq("http://localhost/api/account/password", {
      currentPassword: "wrongpassword",
      newPassword: "newpassword123",
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Current password is incorrect")
  })

  it("returns 400 when new password is shorter than 8 characters", async () => {
    const res = await patchPassword(makeReq("http://localhost/api/account/password", {
      currentPassword: "currentpassword",
      newPassword: "short",
    }))
    expect(res.status).toBe(400)
  })

  it("updates password hash when current password is correct", async () => {
    const res = await patchPassword(makeReq("http://localhost/api/account/password", {
      currentPassword: "currentpassword",
      newPassword: "newpassword123",
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)

    const user = await prisma.user.findUnique({ where: { id: testUserId } })
    const valid = await bcrypt.compare("newpassword123", user!.passwordHash)
    expect(valid).toBe(true)
  })
})
