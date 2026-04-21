import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { KanbanBoard } from "@/components/todos/KanbanBoard"
import { type TodoItem } from "@/types"

export default async function TodosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  })

  const todoItems: TodoItem[] = todos.map(t => ({
    id: t.id,
    userId: t.userId,
    title: t.title,
    description: t.description,
    category: t.category,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
    urgent: t.urgent,
    sortOrder: t.sortOrder,
    createdAt: t.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">To-Do</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Manage your tasks across workstreams</p>
      </div>
      <KanbanBoard initialTodos={todoItems} />
    </div>
  )
}
