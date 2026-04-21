"use client"

import { useState } from "react"
import type { NoteTagItem } from "@/types"

interface Props {
  allTags: NoteTagItem[]
  selectedTagIds: string[]
  onChange: (ids: string[]) => void
  onCreateTag: (name: string) => Promise<NoteTagItem>
}

export function TagSelector({ allTags, selectedTagIds, onChange, onCreateTag }: Props) {
  const [input, setInput] = useState("")
  const [creating, setCreating] = useState(false)

  const selectedTags = allTags.filter(t => selectedTagIds.includes(t.id))
  const unselectedTags = allTags.filter(t => !selectedTagIds.includes(t.id))
  const filtered = input
    ? unselectedTags.filter(t => t.name.toLowerCase().includes(input.toLowerCase()))
    : unselectedTags

  function remove(id: string) {
    onChange(selectedTagIds.filter(tid => tid !== id))
  }

  function add(id: string) {
    onChange([...selectedTagIds, id])
    setInput("")
  }

  async function handleCreate() {
    const name = input.trim()
    if (!name) return
    setCreating(true)
    try {
      const tag = await onCreateTag(name)
      onChange([...selectedTagIds, tag.id])
      setInput("")
    } finally {
      setCreating(false)
    }
  }

  const showCreate = input.trim().length > 0 &&
    !allTags.some(t => t.name.toLowerCase() === input.trim().toLowerCase())

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 min-h-6">
        {selectedTags.map(t => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2.5 py-1"
          >
            {t.name}
            <button
              onClick={() => remove(t.id)}
              className="hover:text-blue-900 font-bold leading-none"
              aria-label={`Remove tag ${t.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add tag..."
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        {(filtered.length > 0 || showCreate) && input && (
          <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {filtered.slice(0, 8).map(t => (
              <button
                key={t.id}
                onClick={() => add(t.id)}
                className="w-full text-left text-xs px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                {t.name}
              </button>
            ))}
            {showCreate && (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full text-left text-xs px-3 py-2 hover:bg-blue-50 text-blue-600 font-medium border-t border-slate-100 transition-colors"
              >
                {creating ? "Creating..." : `Create "${input.trim()}"`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
