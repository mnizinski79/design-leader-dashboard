"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ClaudePanel } from "@/components/claude/ClaudePanel"
import {
  DesignerItem, DesignerSessionItem, DesignerTopicItem, DesignerGoalItem,
  DesignerFeedbackItem, DesignerNoteItem, SessionFlag, DreyfusStage, GoalStatus,
  NinetyDayPlan, PersonType,
} from "@/types"
import { DesignerList } from "@/components/coaching/DesignerList"
import { CoachingPanel, ActiveTab } from "@/components/coaching/CoachingPanel"
import { PersonModal, type PersonFormData } from "@/components/people/PersonModal"

interface Props {
  initialDesigners: DesignerItem[]
}

const PERSON_TYPE_TABS: { type: PersonType; label: string; addLabel: string; emptyLabel: string }[] = [
  { type: "DIRECT",     label: "Directs",    addLabel: "Add direct",  emptyLabel: "Select a direct or add one to get started" },
  { type: "LEADERSHIP", label: "Leadership", addLabel: "Add leader",  emptyLabel: "Select a leader or add one to get started" },
  { type: "PEER",       label: "Peers",      addLabel: "Add peer",    emptyLabel: "Select a peer or add one to get started" },
]

export function CoachingPageClient({ initialDesigners }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const designerParam = searchParams.get("designer")

  const [designers, setDesigners] = useState<DesignerItem[]>(initialDesigners)
  const [personTypeTab, setPersonTypeTab] = useState<PersonType>(() => {
    if (designerParam) {
      const found = initialDesigners.find((d) => d.id === designerParam)
      return found?.personType ?? "DIRECT"
    }
    return "DIRECT"
  })
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (designerParam && initialDesigners.some((d) => d.id === designerParam)) {
      return designerParam
    }
    return null
  })
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const found = designerParam ? initialDesigners.find((d) => d.id === designerParam) : null
    return found?.personType === "DIRECT" ? "skills" : "topics"
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [claudeOpen, setClaudeOpen] = useState(false)
  const [claudePrompt, setClaudePrompt] = useState<string | null>(null)
  const [claudeLabel, setClaudeLabel] = useState("")
  const [claudeSystemPrompt, setClaudeSystemPrompt] = useState<string | undefined>(undefined)
  const [claudeSaveHandler, setClaudeSaveHandler] = useState<((text: string) => Promise<void>) | undefined>(undefined)

  const visibleDesigners = designers.filter((d) => d.personType === personTypeTab)
  const selected = designers.find((d) => d.id === selectedId) ?? null

  // Reset selection and tab when switching person type tabs
  function switchPersonTypeTab(type: PersonType) {
    setPersonTypeTab(type)
    setSelectedId(null)
    setActiveTab(type === "DIRECT" ? "skills" : "topics")
  }

  // When selected person changes, reset active tab to appropriate default
  useEffect(() => {
    if (!selected) return
    setActiveTab(selected.personType === "DIRECT" ? "skills" : "topics")
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateDesigner(id: string, patch: Partial<DesignerItem>) {
    setDesigners((prev) => prev.map((d) => d.id === id ? { ...d, ...patch } : d))
  }

  function handleOpenClaude(prompt: string, label: string, systemPrompt?: string, onSave?: (text: string) => Promise<void>) {
    setClaudePrompt(prompt)
    setClaudeLabel(label)
    setClaudeSystemPrompt(systemPrompt)
    setClaudeSaveHandler(onSave ? () => onSave : undefined)
    setClaudeOpen(true)
  }

  async function handleSavePerson(data: PersonFormData) {
    const res = await fetch("/api/designers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name.trim(),
        role: data.role.trim(),
        personType: data.personType,
        roleLevel: data.roleLevel,
        dreyfusStage: data.personType === "DIRECT" ? (data.dreyfusStage || null) : null,
        nextOneOnOne: data.nextOneOnOne || null,
        avatarClass: data.avatarClass,
      }),
    })
    if (!res.ok) throw new Error("Failed to create")
    const created: DesignerItem = await res.json()
    setDesigners((prev) => [...prev, created])
    setPersonTypeTab(created.personType)
    setSelectedId(created.id)
    setShowAddModal(false)
    router.refresh()
  }

  async function handleDreyfusChange(stage: DreyfusStage) {
    if (!selected) return
    const res = await fetch(`/api/designers/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dreyfusStage: stage }),
    })
    if (res.ok) {
      updateDesigner(selected.id, { dreyfusStage: stage })
      router.refresh()
    }
  }

  async function handleSkillsSave(skills: { skillName: string; value: number }[]) {
    if (!selected) return
    const res = await fetch(`/api/designers/${selected.id}/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    })
    if (res.ok) {
      const updatedSkills = await res.json()
      updateDesigner(selected.id, { skills: updatedSkills })
    }
    router.refresh()
  }

  async function handleSessionAdd(data: { date: string; notes: string; flag?: SessionFlag }): Promise<DesignerSessionItem> {
    if (!selected) throw new Error("No person selected")
    const res = await fetch(`/api/designers/${selected.id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const session: DesignerSessionItem = await res.json()
    updateDesigner(selected.id, { sessions: [session, ...(selected.sessions ?? [])] })
    router.refresh()
    return session
  }

  async function handleSessionDelete(sessionId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/sessions/${sessionId}`, { method: "DELETE" })
    updateDesigner(selected.id, { sessions: (selected.sessions ?? []).filter((s) => s.id !== sessionId) })
    router.refresh()
  }

  async function handleTopicAdd(title: string): Promise<DesignerTopicItem> {
    if (!selected) throw new Error("No person selected")
    const res = await fetch(`/api/designers/${selected.id}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    const topic: DesignerTopicItem = await res.json()
    updateDesigner(selected.id, { topics: [...(selected.topics ?? []), topic] })
    router.refresh()
    return topic
  }

  async function handleTopicToggle(topicId: string, discussed: boolean) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discussed }),
    })
    updateDesigner(selected.id, {
      topics: (selected.topics ?? []).map((t) => t.id === topicId ? { ...t, discussed } : t),
    })
    router.refresh()
  }

  async function handleTopicDelete(topicId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/topics/${topicId}`, { method: "DELETE" })
    updateDesigner(selected.id, { topics: (selected.topics ?? []).filter((t) => t.id !== topicId) })
    router.refresh()
  }

  async function handleGoalAdd(data: {
    title: string; description?: string; meetsCriteria?: string; exceedsCriteria?: string; timeline: string
  }): Promise<DesignerGoalItem> {
    if (!selected) throw new Error("No person selected")
    const res = await fetch(`/api/designers/${selected.id}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const goal: DesignerGoalItem = await res.json()
    updateDesigner(selected.id, { goals: [goal, ...(selected.goals ?? [])] })
    router.refresh()
    return goal
  }

  async function handleGoalStatusChange(goalId: string, status: GoalStatus) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    updateDesigner(selected.id, {
      goals: (selected.goals ?? []).map((g) => g.id === goalId ? { ...g, status } : g),
    })
    router.refresh()
  }

  async function handleGoalDelete(goalId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/goals/${goalId}`, { method: "DELETE" })
    updateDesigner(selected.id, { goals: (selected.goals ?? []).filter((g) => g.id !== goalId) })
    router.refresh()
  }

  async function handlePlanSave(plan: NinetyDayPlan) {
    if (!selected) return
    const res = await fetch(`/api/designers/${selected.id}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error((data as { error?: string }).error ?? `Failed to save plan (${res.status})`)
    }
    updateDesigner(selected.id, { ninetyDayPlan: plan })
    setClaudeOpen(false)
    router.refresh()
  }

  async function handlePlanDelete() {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/plan`, { method: "DELETE" })
    updateDesigner(selected.id, { ninetyDayPlan: null })
    router.refresh()
  }

  async function handleFeedbackAdd(data: { sourceName: string; date: string; body: string }): Promise<DesignerFeedbackItem> {
    if (!selected) throw new Error("No person selected")
    const res = await fetch(`/api/designers/${selected.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const fb: DesignerFeedbackItem = await res.json()
    updateDesigner(selected.id, { feedback: [fb, ...(selected.feedback ?? [])] })
    router.refresh()
    return fb
  }

  async function handleFeedbackDelete(feedbackId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/feedback/${feedbackId}`, { method: "DELETE" })
    updateDesigner(selected.id, { feedback: (selected.feedback ?? []).filter((f) => f.id !== feedbackId) })
    router.refresh()
  }

  async function handleNoteAdd(body: string): Promise<DesignerNoteItem> {
    if (!selected) throw new Error("No person selected")
    const res = await fetch(`/api/designers/${selected.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
    const note: DesignerNoteItem = await res.json()
    updateDesigner(selected.id, { notes: [note, ...(selected.notes ?? [])] })
    router.refresh()
    return note
  }

  async function handleNoteUpdate(noteId: string, body: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
    updateDesigner(selected.id, {
      notes: (selected.notes ?? []).map((n) => n.id === noteId ? { ...n, body } : n),
    })
    router.refresh()
  }

  async function handleNoteDelete(noteId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/notes/${noteId}`, { method: "DELETE" })
    updateDesigner(selected.id, { notes: (selected.notes ?? []).filter((n) => n.id !== noteId) })
    router.refresh()
  }

  const currentTabConfig = PERSON_TYPE_TABS.find((t) => t.type === personTypeTab)!

  return (
    <div className="flex flex-col h-full max-w-5xl">
      <div className="shrink-0 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">1:1 &amp; Coaching</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Track growth, sessions, and coaching notes across your network</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + {currentTabConfig.addLabel}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: person list with type tabs */}
        <div className="w-64 shrink-0 flex flex-col h-full">
          {/* Person type tabs */}
          <div className="flex border-b border-[#f0f0f5] mb-3">
            {PERSON_TYPE_TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => switchPersonTypeTab(tab.type)}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold border-b-2 transition-colors",
                  personTypeTab === tab.type
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-[#6e6e73] hover:text-[#1d1d1f]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <DesignerList
            designers={visibleDesigners}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        </div>

        {/* Right: coaching panel */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            {currentTabConfig.emptyLabel}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden p-3">
            <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden h-full flex flex-col">
              <CoachingPanel
                key={selected.id}
                designer={selected}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onDreyfusChange={handleDreyfusChange}
                onSkillsSave={handleSkillsSave}
                onSessionAdd={handleSessionAdd}
                onSessionDelete={handleSessionDelete}
                onTopicAdd={handleTopicAdd}
                onTopicToggle={handleTopicToggle}
                onTopicDelete={handleTopicDelete}
                onGoalAdd={handleGoalAdd}
                onGoalStatusChange={handleGoalStatusChange}
                onGoalDelete={handleGoalDelete}
                onFeedbackAdd={handleFeedbackAdd}
                onFeedbackDelete={handleFeedbackDelete}
                onNoteAdd={handleNoteAdd}
                onNoteUpdate={handleNoteUpdate}
                onNoteDelete={handleNoteDelete}
                onOpenClaude={handleOpenClaude}
                onPlanSave={handlePlanSave}
                onPlanDelete={handlePlanDelete}
              />
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <PersonModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSavePerson}
          defaultPersonType={personTypeTab}
        />
      )}

      <ClaudePanel
        isOpen={claudeOpen}
        onClose={() => setClaudeOpen(false)}
        prompt={claudePrompt}
        contextLabel={claudeLabel}
        systemPrompt={claudeSystemPrompt}
        onSave={claudeSaveHandler}
      />
    </div>
  )
}
