"use client"

import { useState } from "react"
import { ProjectItem } from "@/types"

const STATUS_BORDER: Record<string, string> = {
  ON_TRACK: "border-l-[#1D7A1D]",
  AT_RISK:  "border-l-[#B45309]",
  BLOCKED:  "border-l-[#D70015]",
  COMPLETE: "border-l-[#6E6E73]",
}

const STATUS_BADGE_BG: Record<string, string> = {
  ON_TRACK: "bg-[#E3F3E3] text-[#1D7A1D]",
  AT_RISK:  "bg-[#FFF8E1] text-[#B45309]",
  BLOCKED:  "bg-[#FFEAEA] text-[#D70015]",
  COMPLETE: "bg-[#F5F5F7] text-[#6E6E73]",
}

const PHASE_COLOR: Record<string, string> = {
  DISCOVERY:      "text-[#7C3AED]",
  DESIGN:         "text-[#0071E3]",
  DEV_HANDOFF:    "text-[#B45309]",
  IN_DEVELOPMENT: "text-[#1D7A1D]",
  LIVE:           "text-[#059669]",
  ON_HOLD:        "text-[#6E6E73]",
}

const PHASE_LABEL: Record<string, string> = {
  DISCOVERY:      "Discovery",
  DESIGN:         "Design",
  DEV_HANDOFF:    "Dev Handoff",
  IN_DEVELOPMENT: "In Development",
  LIVE:           "Live",
  ON_HOLD:        "On Hold",
}

const STATUS_LABEL: Record<string, string> = {
  ON_TRACK: "On track",
  AT_RISK:  "At risk",
  BLOCKED:  "Blocked",
  COMPLETE: "Complete",
}

interface Props {
  project: ProjectItem
  onEdit: (project: ProjectItem) => void
  onDelete: (id: string) => void
  onDecisionAdd: (projectId: string, text: string) => void
  onDecisionDelete: (projectId: string, decisionId: string) => void
}

export function ProjectCard({ project, onEdit, onDelete, onDecisionAdd, onDecisionDelete }: Props) {
  const [decisionText, setDecisionText] = useState("")

  const designerNames = project.designers.map((d) => d.designer.name).join(", ")

  function handleLog() {
    const trimmed = decisionText.trim()
    if (!trimmed) return
    onDecisionAdd(project.id, trimmed)
    setDecisionText("")
  }

  function handleDeleteConfirm() {
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      onDelete(project.id)
    }
  }

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${STATUS_BORDER[project.status] ?? "border-l-slate-300"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-[#1d1d1f] mb-1.5">{project.name}</div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_BG[project.status]}`}>
              {STATUS_LABEL[project.status]}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f0f0f5] ${PHASE_COLOR[project.phase]}`}>
              {PHASE_LABEL[project.phase]}
            </span>
            {project.dueDate && (
              <span className="text-[11px] text-[#6e6e73]">
                Due {new Date(project.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(project)}
            className="border border-[#d2d2d7] rounded-md px-2 py-1 text-xs text-[#6e6e73] hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="border border-[#d2d2d7] rounded-md px-2 py-1 text-xs text-[#d70015] hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-[13px] text-[#494949] leading-relaxed mb-3">{project.description}</p>
      )}

      {/* 3-col metadata */}
      {(designerNames || project.stakeholders || project.sprintSnapshot) && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {designerNames && (
            <div>
              <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1">Designers</div>
              <div className="text-xs text-[#494949]">{designerNames}</div>
            </div>
          )}
          {project.stakeholders && (
            <div>
              <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1">Stakeholders</div>
              <div className="text-xs text-[#494949]">{project.stakeholders}</div>
            </div>
          )}
          {project.sprintSnapshot && (
            <div>
              <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1">Sprint snapshot</div>
              <div className="text-xs text-[#494949]">{project.sprintSnapshot}</div>
            </div>
          )}
        </div>
      )}

      {/* Attention callout */}
      {project.attention && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2.5 mb-3">
          <div className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider mb-0.5">Needs attention</div>
          <div className="text-xs text-[#92400E] leading-relaxed">{project.attention}</div>
        </div>
      )}

      {/* Blockers callout */}
      {project.blockers && (
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-lg px-3 py-2.5 mb-3">
          <div className="text-[10px] font-bold text-[#D70015] uppercase tracking-wider mb-0.5">Blocked</div>
          <div className="text-xs text-[#991B1B] leading-relaxed">{project.blockers}</div>
        </div>
      )}

      {/* Decision log */}
      <div>
        {project.decisions.length > 0 && (
          <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1.5">
            Decision log ({project.decisions.length})
          </div>
        )}
        {project.decisions.map((d) => (
          <div key={d.id} className="flex items-start gap-2 py-1.5 border-t border-[#e5e5ea] group">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] flex-shrink-0 mt-1.5" />
            <div className="flex-1 text-xs text-[#494949] leading-relaxed">{d.text}</div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-[#6e6e73]">
                {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <button
                onClick={() => onDecisionDelete(project.id, d.id)}
                className="text-[10px] text-[#6e6e73] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                aria-label="Delete decision"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-1.5 mt-2">
          <input
            placeholder="Log a decision…"
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLog()}
            className="flex-1 text-xs px-2.5 py-1.5 border border-[#d2d2d7] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={handleLog}
            className="bg-[#0071e3] text-white border-none rounded-md px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-600 transition-colors"
          >
            + Log
          </button>
        </div>
      </div>
    </div>
  )
}
