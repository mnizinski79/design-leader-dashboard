"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type TodoItem } from "@/types"
import { getDueBadge } from "@/lib/todo-utils"

interface Props {
  todo: TodoItem
  onEdit: (todo: TodoItem) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}

export function TodoCard({ todo, onEdit, onDelete, isDragging = false }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const badge = getDueBadge(todo.dueDate)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border border-slate-200 rounded-lg p-3 shadow-sm select-none",
        isDragging && "shadow-xl rotate-1 scale-105"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        <div className="flex-1 min-w-0">
          {(todo.urgent || badge) && (
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {todo.urgent && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  Urgent
                </span>
              )}
              {badge === "overdue" && (
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  Overdue
                </span>
              )}
              {badge === "today" && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  Today
                </span>
              )}
              {badge === "soon" && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
            </div>
          )}

          <p className="text-sm font-medium text-slate-800 break-words leading-snug">
            {todo.title}
          </p>

          {todo.description && (
            <p className="text-xs text-slate-500 mt-0.5 break-words line-clamp-2">
              {todo.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">{todo.category}</span>
            {todo.dueDate && (
              <span className="text-xs text-slate-400">
                {new Date(todo.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0 ml-1">
          <button
            onClick={() => onEdit(todo)}
            className="text-slate-300 hover:text-blue-500 transition-colors"
            aria-label="Edit task"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="text-slate-300 hover:text-red-500 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
