/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockTransaction = jest.fn()
const mockFindFirst = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: any[]) => mockTransaction(...args),
    sharedTask: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeTask = {
  id: "task-1",
  title: "Design audit",
  description: "Audit components",
  status: "OPEN",
  creatorId: "user-1",
  creator: { id: "user-1", email: "me@co.com" },
  picker: null,
  pickedUpBy: null,
  pickedUpAt: null,
  todoId: null,
  shares: [{ id: "share-1", userId: "user-2", user: { id: "user-2", email: "s@co.com" }, viewedAt: null, createdAt: new Date() }],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("POST /api/shared-tasks/[id]/pickup", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/pickup/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 409 when task is already picked up", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/pickup/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTransaction.mockImplementation(async (fn: any) => {
      return fn({
        sharedTask: {
          findFirst: jest.fn().mockResolvedValue(null), // null = not OPEN
          update: jest.fn(),
        },
        todo: {
          aggregate: jest.fn(),
          create: jest.fn(),
        },
      })
    })
    const res = await POST(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(409)
  })

  it("picks up task atomically and returns 201", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/pickup/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const fakeTodo = { id: "todo-1", userId: "user-1", title: "Design audit", description: "Audit components", category: "Shared", status: "TODO", sortOrder: 0, urgent: false, dueDate: null, createdAt: new Date() }
    const updatedTask = { ...fakeTask, status: "PICKED_UP", pickedUpBy: "user-1", pickedUpAt: new Date(), todoId: "todo-1", picker: { id: "user-1", email: "me@co.com" } }

    mockTransaction.mockImplementation(async (fn: any) => {
      return fn({
        sharedTask: {
          findFirst: jest.fn().mockResolvedValue(fakeTask),
          update: jest.fn().mockResolvedValue(updatedTask),
        },
        todo: {
          aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: -1 } }),
          create: jest.fn().mockResolvedValue(fakeTodo),
        },
      })
    })

    const res = await POST(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(201)
  })
})

export {}
