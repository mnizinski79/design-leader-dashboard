"use client"

import {
  DesignerItem, DesignerSessionItem, DesignerTopicItem, DesignerGoalItem,
  DesignerFeedbackItem, DesignerNoteItem, SessionFlag, DreyfusStage, GoalStatus,
} from "@/types"
import { SkillsTab } from "@/components/coaching/tabs/SkillsTab"
import { SessionsTab } from "@/components/coaching/tabs/SessionsTab"
import { TopicsTab } from "@/components/coaching/tabs/TopicsTab"
import { GoalsTab } from "@/components/coaching/tabs/GoalsTab"
import { FeedbackTab } from "@/components/coaching/tabs/FeedbackTab"
import { NotesTab } from "@/components/coaching/tabs/NotesTab"
import { CoachingBrief } from "@/components/coaching/CoachingBrief"

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
  onGoalAdd: (data: { title: string; description?: string; meetsCriteria?: string; exceedsCriteria?: string; timeline: string }) => Promise<DesignerGoalItem>
  onGoalStatusChange: (goalId: string, status: GoalStatus) => Promise<void>
  onGoalDelete: (goalId: string) => Promise<void>
  onFeedbackAdd: (data: { sourceName: string; date: string; body: string }) => Promise<DesignerFeedbackItem>
  onFeedbackDelete: (feedbackId: string) => Promise<void>
  onNoteAdd: (body: string) => Promise<DesignerNoteItem>
  onNoteUpdate: (noteId: string, body: string) => Promise<void>
  onNoteDelete: (noteId: string) => Promise<void>
}

export function CoachingPanel({
  designer, activeTab, onTabChange,
  onDreyfusChange, onSkillsSave,
  onSessionAdd, onSessionDelete,
  onTopicAdd, onTopicToggle, onTopicDelete,
  onGoalAdd, onGoalStatusChange, onGoalDelete,
  onFeedbackAdd, onFeedbackDelete,
  onNoteAdd, onNoteUpdate, onNoteDelete,
}: Props) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
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
          <GoalsTab
            designer={designer}
            onGoalAdd={onGoalAdd}
            onGoalStatusChange={onGoalStatusChange}
            onGoalDelete={onGoalDelete}
          />
        )}
        {activeTab === "feedback" && (
          <FeedbackTab
            designer={designer}
            onFeedbackAdd={onFeedbackAdd}
            onFeedbackDelete={onFeedbackDelete}
          />
        )}
        {activeTab === "notes" && (
          <NotesTab
            designer={designer}
            onNoteAdd={onNoteAdd}
            onNoteUpdate={onNoteUpdate}
            onNoteDelete={onNoteDelete}
          />
        )}
      </div>

      {/* Coaching Brief footer */}
      <CoachingBrief designer={designer} />
    </div>
  )
}
