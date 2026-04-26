"use client"

import { useState } from "react"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { DesignerItem, DesignerGoalItem, GoalStatus } from "@/types"

interface Props {
  designer: DesignerItem
  onGoalAdd: (data: {
    title: string
    description?: string
    meetsCriteria?: string
    exceedsCriteria?: string
    timeline: string
  }) => Promise<DesignerGoalItem>
  onGoalStatusChange: (goalId: string, status: GoalStatus) => Promise<void>
  onGoalDelete: (goalId: string) => Promise<void>
}

const STATUS_LABELS: Record<GoalStatus, string> = {
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  COMPLETE: "Complete",
}

const STATUS_COLORS: Record<GoalStatus, string> = {
  ON_TRACK: "bg-green-100 text-green-700",
  AT_RISK: "bg-amber-100 text-amber-700",
  COMPLETE: "bg-slate-100 text-slate-600",
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [GoalStatus, string][]

export function GoalsTab({ designer, onGoalAdd, onGoalStatusChange, onGoalDelete }: Props) {
  const [goals, setGoals] = useState<DesignerGoalItem[]>(designer.goals)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [meetsCriteria, setMeetsCriteria] = useState("")
  const [exceedsCriteria, setExceedsCriteria] = useState("")
  const [timeline, setTimeline] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !timeline.trim()) return
    setSubmitting(true)
    try {
      const goal = await onGoalAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        meetsCriteria: meetsCriteria.trim() || undefined,
        exceedsCriteria: exceedsCriteria.trim() || undefined,
        timeline: timeline.trim(),
      })
      setGoals((prev) => [goal, ...prev])
      setTitle("")
      setDescription("")
      setMeetsCriteria("")
      setExceedsCriteria("")
      setTimeline("")
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(goalId: string, status: GoalStatus) {
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, status } : g))
    await onGoalStatusChange(goalId, status)
  }

  async function handleDelete(goalId: string) {
    await onGoalDelete(goalId)
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Goals</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + Add Goal
        </button>
      </div>

      {/* Add goal form */}
      {showForm && (
        <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="goal-title">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Improve presentation skills"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="goal-description">
              Description
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional context…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="goal-meets">
                Meets Criteria
              </label>
              <input
                id="goal-meets"
                type="text"
                value={meetsCriteria}
                onChange={(e) => setMeetsCriteria(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Meets expectations when…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="goal-exceeds">
                Exceeds Criteria
              </label>
              <input
                id="goal-exceeds"
                type="text"
                value={exceedsCriteria}
                onChange={(e) => setExceedsCriteria(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Exceeds expectations when…"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="goal-timeline">
              Timeline <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-timeline"
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              required
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Q3 2026"
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
              disabled={submitting || !title.trim() || !timeline.trim()}
              className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Add Goal"}
            </button>
          </div>
        </form>
      )}

      {/* Goal list */}
      {goals.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground py-4 text-center">No goals yet.</p>
      )}
      <div className="space-y-2">
        {goals.map((g) => {
          const isExpanded = expanded.has(g.id)
          const hasDetails = g.description || g.meetsCriteria || g.exceedsCriteria
          return (
            <div key={g.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                {hasDetails && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(g.id)}
                    className="text-muted-foreground shrink-0 w-4"
                    aria-label={isExpanded ? "Collapse goal" : "Expand goal"}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                {!hasDetails && <div className="w-4" />}
                <span className="flex-1 text-sm font-medium">{g.title}</span>
                <select
                  value={g.status}
                  onChange={(e) => handleStatusChange(g.id, e.target.value as GoalStatus)}
                  className={`text-xs px-2 py-1 rounded border-0 font-medium focus:outline-none ${STATUS_COLORS[g.status]}`}
                  aria-label="Goal status"
                >
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(g.id)}
                  className="text-muted-foreground hover:text-red-600 transition-colors ml-1"
                  aria-label="Delete goal"
                >
                  <X size={14} />
                </button>
              </div>
              {isExpanded && (
                <div className="px-4 pb-3 pt-0 space-y-2 border-t bg-muted/20 text-sm">
                  {g.description && (
                    <p className="text-muted-foreground">{g.description}</p>
                  )}
                  {g.meetsCriteria && (
                    <p><span className="font-medium text-xs">Meets:</span> {g.meetsCriteria}</p>
                  )}
                  {g.exceedsCriteria && (
                    <p><span className="font-medium text-xs">Exceeds:</span> {g.exceedsCriteria}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Timeline: {g.timeline}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
