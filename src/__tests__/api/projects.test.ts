/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockProjectFindMany = jest.fn()
const mockProjectCreate = jest.fn()
const mockProjectDesignerDeleteMany = jest.fn()
const mockProjectDesignerCreateMany = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: (...args: any[]) => mockProjectFindMany(...args),
      findUnique: jest.fn(),
      create: (...args: any[]) => mockProjectCreate(...args),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectDesigner: {
      deleteMany: (...args: any[]) => mockProjectDesignerDeleteMany(...args),
      createMany: (...args: any[]) => mockProjectDesignerCreateMany(...args),
    },
    projectDecision: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeProject = {
  id: "proj-1",
  userId: "user-1",
  name: "Hotel Redesign",
  phase: "DESIGN",
  status: "ON_TRACK",
  description: null,
  dueDate: null,
  sprintSnapshot: null,
  stakeholders: null,
  attention: null,
  blockers: null,
  createdAt: new Date("2026-04-24"),
  decisions: [],
  designers: [],
}

describe("GET /api/projects", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it("returns projects list for session user", async () => {
    const { GET } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectFindMany.mockResolvedValue([fakeProject])
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(mockProjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    )
  })
})

describe("POST /api/projects", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ name: "Project A" }))
    expect(res.status).toBe(401)
  })

  it("returns 422 for missing name", async () => {
    const { POST } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(422)
  })

  it("creates project and returns 201", async () => {
    const { POST } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectCreate.mockResolvedValue(fakeProject)
    const res = await POST(makeReq({ name: "Hotel Redesign" }))
    expect(res.status).toBe(201)
    expect(mockProjectCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Hotel Redesign", userId: "user-1" }) })
    )
  })
})
