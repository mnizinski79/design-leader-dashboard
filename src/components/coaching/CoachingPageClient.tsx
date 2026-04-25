"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  DesignerItem, DesignerSessionItem, DesignerTopicItem, DesignerGoalItem,
  DesignerFeedbackItem, DesignerNoteItem, SessionFlag, DreyfusStage, GoalStatus,
} from "@/types"
import { DesignerList } from "@/components/coaching/DesignerList"
import { AddDesignerModal } from "@/components/coaching/AddDesignerModal"
import { CoachingPanel, ActiveTab } from "@/components/coaching/CoachingPanel"

interface Props {
  initialDesigners: DesignerItem[]
}

export function CoachingPageClient({ initialDesigners }: Props) {
  const searchParams = useSearchParams()
  const designerParam = searchParams.get("designer")

  const [designers, setDesigners] = useState<DesignerItem[]>(initialDesigners)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (designerParam && initialDesigners.some((d) => d.id === designerParam)) {
      return designerParam
    }
    return null
  })
  const [activeTab, setActiveTab] = useState<ActiveTab>("skills")
  const [showAddModal, setShowAddModal] = useState(false)

  const selected = designers.find((d) => d.id === selectedId) ?? null

  function updateDesigner(id: string, patch: Partial<DesignerItem>) {
    setDesigners((prev) => prev.map((d) => d.id === id ? { ...d, ...patch } : d))
  }

  function handleDesignerCreated(designer: DesignerItem) {
    setDesigners((prev) => [...prev, designer])
    setSelectedId(designer.id)
    setShowAddModal(false)
  }

  async function handleDreyfusChange(stage: DreyfusStage) {
    if (!selected) return
    const res = await fetch(`/api/designers/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dreyfusStage: stage }),
    })
    if (res.ok) updateDesigner(selected.id, { dreyfusStage: stage })
  }

  async function handleSkillsSave(skills: { skillName: string; value: number }[]) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    })
  }

  async function handleSessionAdd(data: { date: string; notes: string; flag?: SessionFlag }): Promise<DesignerSessionItem> {
    if (!selected) throw new Error("No designer selected")
    const res = await fetch(`/api/designers/${selected.id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const session: DesignerSessionItem = await res.json()
    updateDesigner(selected.id, { sessions: [session, ...(selected.sessions ?? [])] })
    return session
  }

  async function handleSessionDelete(sessionId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/sessions/${sessionId}`, { method: "DELETE" })
    updateDesigner(selected.id, { sessions: (selected.sessions ?? []).filter((s) => s.id !== sessionId) })
  }

  async function handleTopicAdd(title: string): Promise<DesignerTopicItem> {
    if (!selected) throw new Error("No designer selected")
    const res = await fetch(`/api/designers/${selected.id}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    const topic: DesignerTopicItem = await res.json()
    updateDesigner(selected.id, { topics: [...(selected.topics ?? []), topic] })
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
  }

  async function handleTopicDelete(topicId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/topics/${topicId}`, { method: "DELETE" })
    updateDesigner(selected.id, { topics: (selected.topics ?? []).filter((t) => t.id !== topicId) })
  }

  async function handleGoalAdd(data: {
    title: string; description?: string; meetsCriteria?: string; exceedsCriteria?: string; timeline: string
  }): Promise<DesignerGoalItem> {
    if (!selected) throw new Error("No designer selected")
    const res = await fetch(`/api/designers/${selected.id}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const goal: DesignerGoalItem = await res.json()
    updateDesigner(selected.id, { goals: [goal, ...(selected.goals ?? [])] })
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
  }

  async function handleGoalDelete(goalId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/goals/${goalId}`, { method: "DELETE" })
    updateDesigner(selected.id, { goals: (selected.goals ?? []).filter((g) => g.id !== goalId) })
  }

  async function handleFeedbackAdd(data: { sourceName: string; date: string; body: string }): Promise<DesignerFeedbackItem> {
    if (!selected) throw new Error("No designer selected")
    const res = await fetch(`/api/designers/${selected.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const fb: DesignerFeedbackItem = await res.json()
    updateDesigner(selected.id, { feedback: [fb, ...(selected.feedback ?? [])] })
    return fb
  }

  async function handleFeedbackDelete(feedbackId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/feedback/${feedbackId}`, { method: "DELETE" })
    updateDesigner(selected.id, { feedback: (selected.feedback ?? []).filter((f) => f.id !== feedbackId) })
  }

  async function handleNoteAdd(body: string): Promise<DesignerNoteItem> {
    if (!selected) throw new Error("No designer selected")
    const res = await fetch(`/api/designers/${selected.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
    const note: DesignerNoteItem = await res.json()
    updateDesigner(selected.id, { notes: [note, ...(selected.notes ?? [])] })
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
  }

  async function handleNoteDelete(noteId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/notes/${noteId}`, { method: "DELETE" })
    updateDesigner(selected.id, { notes: (selected.notes ?? []).filter((n) => n.id !== noteId) })
  }

  return (
    <div className="flex h-full">
      <DesignerList
        designers={designers}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id)
          setActiveTab("skills")
        }}
        onAdd={() => setShowAddModal(true)}
      />

      {!selected ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a designer or add one to get started
        </div>
      ) : (
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
        />
      )}

      {showAddModal && (
        <AddDesignerModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleDesignerCreated}
        />
      )}
    </div>
  )
}
