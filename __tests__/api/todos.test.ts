/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { GET, POST } from "@/app/api/todos/route"
import { PATCH, DELETE } from "@/app/api/todos/[id]/route"
import { PATCH as REORDER } from "@/app/api/todos/reorder/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Todos Test", email: "todos.test@test.example", passwordHash: "hash" },
  })
  testUserId = user.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
  await prisma.$disconnect()
})

beforeEach(() => {
  mockAuth.mockResolvedValue({
    user: { id: testUserId, name: "Todos Test", email: "todos.test@test.example" },
  })
})

afterEach(async () => {
  await prisma.todo.deleteMany({ where: { userId: testUserId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/todos", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns empty array when user has no todos", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })

  it("returns todos for the authenticated user only", async () => {
    await prisma.todo.create({
      data: { userId: testUserId, title: "My task", category: "Design", sortOrder: 0 },
    })
    const other = await prisma.user.create({
      data: { name: "Other", email: "other.todos@test.example", passwordHash: "hash" },
    })
    await prisma.todo.create({
      data: { userId: other.id, title: "Not mine", category: "Design", sortOrder: 0 },
    })

    const res = await GET()
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe("My task")
  })
})

describe("POST /api/todos", () => {
  it("creates a todo and returns 201", async () => {
    const res = await POST(makeReq("http://localhost/api/todos", "POST", {
      title: "New task",
      category: "Design",
      status: "TODO",
      urgent: false,
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe("New task")
    expect(body.userId).toBe(testUserId)
    expect(body.sortOrder).toBe(0)
  })

  it("returns 422 when title is missing", async () => {
    const res = await POST(makeReq("http://localhost/api/todos", "POST", { category: "Design" }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when title exceeds 200 characters", async () => {
    const res = await POST(makeReq("http://localhost/api/todos", "POST", {
      title: "x".repeat(201),
      category: "Design",
    }))
    expect(res.status).toBe(422)
  })
})

describe("PATCH /api/todos/[id]", () => {
  it("updates a todo and returns 200", async () => {
    const todo = await prisma.todo.create({
      data: { userId: testUserId, title: "Original", category: "Design", sortOrder: 0 },
    })
    const res = await PATCH(
      makeReq(`http://localhost/api/todos/${todo.id}`, "PATCH", { title: "Updated", urgent: true }),
      { params: { id: todo.id } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe("Updated")
    expect(body.urgent).toBe(true)
  })

  it("returns 404 when todo does not exist", async () => {
    const res = await PATCH(
      makeReq("http://localhost/api/todos/00000000-0000-0000-0000-000000000000", "PATCH", { title: "X" }),
      { params: { id: "00000000-0000-0000-0000-000000000000" } }
    )
    expect(res.status).toBe(404)
  })

  it("returns 403 for another user's todo", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "other2.todos@test.example", passwordHash: "hash" },
    })
    const todo = await prisma.todo.create({
      data: { userId: other.id, title: "Not yours", category: "Design", sortOrder: 0 },
    })
    const res = await PATCH(
      makeReq(`http://localhost/api/todos/${todo.id}`, "PATCH", { title: "Hacked" }),
      { params: { id: todo.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("DELETE /api/todos/[id]", () => {
  it("deletes a todo and returns 204", async () => {
    const todo = await prisma.todo.create({
      data: { userId: testUserId, title: "Delete me", category: "Design", sortOrder: 0 },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/todos/${todo.id}`, "DELETE"),
      { params: { id: todo.id } }
    )
    expect(res.status).toBe(204)
    expect(await prisma.todo.findUnique({ where: { id: todo.id } })).toBeNull()
  })

  it("returns 403 for another user's todo", async () => {
    const other = await prisma.user.create({
      data: { name: "Other3", email: "other3.todos@test.example", passwordHash: "hash" },
    })
    const todo = await prisma.todo.create({
      data: { userId: other.id, title: "Not yours", category: "Design", sortOrder: 0 },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/todos/${todo.id}`, "DELETE"),
      { params: { id: todo.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/todos/reorder", () => {
  it("updates sort orders and returns 204", async () => {
    const t1 = await prisma.todo.create({
      data: { userId: testUserId, title: "First", category: "Design", sortOrder: 0 },
    })
    const t2 = await prisma.todo.create({
      data: { userId: testUserId, title: "Second", category: "Design", sortOrder: 1 },
    })
    const res = await REORDER(
      makeReq("http://localhost/api/todos/reorder", "PATCH", { ids: [t2.id, t1.id] })
    )
    expect(res.status).toBe(204)
    const updated1 = await prisma.todo.findUnique({ where: { id: t1.id } })
    const updated2 = await prisma.todo.findUnique({ where: { id: t2.id } })
    expect(updated2!.sortOrder).toBe(0)
    expect(updated1!.sortOrder).toBe(1)
  })

  it("returns 403 if any id does not belong to the user", async () => {
    const other = await prisma.user.create({
      data: { name: "Other4", email: "other4.todos@test.example", passwordHash: "hash" },
    })
    const foreignTodo = await prisma.todo.create({
      data: { userId: other.id, title: "Foreign", category: "Design", sortOrder: 0 },
    })
    const myTodo = await prisma.todo.create({
      data: { userId: testUserId, title: "Mine", category: "Design", sortOrder: 0 },
    })
    const res = await REORDER(
      makeReq("http://localhost/api/todos/reorder", "PATCH", { ids: [myTodo.id, foreignTodo.id] })
    )
    expect(res.status).toBe(403)
  })
})
