export interface TodoItem {
  id: string
  userId: string
  title: string
  description: string | null
  category: string
  status: "TODO" | "INPROGRESS" | "AWAITING" | "COMPLETE"
  dueDate: string | null
  urgent: boolean
  sortOrder: number
  createdAt: string
}

export interface DailyFocusItem {
  id: string
  userId: string
  date: string
  text: string
}

export interface ConversationItem {
  id: string
  userId: string
  topic: string
  description: string | null
  person: string
  done: boolean
  createdAt: string
}

export interface DesignerForPulse {
  id: string
  name: string
  role: string
  nextOneOnOne: string | null
}

export interface NoteTagItem {
  id: string
  name: string
}

export interface NoteItem {
  id: string
  userId: string
  title: string
  project: string
  body: string
  summary: string | null
  date: string
  createdAt: string
  updatedAt: string
  tags: NoteTagItem[]
}

export interface IdeaItem {
  id: string
  userId: string
  title: string
  category: string
  createdAt: string
}

export type DreyfusStage = "NOVICE" | "ADVANCED_BEGINNER" | "COMPETENT" | "PROFICIENT" | "EXPERT"
export type SessionFlag = "POSITIVE" | "DEVELOPMENT" | "COACHING" | "FOLLOWUP"
export type GoalStatus = "ON_TRACK" | "AT_RISK" | "COMPLETE"

export interface DesignerSkillItem {
  id: string
  skillName: string
  value: number
}

export interface DesignerSessionItem {
  id: string
  designerId: string
  date: string
  notes: string
  flag: SessionFlag | null
  summary: string | null
  createdAt: string
}

export interface DesignerGoalItem {
  id: string
  designerId: string
  title: string
  description: string | null
  meetsCriteria: string | null
  exceedsCriteria: string | null
  timeline: string
  status: GoalStatus
  createdAt: string
}

export interface DesignerFeedbackItem {
  id: string
  designerId: string
  sourceName: string
  date: string
  body: string
  createdAt: string
}

export interface DesignerTopicItem {
  id: string
  designerId: string
  title: string
  discussed: boolean
  createdAt: string
}

export interface DesignerNoteItem {
  id: string
  designerId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface NinetyDayPlan {
  quarter: string
  startDate: string
  endDate: string
  quarterFocus: string
  developmentPriorities: string
  coachingApproach: string
  keyMilestones: string
  createdAt: string
  updatedAt: string
}

export interface DesignerItem {
  id: string
  userId: string
  name: string
  role: string
  roleLevel: string
  dreyfusStage: DreyfusStage | null
  avatarClass: string
  nextOneOnOne: string | null
  createdAt: string
  ninetyDayPlan: NinetyDayPlan | null
  skills: DesignerSkillItem[]
  sessions: DesignerSessionItem[]
  goals: DesignerGoalItem[]
  feedback: DesignerFeedbackItem[]
  topics: DesignerTopicItem[]
  notes: DesignerNoteItem[]
}

export type ProjectPhase =
  | "DISCOVERY"
  | "DESIGN"
  | "DEV_HANDOFF"
  | "IN_DEVELOPMENT"
  | "LIVE"
  | "ON_HOLD"

export type ProjectStatus = "ON_TRACK" | "AT_RISK" | "BLOCKED" | "COMPLETE"

export interface ProjectDecisionItem {
  id: string
  projectId: string
  text: string
  createdAt: string
}

export interface ProjectDesignerItem {
  designerId: string
  designer: { id: string; name: string }
}

export interface ProjectItem {
  id: string
  userId: string
  name: string
  phase: ProjectPhase
  status: ProjectStatus
  description: string | null
  dueDate: string | null
  sprintSnapshot: string | null
  stakeholders: string | null
  attention: string | null
  blockers: string | null
  details: string | null
  createdAt: string
  decisions: ProjectDecisionItem[]
  designers: ProjectDesignerItem[]
}

export type SharedTaskStatus = "OPEN" | "PICKED_UP" | "ARCHIVED"

export interface SharedTaskShareItem {
  id: string
  userId: string
  userEmail: string
  viewedAt: string | null
  createdAt: string
}

export interface SharedTaskItem {
  id: string
  title: string
  description: string | null
  status: SharedTaskStatus
  creatorId: string
  creatorEmail: string
  pickedUpBy: string | null
  pickedUpByEmail: string | null
  pickedUpAt: string | null
  todoId: string | null
  shares: SharedTaskShareItem[]
  viewedAt: string | null   // current user's viewedAt (null = "New" badge)
  isCreator: boolean        // true if current user is the creator
  createdAt: string
  updatedAt: string
}
