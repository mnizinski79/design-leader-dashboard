/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockTaskFindFirst = jest.fn()
const mockUserFindUnique = jest.fn()
const mockShareCreate = jest.fn()
const mockShareDelete = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    sharedTask: { findFirst: (...args: any[]) => mockTaskFindFirst(...args) },
    user: { findUnique: (...args: any[]) => mockUserFindUnique(...args) },
    sharedTaskShare: {
      create: (...args: any[]) => mockShareCreate(...args),
      deleteMany: (...args: any[]) => mockShareDelete(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeTask = { id: "task-1", creatorId: "user-1", status: "OPEN" }

describe("POST /api/shared-tasks/[id]/shares", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ email: "a@b.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when user is not the creator", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue({ user: { id: "not-creator" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    const res = await POST(makeReq({ email: "a@b.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(403)
  })

  it("returns 422 when email has no account", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    mockUserFindUnique.mockResolvedValue(null)
    const res = await POST(makeReq({ email: "ghost@co.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(422)
  })

  it("creates share and returns 201", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    mockUserFindUnique.mockResolvedValue({ id: "user-2", email: "sarah@co.com" })
    const fakeShare = { id: "share-1", sharedTaskId: "task-1", userId: "user-2", user: { id: "user-2", email: "sarah@co.com" }, viewedAt: null, createdAt: new Date() }
    mockShareCreate.mockResolvedValue(fakeShare)
    const res = await POST(makeReq({ email: "sarah@co.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(201)
  })
})

describe("DELETE /api/shared-tasks/[id]/shares/[userId]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/shares/[userId]/route")
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1", userId: "user-2" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when user is not the creator", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/shares/[userId]/route")
    mockAuth.mockResolvedValue({ user: { id: "not-creator" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1", userId: "user-2" }) })
    expect(res.status).toBe(403)
  })

  it("removes share and returns 200", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/shares/[userId]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    mockShareDelete.mockResolvedValue({ count: 1 })
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1", userId: "user-2" }) })
    expect(res.status).toBe(200)
  })
})

export {}
