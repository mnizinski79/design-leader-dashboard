import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PatchSchema = z.object({ status: z.enum(["ON_TRACK", "AT_RISK", "COMPLETE"]) })

export async function PATCH(req: Request, { params }: { params: { id: string; goalId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const goal = await prisma.designerGoal.update({
    where: { id: params.goalId },
    data: { status: parsed.data.status },
  })

  return NextResponse.json({ ...goal, createdAt: goal.createdAt.toISOString() })
}

export async function DELETE(req: Request, { params }: { params: { id: string; goalId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.designerGoal.delete({ where: { id: params.goalId } })
  return new NextResponse(null, { status: 204 })
}
