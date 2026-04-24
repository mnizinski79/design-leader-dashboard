"use client"

import { useState } from "react"
import { DesignerItem } from "@/types"
import { DesignerList } from "@/components/coaching/DesignerList"
import { AddDesignerModal } from "@/components/coaching/AddDesignerModal"

interface Props {
  initialDesigners: DesignerItem[]
}

type ActiveTab = "skills" | "sessions" | "topics" | "goals" | "feedback" | "notes"

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "skills", label: "Skills" },
  { id: "sessions", label: "Sessions" },
  { id: "topics", label: "Topics" },
  { id: "goals", label: "Goals" },
  { id: "feedback", label: "Feedback" },
  { id: "notes", label: "Notes" },
]

export function CoachingPageClient({ initialDesigners }: Props) {
  const [designers, setDesigners] = useState<DesignerItem[]>(initialDesigners)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("skills")
  const [showAddModal, setShowAddModal] = useState(false)

  const selected = designers.find((d) => d.id === selectedId) ?? null

  function handleDesignerCreated(designer: DesignerItem) {
    setDesigners((prev) => [...prev, designer])
    setSelectedId(designer.id)
    setShowAddModal(false)
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a designer or add one to get started
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="border-b px-4 flex gap-1 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content placeholder — replaced in Phase 4c & 4d */}
            <div className="flex-1 p-6 overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                {TABS.find((t) => t.id === activeTab)?.label} content for {selected.name} — coming soon
              </p>
            </div>

            {/* Coaching Brief footer placeholder — replaced in Phase 4d */}
            <div className="border-t px-4 py-3 shrink-0 bg-muted/30">
              <p className="text-xs text-muted-foreground">Coaching Brief footer — Phase 4d</p>
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <AddDesignerModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleDesignerCreated}
        />
      )}
    </div>
  )
}
