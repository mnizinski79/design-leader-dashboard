export type DueBadge = "overdue" | "today" | "soon" | null

export function getDueBadge(dueDate: string | null, todayStr?: string): DueBadge {
  if (!dueDate) return null
  const today = todayStr ?? new Date().toLocaleDateString("en-CA")
  if (dueDate < today) return "overdue"
  if (dueDate === today) return "today"
  // Both parsed as UTC midnight — difference is exact whole days
  const diffDays = Math.round((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000)
  if (diffDays <= 3) return "soon"
  return null
}
