"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes)
  const [allTags, setAllTags] = useState<NoteTagItem[]>(initialTags)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"notes" | "ideas">("notes")
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [search, setSearch] = useState("")
  const [project, setProject] = useState("")
  const [tagFilter, setTagFilter] = useState("")

  const selectedNote = notes.find(n => n.id === selectedNoteId) ?? null

  const projects = useMemo(() => {
    const set = new Set(notes.map(n => n.project).filter(Boolean))
    return Array.from(set).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false
      if (project && n.project !== project) return false
      if (tagFilter && !n.tags.some(t => t.id === tagFilter)) return false
      return true
    })
  }, [notes, search, project, tagFilter])

  async function handleNewNote() {
    const today = new Date().toLocaleDateString("en-CA")
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
      router.refresh()
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
    <div className="h-full flex flex-col max-w-5xl">
      <div className="shrink-0 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Notes &amp; Ideas</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Capture meeting notes, insights, and design ideas</p>
      </div>
      {/* Tabs + Add button */}
      <div className="flex items-center border-b border-slate-200 shrink-0">
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
        <div className="ml-auto pr-0 pb-1">
          <button
            onClick={activeTab === "notes" ? handleNewNote : () => setShowIdeaModal(true)}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {activeTab === "notes" ? "+ New Note" : "+ New Idea"}
          </button>
        </div>
      </div>

      {/* Filter row — only shown for Notes tab */}
      {activeTab === "notes" && (
        <div className="flex items-center gap-2 py-3 border-b border-slate-200 shrink-0">
          <select
            value={project}
            onChange={e => setProject(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">All projects</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">All tags</option>
            {allTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-auto text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white w-56"
          />
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "notes" ? (
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-72 shrink-0 overflow-y-auto">
              <NotesSidebar
                notes={filteredNotes}
                selectedId={selectedNoteId}
                onSelect={handleSelectNote}
              />
            </div>

            {/* Detail panel */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {selectedNote ? (
                <div className="bg-white overflow-hidden h-full flex flex-col border-l border-slate-100">
                  <NoteDetail
                    key={selectedNote.id}
                    note={selectedNote}
                    allTags={allTags}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                    onTagsChange={handleTagsChange}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">Select a note or create a new one</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <IdeasGrid
            initialIdeas={initialIdeas}
            isModalOpen={showIdeaModal}
            onModalClose={() => setShowIdeaModal(false)}
          />
        )}
      </div>
    </div>
  )
}
