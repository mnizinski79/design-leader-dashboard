import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SharedTasksGrid } from "@/components/shared-tasks/SharedTasksGrid"
import type { SharedTaskItem } from "@/types"

export default async function SharedTasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const tasks = await prisma.sharedTask.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { shares: { some: { userId } } },
      ],
      status: { not: "ARCHIVED" },
    },
    include: {
      creator: { select: { id: true, email: true } },
      picker: { select: { id: true, email: true } },
      shares: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const taskItems: SharedTaskItem[] = tasks.map(t => {
    const myShare = t.shares.find(s => s.userId === userId)
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status as SharedTaskItem["status"],
      creatorId: t.creatorId,
      creatorEmail: t.creator.email,
      pickedUpBy: t.pickedUpBy,
      pickedUpByEmail: t.picker?.email ?? null,
      pickedUpAt: t.pickedUpAt?.toISOString() ?? null,
      todoId: t.todoId,
      shares: t.shares.map(s => ({
        id: s.id,
        userId: s.userId,
        userEmail: s.user.email,
        viewedAt: s.viewedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
      viewedAt: myShare?.viewedAt?.toISOString() ?? null,
      isCreator: t.creatorId === userId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <SharedTasksGrid initialTasks={taskItems} />
    </div>
  )
}
