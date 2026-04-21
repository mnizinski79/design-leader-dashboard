import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  project: z.string().min(1).max(100).optional(),
  body: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !isNaN(new Date(v).getTime()), { message: "Invalid date" }).optional(),
  summary: z.string().nullable().optional(),
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

async function resolveNote(id: string, userId: string) {
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return { error: "Not Found", status: 404 } as const
  if (note.userId !== userId) return { error: "Forbidden", status: 403 } as const
  return { note }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resolved = await resolveNote(params.id, session.user.id)
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

  const note = await prisma.note.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  })

  return NextResponse.json(serializeNote(note!))
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resolved = await resolveNote(params.id, session.user.id)
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { tagIds, date, ...rest } = parsed.data

  const note = await prisma.$transaction(async (tx) => {
    if (tagIds !== undefined) {
      await tx.noteTagAssignment.deleteMany({ where: { noteId: params.id } })
    }
    return tx.note.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
        ...(tagIds !== undefined && tagIds.length > 0
          ? { tags: { create: tagIds.map(tagId => ({ tagId })) } }
          : {}),
      },
      include: { tags: { include: { tag: true } } },
    })
  })

  return NextResponse.json(serializeNote(note))
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resolved = await resolveNote(params.id, session.user.id)
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

  await prisma.note.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
