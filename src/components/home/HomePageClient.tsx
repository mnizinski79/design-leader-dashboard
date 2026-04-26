"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, User, ChevronRight, ClipboardList, Pencil, Plus } from "lucide-react"
import type { TodoItem, ConversationItem, DailyFocusItem } from "@/types"
import type { HomeDesigner, HomeProject } from "@/app/(dashboard)/home/page"

interface Props {
  firstName: string
  todos: TodoItem[]
  projects: HomeProject[]
  conversations: ConversationItem[]
  designers: HomeDesigner[]
  initialFocus: DailyFocusItem | null
  todayStr: string
}

const PHASE_LABEL: Record<string, string> = {
  DISCOVERY: "Discovery",
  DESIGN: "Design",
  DEV_HANDOFF: "Dev Handoff",
  IN_DEVELOPMENT: "In Development",
  LIVE: "Live",
  ON_HOLD: "On Hold",
}

const STATUS_LABEL: Record<string, string> = {
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
}

function getGreeting(firstName: string) {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${firstName}`
  if (hour < 17) return `Good afternoon, ${firstName}`
  return `Good evening, ${firstName}`
}

function getInitials(name: string) {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function isMonday() {
  return new Date().getDay() === 1
}

export function HomePageClient({
  firstName,
  todos,
  projects,
  conversations,
  designers,
  initialFocus,
  todayStr,
}: Props) {
  const router = useRouter()
  const [focus, setFocus] = useState<DailyFocusItem | null>(initialFocus)
  const [editingFocus, setEditingFocus] = useState(false)
  const [focusDraft, setFocusDraft] = useState("")
  const [savingFocus, setSavingFocus] = useState(false)

  // ── Conversation state ────────────────────────────────────────────────────
  const [convos, setConvos] = useState<ConversationItem[]>(conversations)
  const [expandedConvos, setExpandedConvos] = useState<Set<string>>(new Set())

  function toggleConvo(id: string) {
    setExpandedConvos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const [addingConvo, setAddingConvo] = useState(false)
  const [convoTopic, setConvoTopic] = useState("")
  const [convoPerson, setConvoPerson] = useState("")
  const [convoDescription, setConvoDescription] = useState("")
  const [savingConvo, setSavingConvo] = useState(false)

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const focusIsToday = focus?.date === todayStr

  // ── Computed signals ──────────────────────────────────────────────────────
  const openTodos = todos.filter((t) => t.status !== "COMPLETE")
  const urgentCount = openTodos.filter((t) => t.urgent).length
  const overdueCount = openTodos.filter((t) => t.dueDate && t.dueDate < todayStr).length
  const overdueOneOnOneCount = designers.filter(
    (d) => d.nextOneOnOne && d.nextOneOnOne < todayStr
  ).length
  const pendingConvoCount = convos.length

  // Top 3 priorities: urgent first, then in-progress, then by sortOrder
  const top3 = [...openTodos]
    .sort((a, b) => {
      const aScore = (a.urgent ? 10 : 0) + (a.status === "INPROGRESS" ? 5 : 0) - a.sortOrder * 0.01
      const bScore = (b.urgent ? 10 : 0) + (b.status === "INPROGRESS" ? 5 : 0) - b.sortOrder * 0.01
      return bScore - aScore
    })
    .slice(0, 3)

  // Open tasks list (up to 6, by sortOrder)
  const openTasksList = [...openTodos].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6)

  // ── Briefing chips ────────────────────────────────────────────────────────
  const chips: { label: string; cls: string }[] = []
  if (urgentCount) chips.push({ label: `${urgentCount} urgent task${urgentCount > 1 ? "s" : ""}`, cls: "alert" })
  if (overdueCount) chips.push({ label: `${overdueCount} overdue`, cls: "alert" })
  if (projects.length) chips.push({ label: `${projects.length} project${projects.length > 1 ? "s" : ""} need${projects.length === 1 ? "s" : ""} attention`, cls: "warn" })
  if (overdueOneOnOneCount) chips.push({ label: `${overdueOneOnOneCount} overdue 1:1${overdueOneOnOneCount > 1 ? "s" : ""}`, cls: "warn" })
  if (pendingConvoCount) chips.push({ label: `${pendingConvoCount} conversation${pendingConvoCount > 1 ? "s" : ""} to have`, cls: "neutral" })
  if (!chips.length) chips.push({ label: "All clear — great start", cls: "good" })

  // ── Daily focus handlers ──────────────────────────────────────────────────
  function openFocusEdit() {
    setFocusDraft(focusIsToday ? (focus?.text ?? "") : "")
    setEditingFocus(true)
  }

  async function saveFocus() {
    const trimmed = focusDraft.trim()
    if (!trimmed) return
    setSavingFocus(true)
    try {
      const res = await fetch("/api/daily-focus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      })
      if (res.ok) {
        const data = await res.json()
        setFocus({ id: data.id, userId: data.userId, date: data.date, text: data.text })
        setEditingFocus(false)
        router.refresh()
      }
    } finally {
      setSavingFocus(false)
    }
  }

  // ── Conversation handlers ─────────────────────────────────────────────────
  async function handleAddConvo() {
    const topic = convoTopic.trim()
    const person = convoPerson.trim()
    if (!topic || !person) return
    setSavingConvo(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, person, description: convoDescription.trim() || null }),
      })
      if (res.ok) {
        const created: ConversationItem = await res.json()
        setConvos((prev) => [created, ...prev])
        setConvoTopic("")
        setConvoPerson("")
        setConvoDescription("")
        setAddingConvo(false)
        router.refresh()
      }
    } finally {
      setSavingConvo(false)
    }
  }

  async function handleMarkDone(id: string) {
    const res = await fetch(`/api/conversations/${id}`, { method: "PATCH" })
    if (res.ok) {
      setConvos((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    }
  }

  // ── Chip style helper ─────────────────────────────────────────────────────
  function chipStyle(cls: string) {
    if (cls === "alert") return "bg-[#FFEAEA] text-[#D70015]"
    if (cls === "warn") return "bg-[#FFF8E1] text-[#B45309]"
    if (cls === "neutral") return "bg-[#E0F2FE] text-[#0071E3]"
    if (cls === "good") return "bg-[#E3F3E3] text-[#1D7A1D]"
    return ""
  }

  // ── Todo status tag ───────────────────────────────────────────────────────
  function statusTag(t: TodoItem) {
    if (t.status === "INPROGRESS") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0071E3]">In progress</span>
    if (t.status === "AWAITING") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#B45309]">Awaiting</span>
    if (t.urgent) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFEAEA] text-[#D70015]">Urgent</span>
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[#6e6e73]">To do</span>
  }

  const cardClass = "bg-white rounded-xl p-5 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
  const sectionLabel = "text-[10px] font-bold text-[#6e6e73] uppercase tracking-[0.07em] mb-2.5"
  const cardTitle = "text-sm font-bold text-[#1d1d1f]"
  const linkBtn = "text-[11px] font-medium text-[#0071E3] hover:underline"

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[28px] font-bold text-[#1d1d1f] leading-tight tracking-[-0.02em]">
            {getGreeting(firstName)}
          </h1>
          <p className="text-sm text-[#6e6e73] mt-1">{today}</p>
        </div>
      </div>

      {/* ── Briefing bar ── */}
      <div
        className="rounded-xl p-5 mb-5 border"
        style={{
          background: "linear-gradient(135deg, #E8F4FD 0%, #EDE8FB 50%, #FDE8F4 100%)",
          borderColor: "rgba(0,113,227,0.12)",
          boxShadow: "0 2px 16px rgba(0,113,227,0.08)",
        }}
      >
        <p className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-[0.07em] mb-1">
          Today's focus
        </p>

        {!editingFocus ? (
          <>
            {focusIsToday && focus?.text ? (
              <p className="text-[15px] font-medium text-[#1d1d1f] mb-3 italic">
                &ldquo;{focus.text}&rdquo;
              </p>
            ) : (
              <p className="text-[15px] text-[#6e6e73] mb-3">
                What's the one thing that matters most today?
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c, i) => (
                  <span key={i} className={`text-[11px] font-semibold px-3 py-1 rounded-full ${chipStyle(c.cls)}`}>
                    {c.label}
                  </span>
                ))}
              </div>
              <button
                onClick={openFocusEdit}
                className="ml-auto text-[11px] font-medium px-3 py-1 rounded-full border text-[#0071E3] bg-white/60 hover:bg-white/90 transition-colors whitespace-nowrap"
                style={{ borderColor: "rgba(0,113,227,0.3)" }}
              >
                {focusIsToday && focus?.text
                ? <span className="flex items-center gap-1"><Pencil size={11} /> Update focus</span>
                : <span className="flex items-center gap-1"><Plus size={11} /> Set focus</span>}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-1">
            <textarea
              autoFocus
              rows={2}
              value={focusDraft}
              onChange={(e) => setFocusDraft(e.target.value)}
              placeholder="e.g. Unblock the team and prep the quarterly review"
              className="w-full text-sm px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white/80 resize-none mb-2"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingFocus(false)}
                className="text-sm px-3 py-1.5 rounded-lg border border-[#d2d2d7] text-[#6e6e73] hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                onClick={saveFocus}
                disabled={savingFocus || !focusDraft.trim()}
                className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingFocus ? "Saving…" : "Set focus"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT column */}
        <div>

          {/* Top priorities */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <span className={cardTitle}>Top priorities</span>
              <Link href="/todos" className={linkBtn}>All tasks <ChevronRight size={12} className="inline" /></Link>
            </div>

            {isMonday() && (
              <div
                className="flex items-start gap-3 rounded-lg p-3 mb-2"
                style={{ background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)" }}
              >
                <ClipboardList size={18} className="flex-shrink-0 text-[#3730A3]" />
                <div>
                  <p className="text-[13px] font-medium text-[#3730A3] leading-snug">
                    Review weekly demo — what should the team present today?
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0071E3]">
                    Demo review
                  </span>
                </div>
              </div>
            )}

            {top3.length === 0 && !isMonday() ? (
              <div className="py-4 text-[12px] text-[#6e6e73] flex items-center justify-center gap-1"><Check size={12} /> Nothing open — nice work</div>
            ) : (
              top3.map((t, i) => (
                <div key={t.id} className="flex items-start gap-3 py-2 border-b border-[#f0f0f5] last:border-0">
                  <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#f0f0f5] text-[10px] font-bold text-[#6e6e73] flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1d1d1f] leading-snug">{t.title}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {statusTag(t)}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0071E3]">
                        {t.category}
                      </span>
                      {t.dueDate && t.dueDate < todayStr && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFEAEA] text-[#D70015]">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Projects needing attention */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <span className={cardTitle}>Projects needing attention</span>
              <Link href="/projects" className={linkBtn}>All <ChevronRight size={12} className="inline" /></Link>
            </div>

            {projects.length === 0 ? (
              <div className="py-3 text-[12px] text-[#6e6e73] flex items-center justify-center gap-1"><Check size={12} /> All projects on track</div>
            ) : (
              projects.map((p) => {
                const dotColor =
                  p.status === "BLOCKED" ? "#D70015" :
                  p.status === "AT_RISK" ? "#B45309" : "#D97706"
                const statusColor =
                  p.status === "BLOCKED" ? "#D70015" :
                  p.status === "AT_RISK" ? "#B45309" : "#D97706"
                return (
                  <div key={p.id} className="flex items-start gap-3 py-2.5 border-b border-[#f0f0f5] last:border-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: dotColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1d1d1f]">{p.name}</p>
                      <p className="text-[11px] text-[#6e6e73] mt-0.5">
                        {PHASE_LABEL[p.phase] ?? p.phase}{" · "}
                        <span style={{ color: statusColor }}>
                          {p.status === "ON_TRACK" && (p.attention || p.blockers) ? "Needs attention" : STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </p>
                      {(p.blockers || p.attention) && (
                        <p className="text-[11px] text-[#6e6e73] mt-1 leading-snug">
                          {p.blockers || p.attention}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Conversations to have */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <span className={cardTitle}>Conversations to have</span>
              <button
                onClick={() => setAddingConvo(true)}
                className={linkBtn}
              >
                + Add
              </button>
            </div>

            {/* Add conversation inline form */}
            {addingConvo && (
              <div className="bg-[#f5f5f7] rounded-lg p-3 mb-3 space-y-2">
                <input
                  autoFocus
                  placeholder="Topic *"
                  value={convoTopic}
                  onChange={(e) => setConvoTopic(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
                <input
                  placeholder="Person *"
                  value={convoPerson}
                  onChange={(e) => setConvoPerson(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={convoDescription}
                  onChange={(e) => setConvoDescription(e.target.value)}
                  rows={2}
                  className="w-full text-sm px-3 py-1.5 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setAddingConvo(false); setConvoTopic(""); setConvoPerson(""); setConvoDescription("") }}
                    className="text-xs px-3 py-1.5 border border-[#d2d2d7] rounded-lg text-[#6e6e73] hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddConvo}
                    disabled={savingConvo || !convoTopic.trim() || !convoPerson.trim()}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingConvo ? "Saving…" : "Add"}
                  </button>
                </div>
              </div>
            )}

            {convos.length === 0 ? (
              <div className="py-3 text-center text-[12px] text-[#6e6e73]">No conversations queued</div>
            ) : (
              <>
                {convos.slice(0, 4).map((c) => {
                  const expanded = expandedConvos.has(c.id)
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 py-2.5 border-b border-[#f0f0f5] last:border-0"
                    >
                      <button
                        onClick={() => handleMarkDone(c.id)}
                        className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-2 border-[#0071E3] hover:bg-[#0071E3] group transition-colors"
                        title="Mark as done"
                      >
                        <Check size={10} className="hidden group-hover:block text-white" />
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => c.description && toggleConvo(c.id)}
                      >
                        <p className="text-[13px] font-semibold text-[#1d1d1f]">{c.topic}</p>
                        {c.description && (
                          <p className={`text-[11px] text-[#6e6e73] mt-0.5 leading-snug ${expanded ? "" : "truncate"}`}>
                            {c.description}
                          </p>
                        )}
                        {c.person && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium bg-[#E0F2FE] text-[#0071E3] px-2 py-0.5 rounded-full">
                            <User size={11} /> {c.person}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {convos.length > 4 && (
                  <p className="text-[11px] text-[#6e6e73] text-center pt-2">
                    +{convos.length - 4} more
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT column */}
        <div>

          {/* Team pulse */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <span className={cardTitle}>Team pulse</span>
              <Link href="/coaching" className={linkBtn}>1:1s <ChevronRight size={12} className="inline" /></Link>
            </div>

            {designers.length === 0 ? (
              <div className="py-3 text-center text-[12px] text-[#6e6e73]">No designers added yet</div>
            ) : (
              designers.map((d) => {
                const isOverdue = d.nextOneOnOne && d.nextOneOnOne < todayStr
                const dotColor = isOverdue ? "#D70015" : d.openTopics > 0 ? "#B45309" : "#1D7A1D"
                return (
                  <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-[#f0f0f5] last:border-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white bg-[#5E5CE6]"
                    >
                      {getInitials(d.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1d1d1f]">{d.name}</p>
                      <p className="text-[11px] text-[#6e6e73] mt-0.5">
                        {isOverdue ? (
                          <span className="text-[#D70015]">1:1 overdue</span>
                        ) : d.nextOneOnOne ? (
                          `Next: ${d.nextOneOnOne}`
                        ) : (
                          "No 1:1 set"
                        )}
                        {d.openTopics > 0 && (
                          <span className="text-[#B45309]">
                            {" · "}{d.openTopics} topic{d.openTopics > 1 ? "s" : ""} to discuss
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      href="/coaching"
                      className="inline-flex items-center gap-0.5 text-[11px] px-2.5 py-1 border border-[#d2d2d7] rounded-lg text-[#6e6e73] hover:bg-slate-50 flex-shrink-0"
                    >
                      1:1 <ChevronRight size={12} />
                    </Link>
                  </div>
                )
              })
            )}
          </div>

          {/* Open tasks (compact) */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <span className={cardTitle}>Open tasks</span>
              <Link href="/todos" className={linkBtn}>Kanban <ChevronRight size={12} className="inline" /></Link>
            </div>

            {openTasksList.length === 0 ? (
              <div className="py-3 text-[12px] text-[#6e6e73] flex items-center justify-center gap-1"><Check size={12} /> All done!</div>
            ) : (
              openTasksList.map((t) => (
                <div key={t.id} className="flex items-start gap-3 py-2 border-b border-[#f0f0f5] last:border-0">
                  <div className="w-4 h-4 rounded-full border-2 border-[#d2d2d7] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1d1d1f] leading-snug">{t.title}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {t.urgent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFEAEA] text-[#D70015]">
                          Urgent
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0071E3]">
                        {t.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
