"use client"

import { useState } from "react"
import { DesignerItem, DesignerFeedbackItem } from "@/types"

interface Props {
  designer: DesignerItem
  onFeedbackAdd: (data: { sourceName: string; date: string; body: string }) => Promise<DesignerFeedbackItem>
  onFeedbackDelete: (feedbackId: string) => Promise<void>
}

export function FeedbackTab({ designer, onFeedbackAdd, onFeedbackDelete }: Props) {
  const [feedbackList, setFeedbackList] = useState<DesignerFeedbackItem[]>(designer.feedback)
  const [showForm, setShowForm] = useState(false)
  const [sourceName, setSourceName] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceName.trim() || !date || !body.trim()) return
    setSubmitting(true)
    try {
      const fb = await onFeedbackAdd({ sourceName: sourceName.trim(), date, body: body.trim() })
      setFeedbackList((prev) => [fb, ...prev])
      setSourceName("")
      setBody("")
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(feedbackId: string) {
    await onFeedbackDelete(feedbackId)
    setFeedbackList((prev) => prev.filter((f) => f.id !== feedbackId))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Stakeholder Feedback</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + Add Feedback
        </button>
      </div>

      {/* Add feedback form */}
      {showForm && (
        <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="fb-source">
                Source <span className="text-red-500">*</span>
              </label>
              <input
                id="fb-source"
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                required
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. John PM"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="fb-date">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="fb-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="fb-body">
              Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              id="fb-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={3}
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="What did they say…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !sourceName.trim() || !body.trim()}
              className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Add Feedback"}
            </button>
          </div>
        </form>
      )}

      {/* Feedback list */}
      {feedbackList.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground py-4 text-center">No feedback yet.</p>
      )}
      <div className="space-y-3">
        {feedbackList.map((f) => (
          <div key={f.id} className="border rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{f.sourceName}</span>
                <span className="text-xs text-muted-foreground">{f.date}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
                className="text-muted-foreground hover:text-red-600 transition-colors text-xs"
                aria-label="Delete feedback"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
