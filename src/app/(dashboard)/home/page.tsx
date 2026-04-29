import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { HomePageClient } from "@/components/home/HomePageClient"
import type { TodoItem, ConversationItem, DailyFocusItem } from "@/types"

export interface HomeDesigner {
  id: string
  name: string
  role: string
  nextOneOnOne: string | null
  openTopics: number
  avatarClass: string
}

export interface HomeProject {
  id: string
  name: string
  phase: string
  status: string
  attention: string | null
  blockers: string | null
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const firstName = session.user.name?.split(" ")[0] ?? "there"

  let tz = "UTC"
  try {
    const raw = (await cookies()).get("tz")?.value
    if (raw) {
      const decoded = decodeURIComponent(raw)
      new Intl.DateTimeFormat("en-CA", { timeZone: decoded }) // validate
      tz = decoded
    }
  } catch { /* invalid timezone — fall back to UTC */ }
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz })
  const [ty, tm, td] = todayStr.split("-").map(Number)
  const todayMidnight = new Date(ty, tm - 1, td)

  const [todos, atRiskProjects, conversations, designers, dailyFocus] = await Promise.all([
    prisma.todo.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    prisma.project.findMany({
      where: {
        userId,
        OR: [
          { status: { in: ["AT_RISK", "BLOCKED"] } },
          { attention: { not: null } },
          { blockers: { not: null } },
        ],
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.conversation.findMany({
      where: { userId, done: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.designer.findMany({
      where: { userId },
      include: { topics: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.dailyFocus.findFirst({ where: { userId, date: todayMidnight } }),
  ])

  const todoItems: TodoItem[] = todos.map((t) => ({
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

  const projectItems: HomeProject[] = atRiskProjects.map((p) => ({
    id: p.id,
    name: p.name,
    phase: p.phase,
    status: p.status,
    attention: p.attention,
    blockers: p.blockers,
  }))

  const conversationItems: ConversationItem[] = conversations.map((c) => ({
    id: c.id,
    userId: c.userId,
    topic: c.topic,
    description: c.description,
    person: c.person,
    done: c.done,
    createdAt: c.createdAt.toISOString(),
  }))

  const designerItems: HomeDesigner[] = designers.map((d) => ({
    id: d.id,
    name: d.name,
    role: d.role,
    nextOneOnOne: d.nextOneOnOne ? d.nextOneOnOne.toISOString().split("T")[0] : null,
    openTopics: d.topics.filter((t) => !t.discussed).length,
    avatarClass: d.avatarClass,
  }))

  const focusItem: DailyFocusItem | null = dailyFocus
    ? {
        id: dailyFocus.id,
        userId: dailyFocus.userId,
        date: dailyFocus.date.toISOString().split("T")[0],
        text: dailyFocus.text,
      }
    : null

  return (
    <HomePageClient
      firstName={firstName}
      todos={todoItems}
      projects={projectItems}
      conversations={conversationItems}
      designers={designerItems}
      initialFocus={focusItem}
      todayStr={todayStr}
    />
  )
}
