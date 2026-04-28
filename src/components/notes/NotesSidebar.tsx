"use client"

import { cn } from "@/lib/utils"
import type { NoteItem } from "@/types"

interface Props {
  notes: NoteItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function NotesSidebar({ notes, selectedId, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No notes match your filters</p>
        ) : (
          notes.map(note => (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelect(note.id)}
              className={cn(
                "w-full text-left p-3 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-transparent hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all",
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
