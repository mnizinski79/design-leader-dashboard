"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, User, ChevronRight, ClipboardList, Pencil, Plus, X, Bell } from "lucide-react"
import type { TodoItem, ConversationItem, DailyFocusItem } from "@/types"
import type { HomeDesigner, HomeProject } from "@/app/(dashboard)/home/page"
import { SplitButton } from "@/components/claude/SplitButton"

interface AppNotification {
  id: string
  label: string
  severity: "alert" | "warn" | "info"
  href: string
}

const AVATAR_BG: Record<string, string> = {
  "av-blue":   "#0071E3",
  "av-purple": "#7C3AED",
  "av-teal":   "#0D9488",
  "av-pink":   "#DB2777",
  "av-amber":  "#D97706",
  "av-green":  "#1D7A1D",
}

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
  todayStr: todayStrServer,
}: Props) {
  const router = useRouter()
  // Override server's UTC-based date with the client's local date after hydration
  const [todayStr, setTodayStr] = useState(todayStrServer)
  useEffect(() => { setTodayStr(new Date().toLocaleDateString("en-CA")) }, [])
  const [focus, setFocus] = useState<DailyFocusItem | null>(initialFocus)
  const [editingFocus, setEditingFocus] = useState(false)
  const [focusDraft, setFocusDraft] = useState("")
  const [savingFocus, setSavingFocus] = useState(false)

  // ── Daily briefing state ──────────────────────────────────────────────────
  const [briefingText, setBriefingText] = useState("")
  const [briefingStreaming, setBriefingStreaming] = useState(false)
  const [briefingError, setBriefingError] = useState<string | null>(null)
  const [briefingVisible, setBriefingVisible] = useState(false)
  const briefingAbortRef = useRef<AbortController | null>(null)

  // ── Notifications panel state ─────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panelOpen) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [panelOpen])

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

  // ── Named notifications ───────────────────────────────────────────────────
  const notifications: AppNotification[] = []

  // Blocked projects (highest severity)
  projects.filter(p => p.status === "BLOCKED").forEach(p => {
    notifications.push({ id: `proj-blocked-${p.id}`, label: `${p.name} is blocked`, severity: "alert", href: "/projects" })
  })
  // Urgent incomplete tasks
  openTodos.filter(t => t.urgent).forEach(t => {
    notifications.push({ id: `todo-urgent-${t.id}`, label: `Urgent: ${t.title}`, severity: "alert", href: "/todos" })
  })
  // Overdue tasks (non-urgent)
  openTodos.filter(t => t.dueDate && t.dueDate < todayStr && !t.urgent).forEach(t => {
    notifications.push({ id: `todo-overdue-${t.id}`, label: `"${t.title}" is overdue`, severity: "alert", href: "/todos" })
  })
  // Overdue 1:1s
  designers.filter(d => d.nextOneOnOne && d.nextOneOnOne < todayStr).forEach(d => {
    const days = Math.floor((new Date(todayStr).getTime() - new Date(d.nextOneOnOne!).getTime()) / 86400000)
    notifications.push({ id: `oneone-overdue-${d.id}`, label: `${d.name}'s 1:1 is ${days} day${days !== 1 ? "s" : ""} overdue`, severity: "alert", href: `/coaching?designer=${d.id}` })
  })
  // At-risk projects
  projects.filter(p => p.status === "AT_RISK").forEach(p => {
    notifications.push({ id: `proj-risk-${p.id}`, label: `${p.name} is at risk`, severity: "warn", href: "/projects" })
  })
  // Projects needing attention (on track but flagged)
  projects.filter(p => p.status !== "BLOCKED" && p.status !== "AT_RISK" && (p.attention || p.blockers)).forEach(p => {
    notifications.push({ id: `proj-attn-${p.id}`, label: `${p.name} needs attention`, severity: "warn", href: "/projects" })
  })
  // Upcoming 1:1s (within 2 days, not overdue)
  designers.filter(d => {
    if (!d.nextOneOnOne || d.nextOneOnOne < todayStr) return false
    const daysUntil = Math.floor((new Date(d.nextOneOnOne).getTime() - new Date(todayStr).getTime()) / 86400000)
    return daysUntil <= 2
  }).forEach(d => {
    const daysUntil = Math.floor((new Date(d.nextOneOnOne!).getTime() - new Date(todayStr).getTime()) / 86400000)
    const when = daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : "in 2 days"
    notifications.push({ id: `oneone-upcoming-${d.id}`, label: `${d.name}'s 1:1 is ${when}`, severity: "warn", href: `/coaching?designer=${d.id}` })
  })
  // Pending conversations
  if (convos.length > 0) {
    notifications.push({ id: "convos", label: `${convos.length} conversation${convos.length > 1 ? "s" : ""} to have`, severity: "info", href: "/home" })
  }

  const visibleNotifications = notifications.slice(0, 3)
  const overflowCount = notifications.length - 3

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
      const res = await fetch(`/api/daily-focus?date=${todayStr}`, {
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

  // ── Notification chip style ───────────────────────────────────────────────
  function notifChipStyle(severity: AppNotification["severity"]) {
    if (severity === "alert") return "bg-[#FFEAEA] text-[#D70015]"
    if (severity === "warn") return "bg-[#FFF8E1] text-[#B45309]"
    return "bg-[#E0F2FE] text-[#0071E3]"
  }

  // ── Daily briefing ────────────────────────────────────────────────────────
  function buildBriefingPrompt(): string {
    const focusText = focusIsToday && focus?.text ? focus.text : "not set"
    const urgentTasks = openTodos.filter((t) => t.urgent).map((t) => t.title).join(", ") || "none"
    const overdueTasks = openTodos.filter((t) => t.dueDate && t.dueDate < todayStr).map((t) => t.title).join(", ") || "none"
    const atRiskProjectList = projects.map((p) => {
      const label = p.status === "ON_TRACK" && (p.attention || p.blockers) ? "Needs attention" : STATUS_LABEL[p.status] ?? p.status
      return `${p.name} (${label})`
    }).join(", ") || "none"
    const convosNeeded = convos.map((c) => c.topic + (c.person ? ` with ${c.person}` : "")).join(", ") || "none"
    const teamSummary = designers.map((d) => {
      if (d.nextOneOnOne && d.nextOneOnOne < todayStr) return `${d.name} (overdue 1:1)`
      if (d.openTopics > 0) return `${d.name} (${d.openTopics} topic${d.openTopics > 1 ? "s" : ""} to discuss)`
      return d.name
    }).join(", ") || "no team"

    return `You are a sharp chief of staff giving a design director their morning briefing. Be direct, specific, and actionable. Max 4 sentences. No fluff.

Today's focus: ${focusText}
Urgent tasks: ${urgentTasks}
Overdue tasks: ${overdueTasks}
Projects at risk: ${atRiskProjectList}
Conversations needed: ${convosNeeded}
Team: ${teamSummary}

Give a crisp morning briefing that tells them where to direct their energy today.`
  }

  async function runBriefing() {
    briefingAbortRef.current?.abort()
    const abort = new AbortController()
    briefingAbortRef.current = abort
    setBriefingText("")
    setBriefingError(null)
    setBriefingVisible(true)
    setBriefingStreaming(true)

    try {
      const res = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: buildBriefingPrompt() }] }),
        signal: abort.signal,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Request failed")
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setBriefingText((prev) => prev + decoder.decode(value, { stream: true }))
        }
      } finally {
        reader.releaseLock()
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      setBriefingError((e as Error).message || "Something went wrong.")
    } finally {
      setBriefingStreaming(false)
    }
  }

  function dismissBriefing() {
    briefingAbortRef.current?.abort()
    setBriefingVisible(false)
    setBriefingText("")
    setBriefingError(null)
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
    <div className="flex-1 overflow-y-auto max-w-5xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[28px] font-bold text-[#1d1d1f] leading-tight tracking-[-0.02em]">
            {getGreeting(firstName)}
          </h1>
          <p className="text-sm text-[#6e6e73] mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <SplitButton
            label="Daily Briefing"
            onAsk={runBriefing}
            onCopy={() => navigator.clipboard.writeText(buildBriefingPrompt()).catch(() => {})}
          />
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
              <div className="relative flex flex-wrap gap-1.5" ref={panelRef}>
                {notifications.length === 0 ? (
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#E3F3E3] text-[#1D7A1D]">
                    All clear — great start
                  </span>
                ) : (
                  <>
                    {visibleNotifications.map(n => (
                      <Link
                        key={n.id}
                        href={n.href}
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-opacity hover:opacity-80 ${notifChipStyle(n.severity)}`}
                      >
                        {n.label}
                      </Link>
                    ))}
                    {overflowCount > 0 && (
                      <button
                        onClick={() => setPanelOpen(v => !v)}
                        className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0071E3] hover:opacity-80 transition-opacity flex items-center gap-1"
                      >
                        <Bell size={10} />
                        +{overflowCount} more
                      </button>
                    )}
                  </>
                )}

                {/* Notifications panel */}
                {panelOpen && (
                  <div className="absolute top-8 left-0 z-50 w-80 bg-white rounded-xl shadow-lg border border-[#e5e5ea] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f5]">
                      <span className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-[0.07em]">All notifications</span>
                      <button onClick={() => setPanelOpen(false)} className="text-[#6e6e73] hover:text-[#1d1d1f]">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.map(n => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setPanelOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f5] last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${n.severity === "alert" ? "bg-[#D70015]" : n.severity === "warn" ? "bg-[#B45309]" : "bg-[#0071E3]"}`} />
                          <span className="text-[13px] text-[#1d1d1f]">{n.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* ── Daily briefing result ── */}
      {briefingVisible && (
        <div className="bg-white rounded-xl p-5 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[#1d1d1f]">Daily Briefing</span>
            <button onClick={dismissBriefing} className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
              <X size={14} />
            </button>
          </div>
          {briefingError ? (
            <p className="text-[13px] text-[#D70015]">{briefingError}</p>
          ) : briefingText ? (
            <p className="text-[14px] text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">{briefingText}</p>
          ) : briefingStreaming ? (
            <p className="text-[13px] text-[#6e6e73] italic">Generating your briefing…</p>
          ) : null}
        </div>
      )}

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
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: AVATAR_BG[d.avatarClass] ?? "#0071E3" }}
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
                      href={`/coaching?designer=${d.id}`}
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
