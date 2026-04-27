"use client"

import { useState, useRef, useEffect } from "react"
import { X, ChevronDown, ChevronRight, Bold, Link2, List } from "lucide-react"
import { ProjectItem } from "@/types"


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

const DETAILS_CONTENT_CLASS = "text-xs text-[#494949] leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-[#1d1d1f] [&_a]:text-blue-600 [&_a]:underline [&_p]:mb-1"

interface Props {
  project: ProjectItem
  onEdit: (project: ProjectItem) => void
  onDelete: (id: string) => void
  onDecisionAdd: (projectId: string, text: string) => void
  onDecisionDelete: (projectId: string, decisionId: string) => void
  onDetailsChange: (projectId: string, details: string) => Promise<boolean>
}

export function ProjectCard({ project, onEdit, onDelete, onDecisionAdd, onDecisionDelete, onDetailsChange }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [decisionText, setDecisionText] = useState("")
  const [editingDetails, setEditingDetails] = useState(false)
  const [linkInputVisible, setLinkInputVisible] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [saveError, setSaveError] = useState(false)
  // Local copy so display updates instantly on save without waiting for async parent update
  const [localDetails, setLocalDetails] = useState<string | null>(project.details)
  const detailsRef = useRef<HTMLDivElement>(null)
  // Tracks innerHTML on every input so we don't rely on reading the DOM ref at save time
  const liveContentRef = useRef<string>(project.details ?? "")
  const linkInputRef = useRef<HTMLInputElement>(null)
  const savedRangeRef = useRef<Range | null>(null)

  const designerNames = project.designers.map((d) => d.designer.name).join(", ")

  // Sync local copy if the project prop updates (e.g., after editing via modal)
  useEffect(() => {
    setLocalDetails(project.details)
  }, [project.details])

  // Populate the contentEditable div when entering edit mode
  useEffect(() => {
    if (editingDetails && detailsRef.current) {
      detailsRef.current.innerHTML = localDetails || ""
      liveContentRef.current = localDetails || ""
      setSaveError(false)
      detailsRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(detailsRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editingDetails])

  function handleLog() {
    const trimmed = decisionText.trim()
    if (!trimmed) return
    onDecisionAdd(project.id, trimmed)
    setDecisionText("")
  }

  function openDetails() {
    setEditingDetails(true)
  }

  async function saveDetails() {
    const content = liveContentRef.current
    const cleaned = content === "<br>" ? "" : content
    setLocalDetails(cleaned || null)
    setEditingDetails(false)
    setLinkInputVisible(false)
    const ok = await onDetailsChange(project.id, cleaned)
    if (!ok) {
      setSaveError(true)
      setLocalDetails(project.details) // revert display if save failed
    }
  }

  function cancelDetails() {
    setEditingDetails(false)
    setLinkInputVisible(false)
  }

  function handleDeleteConfirm() {
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      onDelete(project.id)
    }
  }

  // Toolbar helpers — onMouseDown + preventDefault preserves selection in contentEditable
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
    // Save current selection before focus moves to the URL input
    const sel = window.getSelection()
    savedRangeRef.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
    setLinkUrl("")
    setLinkInputVisible(true)
    setTimeout(() => linkInputRef.current?.focus(), 0)
  }

  function applyLink(e?: React.FormEvent) {
    e?.preventDefault()
    if (linkUrl.trim()) {
      // Restore selection in the contentEditable before applying the link
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

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header — div not button to avoid nesting buttons inside */}
      <div className="p-5">
        <div
          className="flex items-start justify-between gap-3 cursor-pointer select-none"
          onClick={() => setExpanded((e) => !e)}
        >
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
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
            <span className="text-[#6e6e73] ml-1 pointer-events-none">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 border-t border-[#f0f0f5] pt-4 flex gap-6">
            {/* Left column */}
            <div className="flex-1 min-w-0 space-y-4">
            {/* Description */}
            {project.description && (
              <p className="text-[13px] text-[#494949] leading-relaxed">{project.description}</p>
            )}

            {/* 3-col metadata */}
            {(designerNames || project.stakeholders || project.sprintSnapshot) && (
              <div className="grid grid-cols-3 gap-3">
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
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2.5">
                <div className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider mb-0.5">Needs attention</div>
                <div className="text-xs text-[#92400E] leading-relaxed">{project.attention}</div>
              </div>
            )}

            {/* Blockers callout */}
            {project.blockers && (
              <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-lg px-3 py-2.5">
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
                      type="button"
                      onClick={() => onDecisionDelete(project.id, d.id)}
                      className="text-[#6e6e73] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                      aria-label="Delete decision"
                    >
                      <X size={12} />
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
                  type="button"
                  onClick={handleLog}
                  className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-xs hover:bg-blue-700 transition-colors"
                >
                  + Log
                </button>
              </div>
            </div>
            </div>

            {/* Right column — Project Details */}
            <div className="w-72 shrink-0 border-l border-[#f0f0f5] pl-6">
              <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-2">Project Details</div>

              {editingDetails ? (
                <div className="border border-blue-300 rounded-lg overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
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

                  {/* Rich text editable area */}
                  <div
                    ref={detailsRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => { liveContentRef.current = e.currentTarget.innerHTML }}
                    onKeyDown={(e) => { if (e.key === "Escape") saveDetails() }}
                    className={`min-h-[120px] px-3 py-2.5 focus:outline-none resize-none leading-relaxed ${DETAILS_CONTENT_CLASS}`}
                  />

                  <div className="flex items-center justify-between px-2 py-1.5 border-t border-slate-200 bg-slate-50">
                    <div className="text-xs text-red-500">{saveError ? "Save failed — check console" : ""}</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={cancelDetails} className="text-xs text-[#6e6e73] hover:text-[#1d1d1f] px-2 py-1">Cancel</button>
                      <button type="button" onClick={saveDetails} className="text-xs bg-blue-600 text-white font-medium px-3 py-1 rounded-md hover:bg-blue-700">Save</button>
                    </div>
                  </div>
                </div>
              ) : localDetails ? (
                <div
                  onClick={openDetails}
                  className={`cursor-text p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors ${DETAILS_CONTENT_CLASS}`}
                  dangerouslySetInnerHTML={{ __html: localDetails }}
                />
              ) : (
                <button
                  type="button"
                  onClick={openDetails}
                  className="text-xs text-[#6e6e73] hover:text-[#1d1d1f] italic transition-colors"
                >
                  + Add project details
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
