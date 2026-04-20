/**
 * @jest-environment node
 */
import { POST } from "@/app/api/register/route"
import { prisma } from "@/lib/prisma"

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

function makeRequest(body: object) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/register", () => {
  it("creates a user and returns 201", async () => {
    const res = await POST(makeRequest({
      name: "Test User",
      email: "user1@test.example",
      password: "password123",
    }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeDefined()
    expect(body.email).toBe("user1@test.example")
    expect(body.passwordHash).toBeUndefined()
  })

  it("returns 422 when email is missing", async () => {
    const res = await POST(makeRequest({ name: "Test", password: "password123" }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when password is shorter than 8 characters", async () => {
    const res = await POST(makeRequest({
      name: "Test",
      email: "user2@test.example",
      password: "short",
    }))
    expect(res.status).toBe(422)
  })

  it("returns 409 when email is already registered", async () => {
    await POST(makeRequest({
      name: "Test",
      email: "user3@test.example",
      password: "password123",
    }))

    const res = await POST(makeRequest({
      name: "Test Again",
      email: "user3@test.example",
      password: "password123",
    }))
    expect(res.status).toBe(409)
  })
})
