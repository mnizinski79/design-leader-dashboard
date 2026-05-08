import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TeamPageClient } from "@/components/team/TeamPageClient"
import type { DesignerItem, NinetyDayPlan } from "@/types"

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const designers = await prisma.designer.findMany({
    where: { userId: session.user.id },
    include: {
      skills: true,
      sessions: { orderBy: { date: "desc" } },
      goals: { orderBy: { createdAt: "desc" } },
      feedback: { orderBy: { date: "desc" } },
      topics: { orderBy: { createdAt: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { sortOrder: "asc" },
  })

  const serialized: DesignerItem[] = designers.map((d) => ({
    id: d.id,
    userId: d.userId,
    personType: d.personType as DesignerItem["personType"],
    name: d.name,
    role: d.role,
    roleLevel: d.roleLevel,
    dreyfusStage: d.dreyfusStage ?? null,
    avatarClass: d.avatarClass,
    nextOneOnOne: d.nextOneOnOne ? d.nextOneOnOne.toISOString().split("T")[0] : null,
    createdAt: d.createdAt.toISOString(),
    ninetyDayPlan: (d.ninetyDayPlan as NinetyDayPlan | null) ?? null,
    skills: d.skills.map((s) => ({ id: s.id, skillName: s.skillName, value: s.value })),
    sessions: d.sessions.map((s) => ({
      id: s.id,
      designerId: s.designerId,
      date: s.date.toISOString().split("T")[0],
      notes: s.notes,
      flag: s.flag ?? null,
      summary: s.summary ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    goals: d.goals.map((g) => ({
      id: g.id,
      designerId: g.designerId,
      title: g.title,
      description: g.description ?? null,
      meetsCriteria: g.meetsCriteria ?? null,
      exceedsCriteria: g.exceedsCriteria ?? null,
      timeline: g.timeline,
      status: g.status,
      createdAt: g.createdAt.toISOString(),
    })),
    feedback: d.feedback.map((f) => ({
      id: f.id,
      designerId: f.designerId,
      sourceName: f.sourceName,
      date: f.date.toISOString().split("T")[0],
      body: f.body,
      createdAt: f.createdAt.toISOString(),
    })),
    topics: d.topics.map((t) => ({
      id: t.id,
      designerId: t.designerId,
      title: t.title,
      discussed: t.discussed,
      createdAt: t.createdAt.toISOString(),
    })),
    notes: d.notes.map((n) => ({
      id: n.id,
      designerId: n.designerId,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  }))

  return <TeamPageClient initialDesigners={serialized} />
}
