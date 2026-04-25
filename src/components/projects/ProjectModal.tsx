"use client"

import { useState, useEffect } from "react"
import { ProjectItem, ProjectPhase, ProjectStatus } from "@/types"

export interface ProjectFormData {
  name: string
  phase: ProjectPhase
  status: ProjectStatus
  description: string
  dueDate: string
  sprintSnapshot: string
  stakeholders: string
  attention: string
  blockers: string
  designerIds: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProjectFormData) => void
  project?: ProjectItem
  allDesigners: { id: string; name: string }[]
}

const PHASES: { value: ProjectPhase; label: string }[] = [
  { value: "DISCOVERY", label: "Discovery" },
  { value: "DESIGN", label: "Design" },
  { value: "DEV_HANDOFF", label: "Dev Handoff" },
  { value: "IN_DEVELOPMENT", label: "In Development" },
  { value: "LIVE", label: "Live" },
  { value: "ON_HOLD", label: "On Hold" },
]

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "ON_TRACK", label: "On Track" },
  { value: "AT_RISK", label: "At Risk" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETE", label: "Complete" },
]

function emptyForm(): ProjectFormData {
  return {
    name: "", phase: "DISCOVERY", status: "ON_TRACK",
    description: "", dueDate: "", sprintSnapshot: "",
    stakeholders: "", attention: "", blockers: "", designerIds: [],
  }
}

function projectToForm(p: ProjectItem): ProjectFormData {
  return {
    name: p.name,
    phase: p.phase,
    status: p.status,
    description: p.description ?? "",
    dueDate: p.dueDate ?? "",
    sprintSnapshot: p.sprintSnapshot ?? "",
    stakeholders: p.stakeholders ?? "",
    attention: p.attention ?? "",
    blockers: p.blockers ?? "",
    designerIds: p.designers.map((d) => d.designerId),
  }
}

export function ProjectModal({ isOpen, onClose, onSave, project, allDesigners }: Props) {
  const [form, setForm] = useState<ProjectFormData>(emptyForm)

  useEffect(() => {
    if (isOpen) {
      setForm(project ? projectToForm(project) : emptyForm())
    }
  }, [isOpen, project])

  if (!isOpen) return null

  function set<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleDesigner(id: string) {
    setForm((prev) => ({
      ...prev,
      designerIds: prev.designerIds.includes(id)
        ? prev.designerIds.filter((d) => d !== id)
        : [...prev.designerIds, id],
    }))
  }

  function handleSave() {
    if (!form.name.trim()) return
    onSave(form)
  }

  const inputClass = "w-full text-sm px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
  const labelClass = "block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-[#1d1d1f] mb-5">
          {project ? "Edit Project" : "Add Project"}
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              placeholder="Project name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Phase + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phase</label>
              <select value={form.phase} onChange={(e) => set("phase", e.target.value as ProjectPhase)} className={inputClass}>
                {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value as ProjectStatus)} className={inputClass}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Due date + Sprint snapshot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sprint snapshot</label>
              <input
                placeholder="e.g. 8 tickets, 3 in review"
                value={form.sprintSnapshot}
                onChange={(e) => set("sprintSnapshot", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Stakeholders */}
          <div>
            <label className={labelClass}>Stakeholders</label>
            <input
              placeholder="e.g. Sarah PM, Dev lead"
              value={form.stakeholders}
              onChange={(e) => set("stakeholders", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Designers */}
          {allDesigners.length > 0 && (
            <div>
              <label className={labelClass}>Designers</label>
              <div className="border border-[#d2d2d7] rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                {allDesigners.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={form.designerIds.includes(d.id)}
                      onChange={() => toggleDesigner(d.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-[#1d1d1f]">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Attention */}
          <div>
            <label className={labelClass}>Needs attention (optional)</label>
            <textarea
              rows={2}
              placeholder="Leave empty to hide this callout"
              value={form.attention}
              onChange={(e) => set("attention", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Blockers */}
          <div>
            <label className={labelClass}>Blockers (optional)</label>
            <textarea
              rows={2}
              placeholder="Leave empty to hide this callout"
              value={form.blockers}
              onChange={(e) => set("blockers", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6e6e73] border border-[#d2d2d7] rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm text-white bg-[#0071e3] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
