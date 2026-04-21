"use client"

import { useState } from "react"
import type { IdeaItem } from "@/types"
import { IdeaCard } from "./IdeaCard"
import { IdeaModal } from "./IdeaModal"

const CATEGORIES = [
  "Process Improvement",
  "Team Culture",
  "Tool / Technology",
  "Career Development",
  "Other",
]

interface Props {
  initialIdeas: IdeaItem[]
}

export function IdeasGrid({ initialIdeas }: Props) {
  const [ideas, setIdeas] = useState<IdeaItem[]>(initialIdeas)
  const [showModal, setShowModal] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("")

  function handleCreate(idea: IdeaItem) {
    setIdeas(prev => [idea, ...prev])
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" })
    if (res.ok) {
      setIdeas(prev => prev.filter(i => i.id !== id))
    }
  }

  const filtered = categoryFilter
    ? ideas.filter(i => i.category === categoryFilter)
    : ideas

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Ideas</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Idea
        </button>
      </div>

      {/* Category filter */}
      <select
        value={categoryFilter}
        onChange={e => setCategoryFilter(e.target.value)}
        className="self-start text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
      >
        <option value="">All categories</option>
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">No ideas yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <IdeaModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreate}
        />
      )}
    </div>
  )
}
