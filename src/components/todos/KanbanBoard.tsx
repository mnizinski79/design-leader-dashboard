"use client"

import { useRef, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensors,
  useSensor,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import { type TodoItem } from "@/types"
import { KanbanColumn } from "./KanbanColumn"
import { TodoCard } from "./TodoCard"
import { TodoModal } from "./TodoModal"

type TodoStatus = "TODO" | "INPROGRESS" | "AWAITING" | "COMPLETE"
type Board = Record<TodoStatus, TodoItem[]>

const COLUMNS: { status: TodoStatus; title: string }[] = [
  { status: "TODO", title: "To Do" },
  { status: "INPROGRESS", title: "In Progress" },
  { status: "AWAITING", title: "Awaiting Response" },
  { status: "COMPLETE", title: "Complete" },
]

const STATUSES = COLUMNS.map(c => c.status)

function buildBoard(todos: TodoItem[]): Board {
  return {
    TODO: todos.filter(t => t.status === "TODO").sort((a, b) => a.sortOrder - b.sortOrder),
    INPROGRESS: todos.filter(t => t.status === "INPROGRESS").sort((a, b) => a.sortOrder - b.sortOrder),
    AWAITING: todos.filter(t => t.status === "AWAITING").sort((a, b) => a.sortOrder - b.sortOrder),
    COMPLETE: todos.filter(t => t.status === "COMPLETE").sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

interface Props {
  initialTodos: TodoItem[]
}

export function KanbanBoard({ initialTodos }: Props) {
  const [board, setBoard] = useState<Board>(() => buildBoard(initialTodos))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const dragStartStatusRef = useRef<TodoStatus | null>(null)
  const boardSnapshotRef = useRef<Board | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  function findContainer(id: UniqueIdentifier): TodoStatus | null {
    if (STATUSES.includes(id as TodoStatus)) return id as TodoStatus
    for (const status of STATUSES) {
      if (board[status].some(t => t.id === id)) return status
    }
    return null
  }

  function getActiveTodo(): TodoItem | null {
    if (!activeId) return null
    for (const status of STATUSES) {
      const found = board[status].find(t => t.id === activeId)
      if (found) return found
    }
    return null
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
    dragStartStatusRef.current = findContainer(active.id)
    boardSnapshotRef.current = board
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)
    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setBoard(prev => {
      const source = prev[activeContainer]
      const target = prev[overContainer]
      const activeItem = source.find(t => t.id === active.id)!
      const overIndex = target.findIndex(t => t.id === over.id)
      const insertIndex = overIndex >= 0 ? overIndex : target.length
      return {
        ...prev,
        [activeContainer]: source.filter(t => t.id !== active.id),
        [overContainer]: [
          ...target.slice(0, insertIndex),
          { ...activeItem, status: overContainer },
          ...target.slice(insertIndex),
        ],
      }
    })
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const currentContainer = findContainer(active.id)
    const originalContainer = dragStartStatusRef.current
    if (!currentContainer || !originalContainer) return

    if (originalContainer === currentContainer) {
      // Same column: reorder
      const arr = board[currentContainer]
      const oldIndex = arr.findIndex(t => t.id === active.id)
      const newIndex = arr.findIndex(t => t.id === over.id)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(arr, oldIndex, newIndex)
      setBoard(prev => ({ ...prev, [currentContainer]: reordered }))
      try {
        await fetch("/api/todos/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: reordered.map(t => t.id) }),
        })
      } catch {
        toast.error("Failed to save order")
        if (boardSnapshotRef.current) setBoard(boardSnapshotRef.current)
      }
    } else {
      // Cross-column: state already updated by onDragOver, just persist to DB
      if (currentContainer === "COMPLETE") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      }

      // Read sortOrder from latest committed state via functional updater
      let sortOrder = -1
      setBoard(prev => {
        sortOrder = prev[currentContainer].findIndex(t => t.id === active.id)
        return prev  // no change to state, just reading it reliably
      })

      try {
        await fetch(`/api/todos/${active.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: currentContainer, sortOrder }),
        })
      } catch {
        toast.error("Failed to save")
        if (boardSnapshotRef.current) setBoard(boardSnapshotRef.current)
      }
    }
  }

  async function handleSave(
    data: Pick<TodoItem, "title" | "description" | "category" | "status" | "dueDate" | "urgent">
  ) {
    if (editingTodo) {
      try {
        const res = await fetch(`/api/todos/${editingTodo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const updated = (await res.json()) as TodoItem
        setBoard(prev => {
          const newBoard = Object.fromEntries(
            STATUSES.map(s => [s, prev[s].filter(t => t.id !== updated.id)])
          ) as Board
          newBoard[updated.status as TodoStatus] = [
            ...newBoard[updated.status as TodoStatus],
            updated,
          ]
          return newBoard
        })
        toast.success("Task updated")
      } catch {
        toast.error("Failed to update task")
      }
    } else {
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const created = (await res.json()) as TodoItem
        setBoard(prev => ({
          ...prev,
          [created.status as TodoStatus]: [...prev[created.status as TodoStatus], created],
        }))
        toast.success("Task created")
      } catch {
        toast.error("Failed to create task")
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setBoard(prev =>
        Object.fromEntries(
          STATUSES.map(s => [s, prev[s].filter(t => t.id !== id)])
        ) as Board
      )
      toast.success("Task deleted")
    } catch {
      toast.error("Failed to delete task")
    }
  }

  // Category filter
  const allTodos = STATUSES.flatMap(s => board[s])
  const categories = ["All", ...Array.from(new Set(allTodos.map(t => t.category))).sort()]

  function filteredBoard(): Board {
    if (categoryFilter === "All") return board
    return Object.fromEntries(
      STATUSES.map(s => [s, board[s].filter(t => t.category === categoryFilter)])
    ) as Board
  }

  const displayed = filteredBoard()
  const activeTodo = getActiveTodo()

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filter:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditingTodo(null); setModalOpen(true) }}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add task
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 flex-1 min-h-[500px]">
          {COLUMNS.map(({ status, title }) => (
            <KanbanColumn
              key={status}
              id={status}
              title={title}
              items={displayed[status]}
              onEdit={todo => { setEditingTodo(todo); setModalOpen(true) }}
              onDelete={handleDelete}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTodo ? (
            <TodoCard todo={activeTodo} onEdit={() => {}} onDelete={() => {}} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TodoModal
        open={modalOpen}
        onOpenChange={open => { setModalOpen(open); if (!open) setEditingTodo(null) }}
        todo={editingTodo}
        onSave={data => { handleSave(data); setModalOpen(false) }}
      />
    </div>
  )
}
