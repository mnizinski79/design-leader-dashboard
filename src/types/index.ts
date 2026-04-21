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
