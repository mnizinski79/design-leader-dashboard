/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockProjectFindUnique = jest.fn()
const mockDecisionCreate = jest.fn()
const mockDecisionFindUnique = jest.fn()
const mockDecisionDelete = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: (...args: any[]) => mockProjectFindUnique(...args) },
    projectDecision: {
      create: (...args: any[]) => mockDecisionCreate(...args),
      findUnique: (...args: any[]) => mockDecisionFindUnique(...args),
      delete: (...args: any[]) => mockDecisionDelete(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeProject = { id: "proj-1", userId: "user-1" }

describe("POST /api/projects/[id]/decisions", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/projects/[id]/decisions/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ text: "Decision A" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(401)
  })

  it("returns 404 when project not found", async () => {
    const { POST } = await import("@/app/api/projects/[id]/decisions/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectFindUnique.mockResolvedValue(null)
    const res = await POST(makeReq({ text: "Decision A" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(404)
  })

  it("returns 422 for empty text", async () => {
    const { POST } = await import("@/app/api/projects/[id]/decisions/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectFindUnique.mockResolvedValue(fakeProject)
    const res = await POST(makeReq({ text: "" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(422)
  })

  it("creates decision and returns 201", async () => {
    const { POST } = await import("@/app/api/projects/[id]/decisions/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectFindUnique.mockResolvedValue(fakeProject)
    mockDecisionCreate.mockResolvedValue({
      id: "dec-1", projectId: "proj-1", text: "Decision A", createdAt: new Date("2026-04-24"),
    })
    const res = await POST(makeReq({ text: "Decision A" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(201)
  })
})

describe("DELETE /api/projects/[id]/decisions/[did]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/decisions/[did]/route")
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeReq(), { params: { id: "proj-1", did: "dec-1" } })
    expect(res.status).toBe(401)
  })

  it("returns 404 when decision not found", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/decisions/[did]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockDecisionFindUnique.mockResolvedValue(null)
    const res = await DELETE(makeReq(), { params: { id: "proj-1", did: "dec-1" } })
    expect(res.status).toBe(404)
  })

  it("returns 403 when decision belongs to another user's project", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/decisions/[did]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockDecisionFindUnique.mockResolvedValue({
      id: "dec-1",
      project: { userId: "other-user" },
    })
    const res = await DELETE(makeReq(), { params: { id: "proj-1", did: "dec-1" } })
    expect(res.status).toBe(403)
  })

  it("deletes decision and returns ok", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/decisions/[did]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockDecisionFindUnique.mockResolvedValue({
      id: "dec-1",
      project: { userId: "user-1" },
    })
    mockDecisionDelete.mockResolvedValue({})
    const res = await DELETE(makeReq(), { params: { id: "proj-1", did: "dec-1" } })
    expect(res.status).toBe(200)
  })
})
