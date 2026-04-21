"use client"

import { useState } from "react"
import { NotesSidebar } from "./NotesSidebar"
import { NoteDetail } from "./NoteDetail"
import { IdeasGrid } from "@/components/ideas/IdeasGrid"
import type { NoteItem, NoteTagItem, IdeaItem } from "@/types"

interface Props {
  initialNotes: NoteItem[]
  initialTags: NoteTagItem[]
  initialIdeas: IdeaItem[]
}

export function NotesPageClient({ initialNotes, initialTags, initialIdeas }: Props) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes)
  const [allTags, setAllTags] = useState<NoteTagItem[]>(initialTags)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"notes" | "ideas">("notes")

  const selectedNote = notes.find(n => n.id === selectedNoteId) ?? null

  async function handleNewNote() {
    const today = new Date().toISOString().split("T")[0]
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled Note",
        project: "",
        body: "",
        date: today,
      }),
    })
    if (res.ok) {
      const newNote: NoteItem = await res.json()
      setNotes(prev => [newNote, ...prev])
      setSelectedNoteId(newNote.id)
    }
  }

  function handleSelectNote(id: string) {
    setSelectedNoteId(id)
  }

  function handleUpdateNote(updated: NoteItem) {
    setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)))
  }

  function handleDeleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (id === selectedNoteId) setSelectedNoteId(null)
  }

  function handleTagsChange(updatedTags: NoteTagItem[]) {
    setAllTags(updatedTags)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={
            activeTab === "notes"
              ? "px-6 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600"
              : "px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          }
        >
          Notes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ideas")}
          className={
            activeTab === "ideas"
              ? "px-6 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600"
              : "px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          }
        >
          Ideas
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "notes" ? (
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-72 shrink-0 border-r border-slate-200 overflow-y-auto">
              <NotesSidebar
                notes={notes}
                allTags={allTags}
                selectedId={selectedNoteId}
                onSelect={handleSelectNote}
                onNew={handleNewNote}
              />
            </div>

            {/* Detail panel */}
            <div className="flex-1 overflow-y-auto">
              {selectedNote ? (
                <NoteDetail
                  key={selectedNote.id}
                  note={selectedNote}
                  allTags={allTags}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  onTagsChange={handleTagsChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">Select a note or create a new one</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <IdeasGrid initialIdeas={initialIdeas} />
        )}
      </div>
    </div>
  )
}
