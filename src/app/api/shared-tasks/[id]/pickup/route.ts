import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const result = await prisma.$transaction(async (tx) => {
    // Find the task only if it's still OPEN and the user is a participant
    const task = await tx.sharedTask.findFirst({
      where: {
        id,
        status: "OPEN",
        OR: [
          { creatorId: userId },
          { shares: { some: { userId } } },
        ],
      },
      include: {
        creator: { select: { id: true, email: true } },
        shares: { include: { user: { select: { id: true, email: true } } } },
      },
    })

    if (!task) return null

    const maxOrder = await tx.todo.aggregate({
      where: { userId, status: "TODO" },
      _max: { sortOrder: true },
    })

    const todo = await tx.todo.create({
      data: {
        userId,
        title: task.title,
        description: task.description,
        category: "Shared",
        status: "TODO",
        urgent: false,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    const updated = await tx.sharedTask.update({
      where: { id },
      data: {
        status: "PICKED_UP",
        pickedUpBy: userId,
        pickedUpAt: new Date(),
        todoId: todo.id,
      },
      include: {
        creator: { select: { id: true, email: true } },
        picker: { select: { id: true, email: true } },
        shares: { include: { user: { select: { id: true, email: true } } } },
      },
    })

    return updated
  })

  if (!result) {
    return NextResponse.json({ error: "Task is not available for pickup" }, { status: 409 })
  }

  const myShare = result.shares.find(s => s.userId === userId)
  return NextResponse.json({
    id: result.id,
    title: result.title,
    description: result.description,
    status: result.status,
    creatorId: result.creatorId,
    creatorEmail: result.creator.email,
    pickedUpBy: result.pickedUpBy,
    pickedUpByEmail: result.picker?.email ?? null,
    pickedUpAt: result.pickedUpAt?.toISOString() ?? null,
    todoId: result.todoId,
    shares: result.shares.map(s => ({
      id: s.id, userId: s.userId, userEmail: s.user.email,
      viewedAt: s.viewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    viewedAt: myShare?.viewedAt?.toISOString() ?? null,
    isCreator: result.creatorId === userId,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  }, { status: 201 })
}
