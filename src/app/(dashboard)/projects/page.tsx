import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient"
import { ProjectItem } from "@/types"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [projects, designers] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        decisions: { orderBy: { createdAt: "desc" } },
        designers: {
          include: { designer: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.designer.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const serialized: ProjectItem[] = projects.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    phase: p.phase,
    status: p.status,
    description: p.description ?? null,
    dueDate: p.dueDate ? p.dueDate.toISOString().split("T")[0] : null,
    sprintSnapshot: p.sprintSnapshot ?? null,
    stakeholders: p.stakeholders ?? null,
    attention: p.attention ?? null,
    blockers: p.blockers ?? null,
    createdAt: p.createdAt.toISOString(),
    decisions: p.decisions.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      text: d.text,
      createdAt: d.createdAt.toISOString(),
    })),
    designers: p.designers.map((pd) => ({
      designerId: pd.designerId,
      designer: { id: pd.designer.id, name: pd.designer.name },
    })),
  }))

  return (
    <div className="h-full flex flex-col">
      <ProjectsPageClient initialProjects={serialized} allDesigners={designers} />
    </div>
  )
}
