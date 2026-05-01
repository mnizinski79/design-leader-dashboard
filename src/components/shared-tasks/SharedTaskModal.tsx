"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import type { SharedTaskItem } from "@/types"

interface Props {
  task: SharedTaskItem
  onClose: () => void
  onUpdate: (task: SharedTaskItem) => void
  onPickUp: (id: string) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

export function SharedTaskModal({ task, onClose, onUpdate, onPickUp, onDelete, onArchive }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const isOpen = task.status === "OPEN"
  const isPickedUp = task.status === "PICKED_UP"

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/shared-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save")
        return
      }
      const updated = await res.json()
      onUpdate(updated)
    } finally {
      setSaving(false)
    }
  }

  async function addShare() {
    const trimmed = emailInput.trim()
    if (!trimmed) return
    setEmailError("")
    const res = await fetch(`/api/shared-tasks/${task.id}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    })
    if (!res.ok) {
      const data = await res.json()
      setEmailError(data.error ?? "Failed to add")
      return
    }
    const newShare = await res.json()
    onUpdate({ ...task, shares: [...task.shares, newShare] })
    setEmailInput("")
  }

  async function removeShare(userId: string) {
    await fetch(`/api/shared-tasks/${task.id}/shares/${userId}`, { method: "DELETE" })
    onUpdate({ ...task, shares: task.shares.filter(s => s.userId !== userId) })
  }

  async function handlePickUp() {
    onPickUp(task.id)
    onClose()
  }

  async function handleDelete() {
    if (!confirm("Delete this shared task?")) return
    await fetch(`/api/shared-tasks/${task.id}`, { method: "DELETE" })
    onDelete(task.id)
    onClose()
  }

  async function handleArchive() {
    await fetch(`/api/shared-tasks/${task.id}/archive`, { method: "PATCH" })
    onArchive(task.id)
    onClose()
  }

  const pickedUpDate = task.pickedUpAt
    ? new Date(task.pickedUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : ""
  const pickedUpByLabel = task.pickedUpByEmail === null ? "someone" : task.pickedUpByEmail

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {isOpen && (
              <span className="text-xs bg-green-50 text-green-700 font-medium rounded-full px-2.5 py-0.5">Open</span>
            )}
            {isPickedUp && (
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5">Picked Up</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Title</label>
            {isOpen ? (
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
                maxLength={200}
              />
            ) : (
              <p className="text-sm font-semibold text-slate-400 bg-slate-50 rounded-lg px-3 py-2">{task.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
            {isOpen ? (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                rows={3}
                maxLength={1000}
              />
            ) : (
              <p className="text-sm text-slate-400 bg-slate-50 rounded-lg px-3 py-2 min-h-[72px]">
                {task.description || "No description"}
              </p>
            )}
          </div>

          {isOpen && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Shared with
              </label>
              {task.shares.map(share => (
                <div key={share.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 mb-1">
                  <span className="text-sm text-slate-700">{share.userEmail}</span>
                  {task.isCreator && (
                    <button
                      onClick={() => removeShare(share.userId)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {task.isCreator && (
                <div className="flex gap-2 mt-2">
                  <input
                    value={emailInput}
                    onChange={e => { setEmailInput(e.target.value); setEmailError("") }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addShare() } }}
                    placeholder="Add email address…"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="button"
                    onClick={addShare}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              )}
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>
          )}

          {isPickedUp && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-sm text-blue-700 font-medium">
                Picked up by {pickedUpByLabel} on {pickedUpDate} — now in their To-Do list
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <div className="flex gap-2">
            {isPickedUp && (
              <button
                onClick={handleArchive}
                className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                Archive
              </button>
            )}
            {(isPickedUp || task.isCreator) && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isOpen && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={handlePickUp}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Pick Up →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
