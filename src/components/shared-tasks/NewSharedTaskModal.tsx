"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import type { SharedTaskItem } from "@/types"

interface Props {
  onClose: () => void
  onCreated: (task: SharedTaskItem) => void
}

export function NewSharedTaskModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [emailError, setEmailError] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function addEmail() {
    const trimmed = emailInput.trim()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address")
      return
    }
    if (emails.includes(trimmed)) {
      setEmailError("Already added")
      return
    }
    setEmails(prev => [...prev, trimmed])
    setEmailInput("")
    setEmailError("")
  }

  function removeEmail(email: string) {
    setEmails(prev => prev.filter(e => e !== email))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/shared-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, shareEmails: emails }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong")
        return
      }
      const task = await res.json()
      onCreated(task)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">New Shared Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Share with
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setEmailError("") }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEmail() } }}
                placeholder="Add email address…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={addEmail}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            {emailError && <p className="text-xs text-red-500 mb-2">{emailError}</p>}
            {emails.length > 0 && (
              <div className="flex flex-col gap-1">
                {emails.map(email => (
                  <div key={email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
