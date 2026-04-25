import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const INCLUDE_ALL = {
  decisions: { orderBy: { createdAt: "desc" as const } },
  designers: {
    include: { designer: { select: { id: true, name: true } } },
  },
}

function serialize(p: any) {
  return {
    ...p,
    dueDate: p.dueDate ? p.dueDate.toISOString().split("T")[0] : null,
    createdAt: p.createdAt.toISOString(),
    decisions: p.decisions.map((d: any) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
  }
}

export async function GET(_req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: INCLUDE_ALL,
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(projects.map(serialize))
}

const PostSchema = z.object({
  name: z.string().min(1).max(200),
  phase: z.enum(["DISCOVERY", "DESIGN", "DEV_HANDOFF", "IN_DEVELOPMENT", "LIVE", "ON_HOLD"]).optional(),
  status: z.enum(["ON_TRACK", "AT_RISK", "BLOCKED", "COMPLETE"]).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sprintSnapshot: z.string().nullable().optional(),
  stakeholders: z.string().nullable().optional(),
  attention: z.string().nullable().optional(),
  blockers: z.string().nullable().optional(),
  designerIds: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { designerIds, dueDate, ...rest } = parsed.data

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: rest.name,
      phase: rest.phase ?? "DISCOVERY",
      status: rest.status ?? "ON_TRACK",
      description: rest.description ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      sprintSnapshot: rest.sprintSnapshot ?? null,
      stakeholders: rest.stakeholders ?? null,
      attention: rest.attention ?? null,
      blockers: rest.blockers ?? null,
      designers: designerIds?.length
        ? { create: designerIds.map((id) => ({ designerId: id })) }
        : undefined,
    },
    include: INCLUDE_ALL,
  })

  return NextResponse.json(serialize(project), { status: 201 })
}
