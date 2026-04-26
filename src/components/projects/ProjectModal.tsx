"use client"

import { useState, useEffect, useRef } from "react"
import { X, Bold, List, Link2 } from "lucide-react"
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
  details: string
  designerIds: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProjectFormData) => void
  project?: ProjectItem
  allDesigners: { id: string; name: string }[]
  saveError?: string | null
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
    stakeholders: "", attention: "", blockers: "", details: "", designerIds: [],
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
    details: p.details ?? "",
    designerIds: p.designers.map((d) => d.designerId),
  }
}

export function ProjectModal({ isOpen, onClose, onSave, project, allDesigners, saveError }: Props) {
  const [form, setForm] = useState<ProjectFormData>(emptyForm)
  const [linkInputVisible, setLinkInputVisible] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const detailsRef = useRef<HTMLDivElement>(null)
  const liveContentRef = useRef<string>("")
  const savedRangeRef = useRef<Range | null>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const data = project ? projectToForm(project) : emptyForm()
      setForm(data)
      setLinkInputVisible(false)
      setLinkUrl("")
      // Seed contentEditable after the modal renders
      setTimeout(() => {
        if (detailsRef.current) {
          detailsRef.current.innerHTML = data.details || ""
          liveContentRef.current = data.details || ""
        }
      }, 0)
    }
  }, [isOpen, project])

  if (!isOpen) return null

  function set<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyBold(e: React.MouseEvent) {
    e.preventDefault()
    detailsRef.current?.focus()
    document.execCommand("bold", false)
  }

  function applyBullet(e: React.MouseEvent) {
    e.preventDefault()
    detailsRef.current?.focus()
    document.execCommand("insertUnorderedList", false)
  }

  function showLinkInput(e: React.MouseEvent) {
    e.preventDefault()
    const sel = window.getSelection()
    savedRangeRef.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
    setLinkUrl("")
    setLinkInputVisible(true)
    setTimeout(() => linkInputRef.current?.focus(), 0)
  }

  function applyLink(e?: React.FormEvent) {
    e?.preventDefault()
    if (linkUrl.trim()) {
      detailsRef.current?.focus()
      if (savedRangeRef.current) {
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(savedRangeRef.current)
      }
      document.execCommand("createLink", false, linkUrl.trim())
      savedRangeRef.current = null
    }
    setLinkInputVisible(false)
    setLinkUrl("")
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
    const details = liveContentRef.current
    const cleanedDetails = details === "<br>" ? "" : details
    onSave({ ...form, details: cleanedDetails })
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
              <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] px-2 py-1.5 border border-[#d2d2d7] rounded-lg">
                {form.designerIds.map((id) => {
                  const d = allDesigners.find((d) => d.id === id)
                  if (!d) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2.5 py-1">
                      {d.name}
                      <button
                        type="button"
                        onClick={() => toggleDesigner(id)}
                        className="hover:text-blue-900"
                        aria-label={`Remove ${d.name}`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )
                })}
                {allDesigners.filter((d) => !form.designerIds.includes(d.id)).length > 0 && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) toggleDesigner(e.target.value) }}
                    className="text-xs text-[#0071E3] bg-transparent border-none outline-none cursor-pointer"
                  >
                    <option value="">+ Add designer</option>
                    {allDesigners
                      .filter((d) => !form.designerIds.includes(d.id))
                      .map((d) => <option key={d.id} value={d.id}>{d.name}</option>)
                    }
                  </select>
                )}
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

          {/* Details */}
          <div>
            <label className={labelClass}>Project details</label>
            <div className="border border-[#d2d2d7] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400">
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#e5e5ea] bg-[#f9f9f9]">
                <button
                  type="button"
                  onMouseDown={applyBold}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Bold"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={applyBullet}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Bullet list"
                >
                  <List size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={showLinkInput}
                  className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${linkInputVisible ? "bg-slate-200 text-blue-600" : "text-slate-600"}`}
                  title="Insert link"
                >
                  <Link2 size={13} />
                </button>
                {linkInputVisible && (
                  <form onSubmit={applyLink} className="flex items-center gap-1 ml-1">
                    <input
                      ref={linkInputRef}
                      type="url"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && setLinkInputVisible(false)}
                      className="text-xs px-2 py-0.5 border border-slate-300 rounded w-40 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button type="submit" className="text-xs text-blue-600 font-medium px-1.5 py-0.5 hover:bg-blue-50 rounded">Apply</button>
                  </form>
                )}
              </div>
              {/* Editable area */}
              <div
                ref={detailsRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => { liveContentRef.current = e.currentTarget.innerHTML }}
                data-placeholder="Add context, links, goals..."
                className="min-h-[120px] text-sm px-3 py-2.5 focus:outline-none leading-relaxed text-[#1d1d1f] [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold [&_a]:text-blue-600 [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-[#6e6e73]"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {saveError && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6e6e73] border border-[#d2d2d7] rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
