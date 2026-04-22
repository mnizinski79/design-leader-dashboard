/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  BCRYPT_ROUNDS: 12,
}))

import { GET, POST } from "@/app/api/notes/route"
import { GET as GET_ONE, PATCH, DELETE } from "@/app/api/notes/[id]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = auth as jest.Mock
let testUserId: string
let tagId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Notes Test", email: "notes.test@test.example", passwordHash: "hash" },
  })
  testUserId = user.id
  const tag = await prisma.noteTag.create({ data: { userId: testUserId, name: "design" } })
  tagId = tag.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.example" } } })
  await prisma.$disconnect()
})

beforeEach(() => {
  mockAuth.mockResolvedValue({
    user: { id: testUserId, name: "Notes Test", email: "notes.test@test.example" },
  })
})

afterEach(async () => {
  await prisma.note.deleteMany({ where: { userId: testUserId } })
})

function makeReq(url: string, method: string, body?: object) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/notes", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await GET(makeReq("http://localhost/api/notes", "GET"))
    expect(res.status).toBe(401)
  })

  it("returns empty array when user has no notes", async () => {
    const res = await GET(makeReq("http://localhost/api/notes", "GET"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("returns notes for the authenticated user only", async () => {
    await prisma.note.create({
      data: { userId: testUserId, title: "My note", project: "Alpha", body: "body", date: new Date("2026-04-21") },
    })
    const other = await prisma.user.create({
      data: { name: "Other", email: "other.notes@test.example", passwordHash: "hash" },
    })
    await prisma.note.create({
      data: { userId: other.id, title: "Not mine", project: "Beta", body: "body", date: new Date("2026-04-21") },
    })

    const res = await GET(makeReq("http://localhost/api/notes", "GET"))
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe("My note")
  })

  it("filters by project query param", async () => {
    await prisma.note.create({
      data: { userId: testUserId, title: "Alpha note", project: "Alpha", body: "x", date: new Date("2026-04-21") },
    })
    await prisma.note.create({
      data: { userId: testUserId, title: "Beta note", project: "Beta", body: "x", date: new Date("2026-04-21") },
    })

    const res = await GET(makeReq("http://localhost/api/notes?project=Alpha", "GET"))
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].project).toBe("Alpha")
  })

  it("filters by tag query param", async () => {
    const note = await prisma.note.create({
      data: { userId: testUserId, title: "Tagged note", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    await prisma.noteTagAssignment.create({ data: { noteId: note.id, tagId } })
    await prisma.note.create({
      data: { userId: testUserId, title: "Untagged note", project: "P", body: "x", date: new Date("2026-04-21") },
    })

    const res = await GET(makeReq("http://localhost/api/notes?tag=design", "GET"))
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe("Tagged note")
  })

  it("includes tag names in each note", async () => {
    const note = await prisma.note.create({
      data: { userId: testUserId, title: "Tagged", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    await prisma.noteTagAssignment.create({ data: { noteId: note.id, tagId } })

    const res = await GET(makeReq("http://localhost/api/notes", "GET"))
    const body = await res.json()
    expect(body[0].tags).toEqual([{ id: tagId, name: "design" }])
  })
})

describe("POST /api/notes", () => {
  it("creates a note and returns 201", async () => {
    const res = await POST(makeReq("http://localhost/api/notes", "POST", {
      title: "New note",
      project: "Alpha",
      body: "Some content",
      date: "2026-04-21",
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe("New note")
    expect(body.project).toBe("Alpha")
    expect(body.date).toBe("2026-04-21")
    expect(body.tags).toEqual([])
  })

  it("creates a note with tags", async () => {
    const res = await POST(makeReq("http://localhost/api/notes", "POST", {
      title: "Tagged note",
      project: "P",
      body: "content",
      date: "2026-04-21",
      tagIds: [tagId],
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.tags).toEqual([{ id: tagId, name: "design" }])
  })

  it("returns 422 when title is missing", async () => {
    const res = await POST(makeReq("http://localhost/api/notes", "POST", {
      project: "P", body: "x", date: "2026-04-21",
    }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when date format is invalid", async () => {
    const res = await POST(makeReq("http://localhost/api/notes", "POST", {
      title: "T", project: "P", body: "x", date: "not-a-date",
    }))
    expect(res.status).toBe(422)
  })
})

describe("GET /api/notes/[id]", () => {
  it("returns a note with tags", async () => {
    const note = await prisma.note.create({
      data: { userId: testUserId, title: "Detail", project: "P", body: "body", date: new Date("2026-04-21") },
    })
    await prisma.noteTagAssignment.create({ data: { noteId: note.id, tagId } })

    const res = await GET_ONE(
      makeReq(`http://localhost/api/notes/${note.id}`, "GET"),
      { params: { id: note.id } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe("Detail")
    expect(body.tags).toEqual([{ id: tagId, name: "design" }])
  })

  it("returns 404 when note does not exist", async () => {
    const res = await GET_ONE(
      makeReq("http://localhost/api/notes/00000000-0000-0000-0000-000000000000", "GET"),
      { params: { id: "00000000-0000-0000-0000-000000000000" } }
    )
    expect(res.status).toBe(404)
  })

  it("returns 404 for another user's note", async () => {
    const other = await prisma.user.create({
      data: { name: "Other2", email: "other2.notes@test.example", passwordHash: "hash" },
    })
    const note = await prisma.note.create({
      data: { userId: other.id, title: "Not yours", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    const res = await GET_ONE(
      makeReq(`http://localhost/api/notes/${note.id}`, "GET"),
      { params: { id: note.id } }
    )
    expect(res.status).toBe(404)
  })
})

describe("PATCH /api/notes/[id]", () => {
  it("updates title and returns 200", async () => {
    const note = await prisma.note.create({
      data: { userId: testUserId, title: "Original", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    const res = await PATCH(
      makeReq(`http://localhost/api/notes/${note.id}`, "PATCH", { title: "Updated" }),
      { params: { id: note.id } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe("Updated")
  })

  it("replaces tags when tagIds provided", async () => {
    const note = await prisma.note.create({
      data: { userId: testUserId, title: "N", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    await prisma.noteTagAssignment.create({ data: { noteId: note.id, tagId } })

    const res = await PATCH(
      makeReq(`http://localhost/api/notes/${note.id}`, "PATCH", { tagIds: [] }),
      { params: { id: note.id } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tags).toEqual([])
  })

  it("returns 403 for another user's note", async () => {
    const other = await prisma.user.create({
      data: { name: "Other3", email: "other3.notes@test.example", passwordHash: "hash" },
    })
    const note = await prisma.note.create({
      data: { userId: other.id, title: "Not yours", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    const res = await PATCH(
      makeReq(`http://localhost/api/notes/${note.id}`, "PATCH", { title: "Hacked" }),
      { params: { id: note.id } }
    )
    expect(res.status).toBe(403)
  })
})

describe("DELETE /api/notes/[id]", () => {
  it("deletes a note and returns 204", async () => {
    const note = await prisma.note.create({
      data: { userId: testUserId, title: "Delete me", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/notes/${note.id}`, "DELETE"),
      { params: { id: note.id } }
    )
    expect(res.status).toBe(204)
    expect(await prisma.note.findUnique({ where: { id: note.id } })).toBeNull()
  })

  it("returns 403 for another user's note", async () => {
    const other = await prisma.user.create({
      data: { name: "Other4", email: "other4.notes@test.example", passwordHash: "hash" },
    })
    const note = await prisma.note.create({
      data: { userId: other.id, title: "Not yours", project: "P", body: "x", date: new Date("2026-04-21") },
    })
    const res = await DELETE(
      makeReq(`http://localhost/api/notes/${note.id}`, "DELETE"),
      { params: { id: note.id } }
    )
    expect(res.status).toBe(403)
  })
})
