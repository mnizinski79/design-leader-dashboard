"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { type TodoItem } from "@/types"
import { TodoCard } from "./TodoCard"

interface Props {
  id: string
  title: string
  items: TodoItem[]
  onEdit: (todo: TodoItem) => void
  onDelete: (id: string) => void
}

export function KanbanColumn({ id, title, items, onEdit, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-2 min-h-[200px] transition-colors ${
          isOver ? "bg-blue-50" : ""
        }`}
      >
        <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {items.map(todo => (
            <TodoCard key={todo.id} todo={todo} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
