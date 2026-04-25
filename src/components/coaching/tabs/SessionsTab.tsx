"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { DesignerItem, DesignerSessionItem, SessionFlag } from "@/types"
import { DREYFUS_DESCRIPTIONS } from "@/components/coaching/lib/coaching-framework"
import { SplitButton } from "@/components/claude/SplitButton"

interface Props {
  designer: DesignerItem
  onSessionAdd: (data: { date: string; notes: string; flag?: SessionFlag }) => Promise<DesignerSessionItem>
  onSessionDelete: (sessionId: string) => Promise<void>
  onOpenClaude: (prompt: string, label: string) => void
}

const FLAG_LABELS: Record<SessionFlag, string> = {
  POSITIVE: "Positive",
  DEVELOPMENT: "Development",
  COACHING: "Coaching",
  FOLLOWUP: "Follow-up",
}

const FLAG_COLORS: Record<SessionFlag, string> = {
  POSITIVE: "bg-green-100 text-green-700",
  DEVELOPMENT: "bg-amber-100 text-amber-700",
  COACHING: "bg-blue-100 text-blue-700",
  FOLLOWUP: "bg-orange-100 text-orange-700",
}

const FLAG_OPTIONS = Object.entries(FLAG_LABELS) as [SessionFlag, string][]

export function SessionsTab({ designer, onSessionAdd, onSessionDelete, onOpenClaude }: Props) {
  const [sessions, setSessions] = useState<DesignerSessionItem[]>(designer.sessions)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [flag, setFlag] = useState<SessionFlag>("COACHING")
  const [submitting, setSubmitting] = useState(false)
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !notes.trim()) return
    setSubmitting(true)
    try {
      const newSession = await onSessionAdd({ date, notes: notes.trim(), flag })
      setSessions((prev) => [newSession, ...prev])
      setNotes("")
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(sessionId: string) {
    await onSessionDelete(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  function buildPrompt(): string {
    const stageDesc = designer.dreyfusStage
      ? DREYFUS_DESCRIPTIONS[designer.dreyfusStage]
      : "No stage set"

    const recent = sessions.slice(0, 5)
    const sessionText = recent.length
      ? recent.map((s) => `${s.date} [${s.flag ?? "no flag"}]: ${s.notes}`).join("\n")
      : "No sessions recorded yet."

    return `Designer: ${designer.name}, ${designer.role} (${designer.roleLevel})
Dreyfus Stage: ${designer.dreyfusStage ?? "Not set"} — ${stageDesc}

Recent Sessions:
${sessionText}

Please summarize the key patterns, themes, and growth areas across these recent 1:1 sessions for ${designer.name}. Frame your analysis for a ${designer.dreyfusStage ?? "designer"} on the Dreyfus scale.`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sessions</h3>
        <div className="flex gap-2">
          <SplitButton
            label="Ask Claude: Summary"
            onAsk={() => onOpenClaude(buildPrompt(), `Session Summary — ${designer.name}`)}
            onCopy={() => navigator.clipboard.writeText(buildPrompt()).catch(() => {})}
          />
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            + Add Session
          </button>
        </div>
      </div>

      {/* Add session form */}
      {showForm && (
        <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" htmlFor="session-date">Date</label>
              <input
                id="session-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" htmlFor="session-flag">Flag</label>
              <select
                id="session-flag"
                value={flag}
                onChange={(e) => setFlag(e.target.value as SessionFlag)}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FLAG_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="session-notes">Notes</label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              rows={3}
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="What was discussed…"
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
              disabled={submitting || !notes.trim()}
              className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Add Session"}
            </button>
          </div>
        </form>
      )}

      {/* Session list */}
      {sessions.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground py-4 text-center">No sessions yet. Add your first one.</p>
      )}
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="border rounded-lg px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">{s.date}</span>
                {s.flag && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${FLAG_COLORS[s.flag]}`}>
                    {FLAG_LABELS[s.flag]}
                  </span>
                )}
              </div>
              <p className="text-sm line-clamp-2">{s.notes}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(s.id)}
              className="text-muted-foreground hover:text-red-600 transition-colors shrink-0"
              aria-label="Delete session"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
