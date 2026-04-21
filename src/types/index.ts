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
