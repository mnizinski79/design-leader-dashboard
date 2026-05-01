"use client"

import type { SharedTaskItem } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  task: SharedTaskItem
  onClick: (task: SharedTaskItem) => void
  onPickUp: (id: string) => void
}

export function SharedTaskCard({ task, onClick, onPickUp }: Props) {
  const isNew = !task.isCreator && task.viewedAt === null
  const isPickedUp = task.status === "PICKED_UP"
  const pickedUpByMe = isPickedUp && task.pickedUpBy !== null

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-slate-300 transition-colors",
        isNew && "border-l-2 border-l-blue-500",
        isPickedUp && "opacity-60"
      )}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>
        {isNew && (
          <span className="shrink-0 text-xs bg-blue-50 text-blue-700 font-semibold rounded-full px-2.5 py-0.5">
            New
          </span>
        )}
        {isPickedUp && pickedUpByMe && (
          <span className="shrink-0 text-xs bg-green-50 text-green-700 font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap">
            You picked this up
          </span>
        )}
        {isPickedUp && !pickedUpByMe && (
          <span className="shrink-0 text-xs bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5">
            Picked Up
          </span>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs text-slate-400">
          {task.isCreator ? `You · ${task.shares.length} shared` : task.creatorEmail}
        </span>
        {task.status === "OPEN" && (
          <button
            onClick={(e) => { e.stopPropagation(); onPickUp(task.id) }}
            className="shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-2.5 py-1 transition-colors"
          >
            Pick Up →
          </button>
        )}
        {isPickedUp && !pickedUpByMe && task.pickedUpByEmail && (
          <span className="text-xs text-slate-400 truncate max-w-[120px]">
            {task.pickedUpByEmail.split("@")[0]} picked this up
          </span>
        )}
      </div>
    </div>
  )
}
