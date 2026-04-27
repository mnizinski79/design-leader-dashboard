import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PlanSchema = z.object({
  quarter: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  quarterFocus: z.string(),
  developmentPriorities: z.string(),
  coachingApproach: z.string(),
  keyMilestones: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

async function getAuthorizedDesigner(id: string, userId: string) {
  const designer = await prisma.designer.findUnique({ where: { id } })
  if (!designer) return null
  if (designer.userId !== userId) return null
  return designer
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await getAuthorizedDesigner(params.id, session.user.id)
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = PlanSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const updated = await prisma.designer.update({
    where: { id: params.id },
    data: { ninetyDayPlan: parsed.data },
    select: { ninetyDayPlan: true },
  })

  return NextResponse.json({ ninetyDayPlan: updated.ninetyDayPlan })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await getAuthorizedDesigner(params.id, session.user.id)
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.designer.update({
    where: { id: params.id },
    data: { ninetyDayPlan: Prisma.JsonNull },
  })

  return NextResponse.json({ ok: true })
}
