"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"
import { DesignerItem, DesignerNoteItem } from "@/types"
import { SplitButton } from "@/components/claude/SplitButton"

interface Props {
  designer: DesignerItem
  onNoteAdd: (body: string) => Promise<DesignerNoteItem>
  onNoteUpdate: (noteId: string, body: string) => Promise<void>
  onNoteDelete: (noteId: string) => Promise<void>
  onOpenClaude: (prompt: string, label: string) => void
}

export function NotesTab({ designer, onNoteAdd, onNoteUpdate, onNoteDelete, onOpenClaude }: Props) {
  const [notes, setNotes] = useState<DesignerNoteItem[]>(designer.notes)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState("")
  const [adding, setAdding] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleAddNote() {
    setAdding(true)
    try {
      const note = await onNoteAdd("")
      setNotes((prev) => [note, ...prev])
      setEditingId(note.id)
      setEditBody("")
      setTimeout(() => textareaRef.current?.focus(), 50)
    } finally {
      setAdding(false)
    }
  }

  function handleEditStart(note: DesignerNoteItem) {
    setEditingId(note.id)
    setEditBody(note.body)
  }

  async function handleEditBlur(noteId: string) {
    setNotes((prev) =>
      prev.map((n) => n.id === noteId ? { ...n, body: editBody } : n)
    )
    setEditingId(null)
    await onNoteUpdate(noteId, editBody)
  }

  async function handleDelete(noteId: string) {
    await onNoteDelete(noteId)
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    if (editingId === noteId) setEditingId(null)
  }

  function buildPrompt(): string {
    const allNotes = notes
      .filter((n) => n.body.trim())
      .map((n) => {
        const date = new Date(n.createdAt).toLocaleDateString()
        return `[${date}]\n${n.body}`
      })
      .join("\n\n---\n\n")

    return `You are helping a design manager extract action items from their private coaching notes for a direct report. Be specific — pull out concrete tasks, follow-ups, and commitments, not vague themes.

Manager notes for ${designer.name} (${designer.role}):

${allNotes || "No notes recorded yet."}

Please extract all action items, follow-ups, and to-dos from these notes. Format them as a clear numbered list, grouped by theme if possible.`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Manager Notes</h3>
        <div className="flex gap-2">
          <SplitButton
            label="Generate Actions"
            onAsk={() => onOpenClaude(buildPrompt(), `Extract To-Dos — ${designer.name}`)}
            onCopy={() => navigator.clipboard.writeText(buildPrompt()).catch(() => {})}
          />
          <button
            type="button"
            onClick={handleAddNote}
            disabled={adding}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            + Add Note
          </button>
        </div>
      </div>

      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No notes yet. Click &quot;Add Note&quot; to start.
        </p>
      )}

      <div className="space-y-3">
        {notes.map((note) => {
          const isEditing = editingId === note.id
          const dateStr = new Date(note.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })
          return (
            <div key={note.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
                <span className="text-xs text-muted-foreground">{dateStr}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="text-muted-foreground hover:text-red-600 transition-colors"
                  aria-label="Delete note"
                >
                  <X size={14} />
                </button>
              </div>
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  onBlur={() => handleEditBlur(note.id)}
                  rows={4}
                  className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                  placeholder="Write your note here…"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => handleEditStart(note)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted/20 transition-colors min-h-[4rem]"
                >
                  {note.body ? (
                    <span className="whitespace-pre-wrap">{note.body}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Click to write a note…</span>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
