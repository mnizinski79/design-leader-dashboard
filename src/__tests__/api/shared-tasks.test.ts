/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockSharedTaskFindMany = jest.fn()
const mockSharedTaskCreate = jest.fn()
const mockSharedTaskShareCreate = jest.fn()
const mockUserFindUnique = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    sharedTask: {
      findMany: (...args: any[]) => mockSharedTaskFindMany(...args),
      create: (...args: any[]) => mockSharedTaskCreate(...args),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sharedTaskShare: {
      create: (...args: any[]) => mockSharedTaskShareCreate(...args),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeTask = {
  id: "task-1",
  title: "Design audit",
  description: "Audit all components",
  status: "OPEN",
  creatorId: "user-1",
  creator: { id: "user-1", email: "me@co.com" },
  pickedUpBy: null,
  picker: null,
  pickedUpAt: null,
  todoId: null,
  shares: [],
  createdAt: new Date("2026-04-30"),
  updatedAt: new Date("2026-04-30"),
}

describe("GET /api/shared-tasks", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it("returns tasks where user is creator or recipient", async () => {
    const { GET } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockSharedTaskFindMany.mockResolvedValue([fakeTask])
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(mockSharedTaskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { creatorId: "user-1" },
            { shares: { some: { userId: "user-1" } } },
          ],
        }),
      })
    )
  })
})

describe("POST /api/shared-tasks", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ title: "Test" }))
    expect(res.status).toBe(401)
  })

  it("returns 422 for missing title", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const res = await POST(makeReq({ description: "no title" }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when a share email has no account", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockUserFindUnique.mockResolvedValue(null)
    const res = await POST(makeReq({ title: "Test", shareEmails: ["ghost@co.com"] }))
    expect(res.status).toBe(422)
  })

  it("creates task with shares and returns 201", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockUserFindUnique.mockResolvedValue({ id: "user-2", email: "sarah@co.com" })
    mockSharedTaskCreate.mockResolvedValue({ ...fakeTask, shares: [] })
    const res = await POST(makeReq({ title: "Design audit", shareEmails: ["sarah@co.com"] }))
    expect(res.status).toBe(201)
    expect(mockSharedTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Design audit", creatorId: "user-1" }),
      })
    )
  })
})

export {}
