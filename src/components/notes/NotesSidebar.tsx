"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { NoteItem, NoteTagItem } from "@/types"

interface Props {
  notes: NoteItem[]
  allTags: NoteTagItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function NotesSidebar({ notes, allTags, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("")
  const [project, setProject] = useState("")
  const [tagFilter, setTagFilter] = useState("")

  const projects = useMemo(() => {
    const set = new Set(notes.map(n => n.project))
    return Array.from(set).sort()
  }, [notes])

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false
      if (project && n.project !== project) return false
      if (tagFilter && !n.tags.some(t => t.id === tagFilter)) return false
      return true
    })
  }, [notes, search, project, tagFilter])

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7]">
      <div className="p-3 space-y-2">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <div className="flex gap-2 overflow-hidden">
          <select
            value={project}
            onChange={e => setProject(e.target.value)}
            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">All projects</option>
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">All tags</option>
            {allTags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No notes match your filters</p>
        ) : (
          filtered.map(note => (
            <button
              key={note.id}
              onClick={() => onSelect(note.id)}
              className={cn(
                "w-full text-left p-3 mb-2 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-transparent hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all",
                selectedId === note.id && "bg-[#EFF6FF] border-[#93C5FD]"
              )}
            >
              <p className="text-sm font-medium text-slate-800 truncate">{note.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{note.project} · {note.date}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {note.tags.slice(0, 3).map(t => (
                    <span key={t.id} className="text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
