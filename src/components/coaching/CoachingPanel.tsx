"use client"

import { DesignerItem, DesignerSessionItem, DesignerTopicItem, SessionFlag, DreyfusStage } from "@/types"
import { SkillsTab } from "@/components/coaching/tabs/SkillsTab"
import { SessionsTab } from "@/components/coaching/tabs/SessionsTab"
import { TopicsTab } from "@/components/coaching/tabs/TopicsTab"

export type ActiveTab = "skills" | "sessions" | "topics" | "goals" | "feedback" | "notes"

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "skills", label: "Skills" },
  { id: "sessions", label: "Sessions" },
  { id: "topics", label: "Topics" },
  { id: "goals", label: "Goals" },
  { id: "feedback", label: "Feedback" },
  { id: "notes", label: "Notes" },
]

interface Props {
  designer: DesignerItem
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  onDreyfusChange: (stage: DreyfusStage) => Promise<void>
  onSkillsSave: (skills: { skillName: string; value: number }[]) => Promise<void>
  onSessionAdd: (data: { date: string; notes: string; flag?: SessionFlag }) => Promise<DesignerSessionItem>
  onSessionDelete: (sessionId: string) => Promise<void>
  onTopicAdd: (title: string) => Promise<DesignerTopicItem>
  onTopicToggle: (topicId: string, discussed: boolean) => Promise<void>
  onTopicDelete: (topicId: string) => Promise<void>
}

export function CoachingPanel({
  designer,
  activeTab,
  onTabChange,
  onDreyfusChange,
  onSkillsSave,
  onSessionAdd,
  onSessionDelete,
  onTopicAdd,
  onTopicToggle,
  onTopicDelete,
}: Props) {
  return (
    <div className="flex-1 flex flex-col min-w-0" key={designer.id}>
      {/* Tab bar */}
      <div className="border-b px-4 flex gap-1 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
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

      {/* Tab content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "skills" && (
          <SkillsTab
            designer={designer}
            onDreyfusChange={onDreyfusChange}
            onSkillsSave={onSkillsSave}
          />
        )}
        {activeTab === "sessions" && (
          <SessionsTab
            designer={designer}
            onSessionAdd={onSessionAdd}
            onSessionDelete={onSessionDelete}
          />
        )}
        {activeTab === "topics" && (
          <TopicsTab
            designer={designer}
            onTopicAdd={onTopicAdd}
            onTopicToggle={onTopicToggle}
            onTopicDelete={onTopicDelete}
          />
        )}
        {activeTab === "goals" && (
          <p className="text-sm text-muted-foreground">Goals tab — Phase 4d</p>
        )}
        {activeTab === "feedback" && (
          <p className="text-sm text-muted-foreground">Feedback tab — Phase 4d</p>
        )}
        {activeTab === "notes" && (
          <p className="text-sm text-muted-foreground">Notes tab — Phase 4d</p>
        )}
      </div>

      {/* Coaching Brief footer placeholder */}
      <div className="border-t px-4 py-3 shrink-0 bg-muted/30">
        <p className="text-xs text-muted-foreground">Coaching Brief footer — Phase 4d</p>
      </div>
    </div>
  )
}
