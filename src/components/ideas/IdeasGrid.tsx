"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { IdeaItem } from "@/types"
import { IdeaCard } from "./IdeaCard"
import { IdeaModal } from "./IdeaModal"
import { IDEA_CATEGORIES } from "./categories"

interface Props {
  initialIdeas: IdeaItem[]
}

export function IdeasGrid({ initialIdeas }: Props) {
  const router = useRouter()
  const [ideas, setIdeas] = useState<IdeaItem[]>(initialIdeas)
  const [showModal, setShowModal] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("")

  function handleCreate(idea: IdeaItem) {
    setIdeas(prev => [idea, ...prev])
    router.refresh()
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" })
      if (res.ok) {
        setIdeas(prev => prev.filter(i => i.id !== id))
        router.refresh()
      }
    } catch {
      // network error — idea remains in list
    }
  }

  const filtered = categoryFilter
    ? ideas.filter(i => i.category === categoryFilter)
    : ideas

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Ideas</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Idea
        </button>
      </div>

      <label className="sr-only" htmlFor="category-filter">Filter by category</label>
      <select
        id="category-filter"
        value={categoryFilter}
        onChange={e => setCategoryFilter(e.target.value)}
        className="self-start text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
      >
        <option value="">All categories</option>
        {IDEA_CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">No ideas yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <IdeaModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreate}
        />
      )}
    </div>
  )
}
