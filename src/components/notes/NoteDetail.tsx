"use client"

import { useState, useEffect, useCallback } from "react"
import { TagSelector } from "./TagSelector"
import type { NoteItem, NoteTagItem } from "@/types"

interface Props {
  note: NoteItem
  allTags: NoteTagItem[]
  onUpdate: (note: NoteItem) => void
  onDelete: (id: string) => void
  onTagsChange: (updatedTags: NoteTagItem[]) => void
}

function CopyPromptButton({ label, buildPrompt }: { label: string; buildPrompt: () => string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    await navigator.clipboard.writeText(buildPrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  )
}

export function NoteDetail({ note, allTags, onUpdate, onDelete, onTagsChange }: Props) {
  const [title, setTitle] = useState(note.title)
  const [project, setProject] = useState(note.project)
  const [date, setDate] = useState(note.date)
  const [body, setBody] = useState(note.body)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(note.title)
    setProject(note.project)
    setDate(note.date)
    setBody(note.body)
  }, [note.id, note.title, note.project, note.date, note.body])

  const save = useCallback(async (patch: Partial<{ title: string; project: string; date: string; body: string }>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
      }
    } finally {
      setSaving(false)
    }
  }, [note.id, onUpdate])

  async function handleTagsChange(tagIds: string[]) {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
    }
  }

  async function handleCreateTag(name: string): Promise<NoteTagItem> {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const tag = await res.json()
    onTagsChange([...allTags, tag])
    return tag
  }

  async function handleDelete() {
    if (!confirm(`Delete note "${note.title}"?`)) return
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
    onDelete(note.id)
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <input
          className="flex-1 text-xl font-semibold text-slate-900 border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none py-1 bg-transparent"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => { if (title !== note.title) save({ title }) }}
          placeholder="Note title"
        />
        <button
          onClick={handleDelete}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors shrink-0"
        >
          Delete
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Project</label>
          <input
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={project}
            onChange={e => setProject(e.target.value)}
            onBlur={() => { if (project !== note.project) save({ project }) }}
            placeholder="Project name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date</label>
          <input
            type="date"
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={date}
            onChange={e => setDate(e.target.value)}
            onBlur={() => { if (date !== note.date) save({ date }) }}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tags</label>
        <div className="mt-1">
          <TagSelector
            allTags={allTags}
            selectedTagIds={note.tags.map(t => t.id)}
            onChange={handleTagsChange}
            onCreateTag={handleCreateTag}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Notes</label>
        <textarea
          className="flex-1 text-sm text-slate-800 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none font-mono leading-relaxed"
          value={body}
          onChange={e => setBody(e.target.value)}
          onBlur={() => { if (body !== note.body) save({ body }) }}
          placeholder="Write your notes here..."
        />
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {saving && <span className="text-xs text-slate-400">Saving...</span>}
        <div className="flex gap-2 ml-auto">
          <CopyPromptButton
            label="Copy AI Summary Prompt"
            buildPrompt={() =>
              `Please summarize the following note and extract the key insights and decisions:\n\nTitle: ${note.title}\nProject: ${note.project}\nDate: ${note.date}\n\n${note.body}`
            }
          />
          <CopyPromptButton
            label="Copy Extract Actions Prompt"
            buildPrompt={() =>
              `Please extract all action items, tasks, and next steps from the following note. Format them as a numbered list:\n\nTitle: ${note.title}\nProject: ${note.project}\n\n${note.body}`
            }
          />
        </div>
      </div>
    </div>
  )
}
