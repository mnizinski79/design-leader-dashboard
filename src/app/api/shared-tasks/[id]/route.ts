import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
})

async function getTaskAsParticipant(id: string, userId: string) {
  const task = await prisma.sharedTask.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, email: true } },
      picker: { select: { id: true, email: true } },
      shares: { include: { user: { select: { id: true, email: true } } } },
    },
  })
  if (!task) return { task: null, forbidden: false }
  const isParticipant =
    task.creatorId === userId || task.shares.some(s => s.userId === userId)
  return { task, forbidden: !isParticipant }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { task, forbidden } = await getTaskAsParticipant(id, userId)
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (task.status !== "OPEN") {
    return NextResponse.json({ error: "Task is not open" }, { status: 409 })
  }

  const updated = await prisma.sharedTask.update({
    where: { id },
    data: parsed.data,
    include: {
      creator: { select: { id: true, email: true } },
      picker: { select: { id: true, email: true } },
      shares: { include: { user: { select: { id: true, email: true } } } },
    },
  })

  const myShare = updated.shares.find(s => s.userId === userId)
  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    creatorId: updated.creatorId,
    creatorEmail: updated.creator.email,
    pickedUpBy: updated.pickedUpBy,
    pickedUpByEmail: updated.picker?.email ?? null,
    pickedUpAt: updated.pickedUpAt?.toISOString() ?? null,
    todoId: updated.todoId,
    shares: updated.shares.map(s => ({
      id: s.id, userId: s.userId, userEmail: s.user.email,
      viewedAt: s.viewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    viewedAt: myShare?.viewedAt?.toISOString() ?? null,
    isCreator: updated.creatorId === userId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const { task, forbidden } = await getTaskAsParticipant(id, userId)
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  // Open tasks can only be deleted by the creator
  if (task.status === "OPEN" && task.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.sharedTask.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
