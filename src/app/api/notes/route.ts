import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  project: z.string().min(1).max(100),
  body: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tagIds: z.array(z.string().uuid()).optional(),
})

type NoteWithTags = {
  id: string; userId: string; title: string; project: string; body: string
  summary: string | null; date: Date; createdAt: Date; updatedAt: Date
  tags: { tag: { id: string; name: string } }[]
}

function serializeNote(n: NoteWithTags) {
  return {
    ...n,
    date: n.date.toISOString().split("T")[0],
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    tags: n.tags.map(a => ({ id: a.tag.id, name: a.tag.name })),
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const project = url.searchParams.get("project")
  const search = url.searchParams.get("search")
  const tag = url.searchParams.get("tag")

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      ...(project ? { project } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    },
    include: { tags: { include: { tag: true } } },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(notes.map(serializeNote))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { title, project, body: noteBody, date, tagIds } = parsed.data

  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      title,
      project,
      body: noteBody,
      date: new Date(date),
      ...(tagIds?.length ? {
        tags: { create: tagIds.map(tagId => ({ tagId })) },
      } : {}),
    },
    include: { tags: { include: { tag: true } } },
  })

  return NextResponse.json(serializeNote(note), { status: 201 })
}
