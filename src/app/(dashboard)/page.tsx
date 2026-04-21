import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DailyFocusInput } from "@/components/home/DailyFocusInput"
import { QuickStats } from "@/components/home/QuickStats"
import { PriorityTasks } from "@/components/home/PriorityTasks"
import { TeamPulse } from "@/components/home/TeamPulse"
import { PendingConversations } from "@/components/home/PendingConversations"
import { type TodoItem, type ConversationItem, type DesignerForPulse, type DailyFocusItem } from "@/types"
import { getSprintInfo } from "@/lib/sprint-utils"

function getGreeting(firstName: string) {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${firstName}`
  if (hour < 17) return `Good afternoon, ${firstName}`
  return `Good evening, ${firstName}`
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const firstName = session.user.name?.split(" ")[0] ?? "there"

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const in7Days = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [todos, designers, conversations, dailyFocus, atRiskCount] = await Promise.all([
    prisma.todo.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    prisma.designer.findMany({
      where: { userId },
      select: { id: true, name: true, role: true, nextOneOnOne: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.conversation.findMany({
      where: { userId, done: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dailyFocus.findFirst({ where: { userId, date: todayStart } }),
    prisma.project.count({ where: { userId, status: { in: ["AT_RISK", "BLOCKED"] } } }),
  ])

  // Quick stats
  const urgentCount = todos.filter(t => t.urgent && t.status !== "COMPLETE").length
  const overdueCount = todos.filter(
    t => t.status !== "COMPLETE" && t.dueDate !== null && t.dueDate < todayStart
  ).length
  const upcomingOneOnOneCount = designers.filter(
    d => d.nextOneOnOne && d.nextOneOnOne >= todayStart && d.nextOneOnOne <= in7Days
  ).length

  // Serialize for client components
  const todoItems: TodoItem[] = todos.map(t => ({
    id: t.id,
    userId: t.userId,
    title: t.title,
    description: t.description,
    category: t.category,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
    urgent: t.urgent,
    sortOrder: t.sortOrder,
    createdAt: t.createdAt.toISOString(),
  }))

  const designerItems: DesignerForPulse[] = designers.map(d => ({
    id: d.id,
    name: d.name,
    role: d.role,
    nextOneOnOne: d.nextOneOnOne ? d.nextOneOnOne.toISOString().split("T")[0] : null,
  }))

  const conversationItems: ConversationItem[] = conversations.map(c => ({
    id: c.id,
    userId: c.userId,
    topic: c.topic,
    description: c.description,
    person: c.person,
    done: c.done,
    createdAt: c.createdAt.toISOString(),
  }))

  const focusItem: DailyFocusItem | null = dailyFocus
    ? {
        id: dailyFocus.id,
        userId: dailyFocus.userId,
        date: dailyFocus.date.toISOString().split("T")[0],
        text: dailyFocus.text,
      }
    : null

  const sprint = getSprintInfo()
  const today = new Date()

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{getGreeting(firstName)}</h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          {" · "}Sprint {sprint.number} · {sprint.daysRemaining} day
          {sprint.daysRemaining !== 1 ? "s" : ""} remaining
        </p>
      </div>

      <DailyFocusInput initialFocus={focusItem} />

      <QuickStats
        urgentCount={urgentCount}
        overdueCount={overdueCount}
        upcomingOneOnOneCount={upcomingOneOnOneCount}
        atRiskProjectCount={atRiskCount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PriorityTasks todos={todoItems} />
        <TeamPulse designers={designerItems} />
      </div>

      <PendingConversations initialConversations={conversationItems} />
    </div>
  )
}
