export type DueBadge = "overdue" | "today" | "soon" | null

export function getDueBadge(dueDate: string | null, today = new Date()): DueBadge {
  if (!dueDate) return null
  // Parse due date as UTC to avoid timezone shifts
  const due = new Date(dueDate + "T00:00:00Z")
  // Normalize today to UTC midnight for consistent day comparison
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const dueStart = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())
  const diffDays = Math.round((dueStart - todayStart) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "overdue"
  if (diffDays === 0) return "today"
  if (diffDays <= 3) return "soon"
  return null
}
