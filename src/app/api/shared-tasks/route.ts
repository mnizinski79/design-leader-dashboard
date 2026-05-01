import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  shareEmails: z.array(z.string().email()).default([]),
})

function serializeTask(task: any, userId: string) {
  const myShare = task.shares.find((s: any) => s.userId === userId)
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    creatorId: task.creatorId,
    creatorEmail: task.creator.email,
    pickedUpBy: task.pickedUpBy,
    pickedUpByEmail: task.picker?.email ?? null,
    pickedUpAt: task.pickedUpAt?.toISOString() ?? null,
    todoId: task.todoId,
    shares: task.shares.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      userEmail: s.user.email,
      viewedAt: s.viewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    viewedAt: myShare?.viewedAt?.toISOString() ?? null,
    isCreator: task.creatorId === userId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

const taskInclude = {
  creator: { select: { id: true, email: true } },
  picker: { select: { id: true, email: true } },
  shares: {
    include: { user: { select: { id: true, email: true } } },
  },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const tasks = await prisma.sharedTask.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { shares: { some: { userId } } },
      ],
      status: { not: "ARCHIVED" },
    },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tasks.map(t => serializeTask(t, userId)))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { title, description, shareEmails } = parsed.data

  // Resolve all share emails to user accounts
  const shareUsers: { id: string; email: string }[] = []
  for (const email of shareEmails) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
    if (!user) {
      return NextResponse.json(
        { error: `No account found for ${email}` },
        { status: 422 }
      )
    }
    if (user.id !== userId) shareUsers.push(user)
  }

  const task = await prisma.sharedTask.create({
    data: {
      title,
      description: description ?? null,
      creatorId: userId,
      shares: {
        create: shareUsers.map(u => ({ userId: u.id })),
      },
    },
    include: taskInclude,
  })

  return NextResponse.json(serializeTask(task, userId), { status: 201 })
}
