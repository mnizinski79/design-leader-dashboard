import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CoachingPageClient } from "@/components/coaching/CoachingPageClient"
import { DesignerItem } from "@/types"

export default async function CoachingPage() {
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
    orderBy: { createdAt: "asc" },
  })

  const serialized: DesignerItem[] = designers.map((d) => ({
    ...d,
    dreyfusStage: d.dreyfusStage ?? null,
    nextOneOnOne: d.nextOneOnOne ? d.nextOneOnOne.toISOString().split("T")[0] : null,
    createdAt: d.createdAt.toISOString(),
    skills: d.skills.map((s) => ({
      id: s.id,
      skillName: s.skillName,
      value: s.value,
    })),
    sessions: d.sessions.map((s) => ({
      ...s,
      date: s.date.toISOString().split("T")[0],
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
      ...f,
      date: f.date.toISOString().split("T")[0],
      createdAt: f.createdAt.toISOString(),
    })),
    topics: d.topics.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    notes: d.notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  }))

  return (
    <div className="h-full flex flex-col">
      <Suspense>
        <CoachingPageClient initialDesigners={serialized} />
      </Suspense>
    </div>
  )
}
