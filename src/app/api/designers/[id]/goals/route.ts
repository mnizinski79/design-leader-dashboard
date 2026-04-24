import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PostSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  meetsCriteria: z.string().optional(),
  exceedsCriteria: z.string().optional(),
  timeline: z.string().min(1).max(100),
  status: z.enum(["ON_TRACK", "AT_RISK", "COMPLETE"]).optional(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const goal = await prisma.designerGoal.create({
    data: {
      designerId: params.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      meetsCriteria: parsed.data.meetsCriteria ?? null,
      exceedsCriteria: parsed.data.exceedsCriteria ?? null,
      timeline: parsed.data.timeline,
      status: parsed.data.status ?? "ON_TRACK",
    },
  })

  return NextResponse.json({ ...goal, createdAt: goal.createdAt.toISOString() }, { status: 201 })
}
