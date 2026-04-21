import Link from "next/link"
import { type TodoItem } from "@/types"
import { getDueBadge } from "@/lib/todo-utils"

interface Props {
  todos: TodoItem[]
}

export function PriorityTasks({ todos }: Props) {
  const priority = todos
    .filter(t => t.status !== "COMPLETE")
    .sort((a, b) => {
      // Urgent first, then overdue, then rest
      if (a.urgent !== b.urgent) return Number(b.urgent) - Number(a.urgent)
      const aOverdue = getDueBadge(a.dueDate) === "overdue" ? 1 : 0
      const bOverdue = getDueBadge(b.dueDate) === "overdue" ? 1 : 0
      return bOverdue - aOverdue
    })
    .slice(0, 3)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">Priority Tasks</h2>
        <Link href="/todos" className="text-xs text-blue-600 hover:underline">
          View all →
        </Link>
      </div>
      {priority.length === 0 ? (
        <p className="text-sm text-slate-400">No open tasks — all caught up!</p>
      ) : (
        <div className="space-y-3">
          {priority.map(todo => {
            const badge = getDueBadge(todo.dueDate)
            return (
              <div key={todo.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{todo.title}</p>
                  <p className="text-xs text-slate-400">{todo.category}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {todo.urgent && (
                    <span className="text-xs font-semibold text-red-600">Urgent</span>
                  )}
                  {badge === "overdue" && (
                    <span className="text-xs text-red-500">Overdue</span>
                  )}
                  {badge === "today" && (
                    <span className="text-xs text-amber-600">Today</span>
                  )}
                  {badge === "soon" && (
                    <span className="text-xs text-blue-600">Soon</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
