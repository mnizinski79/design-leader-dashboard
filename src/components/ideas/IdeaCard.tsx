"use client"

import type { IdeaItem } from "@/types"

interface Props {
  idea: IdeaItem
  onDelete: (id: string) => void
}

export function IdeaCard({ idea, onDelete }: Props) {
  const formattedDate = new Date(idea.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-800 leading-snug">{idea.title}</p>
        <button
          onClick={() => onDelete(idea.id)}
          className="shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
          aria-label="Delete idea"
        >
          Delete
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 font-medium">
          {idea.category}
        </span>
        <span className="text-xs text-slate-400">{formattedDate}</span>
      </div>
    </div>
  )
}
