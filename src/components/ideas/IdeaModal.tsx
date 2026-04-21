"use client"

import { useState } from "react"
import type { IdeaItem } from "@/types"
import { IDEA_CATEGORIES } from "./categories"

interface Props {
  onClose: () => void
  onCreated: (idea: IdeaItem) => void
}

export function IdeaModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<string>(IDEA_CATEGORIES[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Failed to save idea")
        return
      }
      const idea: IdeaItem = await res.json()
      onCreated(idea)
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-800 mb-4">New Idea</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="idea-title">
              Title
            </label>
            <input
              id="idea-title"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's the idea?"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="idea-category">
              Category
            </label>
            <select
              id="idea-category"
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              {IDEA_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Idea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
