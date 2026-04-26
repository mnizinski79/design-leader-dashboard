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

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phase: z.enum(["DISCOVERY", "DESIGN", "DEV_HANDOFF", "IN_DEVELOPMENT", "LIVE", "ON_HOLD"]).optional(),
  status: z.enum(["ON_TRACK", "AT_RISK", "BLOCKED", "COMPLETE"]).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sprintSnapshot: z.string().nullable().optional(),
  stakeholders: z.string().nullable().optional(),
  attention: z.string().nullable().optional(),
  blockers: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  designerIds: z.array(z.string()).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { designerIds, dueDate, ...rest } = parsed.data

  if (designerIds !== undefined) {
    await prisma.projectDesigner.deleteMany({ where: { projectId: params.id } })
    if (designerIds.length > 0) {
      await prisma.projectDesigner.createMany({
        data: designerIds.map((did) => ({ projectId: params.id, designerId: did })),
      })
    }
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: INCLUDE_ALL,
  })

  return NextResponse.json(serialize(updated))
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
