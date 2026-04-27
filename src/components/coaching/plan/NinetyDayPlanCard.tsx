"use client"

import { useState } from "react"
import { MoreHorizontal, Sparkles, ChevronDown, ChevronRight } from "lucide-react"
import { NinetyDayPlan } from "@/types"

interface Props {
  plan: NinetyDayPlan
  onSectionEdit: (field: keyof Pick<NinetyDayPlan, "quarterFocus" | "developmentPriorities" | "coachingApproach" | "keyMilestones">, value: string) => Promise<void>
  onRevise: () => void
  onDelete: () => void
}

const SECTIONS: {
  key: keyof Pick<NinetyDayPlan, "quarterFocus" | "developmentPriorities" | "coachingApproach" | "keyMilestones">
  label: string
}[] = [
  { key: "quarterFocus", label: "Quarter Focus" },
  { key: "developmentPriorities", label: "Development Priorities" },
  { key: "coachingApproach", label: "Coaching Approach" },
  { key: "keyMilestones", label: "Key Milestones" },
]

export function NinetyDayPlanCard({ plan, onSectionEdit, onRevise, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function startEdit(key: string, current: string) {
    setEditing(key)
    setDrafts((prev) => ({ ...prev, [key]: current }))
  }

  async function commitEdit(key: keyof Pick<NinetyDayPlan, "quarterFocus" | "developmentPriorities" | "coachingApproach" | "keyMilestones">) {
    const value = drafts[key] ?? ""
    setEditing(null)
    await onSectionEdit(key, value)
  }

  return (
    <div className="border rounded-xl overflow-hidden mb-4 bg-white shadow-sm">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 bg-violet-50 ${collapsed ? "" : "border-b border-violet-100"}`}>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-violet-400 shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-violet-400 shrink-0" />
          )}
          <Sparkles size={14} className="text-violet-600 shrink-0" />
          <span className="text-sm font-semibold text-violet-900">
            {plan.quarter} · {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onRevise}
            className="text-xs px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors flex items-center gap-1"
          >
            <Sparkles size={11} />
            Revise
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              aria-label="Plan options"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 bg-white border rounded-lg shadow-lg py-1 z-10 w-36">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete plan
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <p className="text-xs text-slate-600 mb-2">Delete this plan?</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setShowMenu(false); setConfirmDelete(false); onDelete() }}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs px-2 py-1 border rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      {!collapsed && <div className="divide-y">
        {SECTIONS.map(({ key, label }) => (
          <div key={key} className="px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>
            {editing === key ? (
              <textarea
                autoFocus
                value={drafts[key] ?? ""}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => commitEdit(key)}
                rows={3}
                className="w-full text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
            ) : (
              <p
                onClick={() => startEdit(key, plan[key])}
                className="text-sm text-slate-700 cursor-text hover:bg-slate-50 rounded px-1 -mx-1 py-0.5 transition-colors"
              >
                {plan[key] || <span className="text-muted-foreground italic">Click to edit…</span>}
              </p>
            )}
          </div>
        ))}
      </div>}
    </div>
  )
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
