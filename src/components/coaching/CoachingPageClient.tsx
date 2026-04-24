"use client"

import { useState } from "react"
import { DesignerItem, DesignerSessionItem, DesignerTopicItem, SessionFlag, DreyfusStage } from "@/types"
import { DesignerList } from "@/components/coaching/DesignerList"
import { AddDesignerModal } from "@/components/coaching/AddDesignerModal"
import { CoachingPanel, ActiveTab } from "@/components/coaching/CoachingPanel"

interface Props {
  initialDesigners: DesignerItem[]
}

export function CoachingPageClient({ initialDesigners }: Props) {
  const [designers, setDesigners] = useState<DesignerItem[]>(initialDesigners)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
    if (res.ok) {
      updateDesigner(selected.id, { dreyfusStage: stage })
    }
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
    updateDesigner(selected.id, {
      sessions: [session, ...(selected.sessions ?? [])],
    })
    return session
  }

  async function handleSessionDelete(sessionId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/sessions/${sessionId}`, { method: "DELETE" })
    updateDesigner(selected.id, {
      sessions: (selected.sessions ?? []).filter((s) => s.id !== sessionId),
    })
  }

  async function handleTopicAdd(title: string): Promise<DesignerTopicItem> {
    if (!selected) throw new Error("No designer selected")
    const res = await fetch(`/api/designers/${selected.id}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    const topic: DesignerTopicItem = await res.json()
    updateDesigner(selected.id, {
      topics: [...(selected.topics ?? []), topic],
    })
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
      topics: (selected.topics ?? []).map((t) =>
        t.id === topicId ? { ...t, discussed } : t
      ),
    })
  }

  async function handleTopicDelete(topicId: string) {
    if (!selected) return
    await fetch(`/api/designers/${selected.id}/topics/${topicId}`, { method: "DELETE" })
    updateDesigner(selected.id, {
      topics: (selected.topics ?? []).filter((t) => t.id !== topicId),
    })
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
