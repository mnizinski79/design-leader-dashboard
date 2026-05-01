"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { SharedTaskItem } from "@/types"
import { SharedTaskCard } from "./SharedTaskCard"
import { NewSharedTaskModal } from "./NewSharedTaskModal"
import { SharedTaskModal } from "./SharedTaskModal"

type OwnershipFilter = "all" | "mine" | "received"
type StatusFilter = "open" | "picked_up"

interface Props {
  initialTasks: SharedTaskItem[]
}

export function SharedTasksGrid({ initialTasks }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<SharedTaskItem[]>(initialTasks)
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter | "">("")
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<SharedTaskItem | null>(null)

  async function handleCardClick(task: SharedTaskItem) {
    setSelectedTask(task)
    // Mark as viewed if recipient and not yet viewed
    if (!task.isCreator && task.viewedAt === null) {
      await fetch(`/api/shared-tasks/${task.id}/viewed`, { method: "PATCH" })
      setTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, viewedAt: new Date().toISOString() } : t)
      )
    }
  }

  async function handlePickUp(id: string) {
    const res = await fetch(`/api/shared-tasks/${id}/pickup`, { method: "POST" })
    if (res.status === 409) {
      toast.error("Someone already picked this up")
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "PICKED_UP" } : t))
      return
    }
    if (!res.ok) {
      toast.error("Failed to pick up task")
      return
    }
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    toast.success("Added to your To-Do list!")
    router.refresh()
  }

  function handleUpdate(updated: SharedTaskItem) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
  }

  function handleArchive(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
  }

  function handleCreated(task: SharedTaskItem) {
    setTasks(prev => [task, ...prev])
    router.refresh()
  }

  const filtered = tasks.filter(task => {
    if (ownershipFilter === "mine" && !task.isCreator) return false
    if (ownershipFilter === "received" && task.isCreator) return false
    if (statusFilter === "open" && task.status !== "OPEN") return false
    if (statusFilter === "picked_up" && task.status !== "PICKED_UP") return false
    return true
  })

  const pillBase = "text-xs rounded-full px-3 py-1 cursor-pointer transition-colors"
  const pillActive = "bg-blue-600 text-white font-medium"
  const pillInactive = "bg-slate-100 text-slate-600 hover:bg-slate-200"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shared Tasks</h1>
          <p className="text-slate-500 mt-0.5 text-sm">A shared backlog — pick up any open item to add it to your To-Do list</p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Task
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 mr-1">Filter:</span>
        <span className={`${pillBase} ${ownershipFilter === "all" ? pillActive : pillInactive}`} onClick={() => setOwnershipFilter("all")}>All</span>
        <span className={`${pillBase} ${ownershipFilter === "mine" ? pillActive : pillInactive}`} onClick={() => setOwnershipFilter("mine")}>Added by Me</span>
        <span className={`${pillBase} ${ownershipFilter === "received" ? pillActive : pillInactive}`} onClick={() => setOwnershipFilter("received")}>Shared with Me</span>
        <div className="ml-auto flex gap-2">
          <span className={`${pillBase} ${statusFilter === "open" ? pillActive : pillInactive}`} onClick={() => setStatusFilter(prev => prev === "open" ? "" : "open")}>Open</span>
          <span className={`${pillBase} ${statusFilter === "picked_up" ? pillActive : pillInactive}`} onClick={() => setStatusFilter(prev => prev === "picked_up" ? "" : "picked_up")}>Picked Up</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">No shared tasks yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <SharedTaskCard
              key={task.id}
              task={task}
              onClick={handleCardClick}
              onPickUp={handlePickUp}
            />
          ))}
        </div>
      )}

      {isNewModalOpen && (
        <NewSharedTaskModal
          onClose={() => setIsNewModalOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {selectedTask && (
        <SharedTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onPickUp={handlePickUp}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )}
    </div>
  )
}
