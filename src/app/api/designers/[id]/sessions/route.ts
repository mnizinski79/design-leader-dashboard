import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PostSchema = z.object({
  date: z.string().min(1),
  notes: z.string().min(1),
  flag: z.enum(["POSITIVE", "DEVELOPMENT", "COACHING", "FOLLOWUP"]).optional(),
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

  const s = await prisma.designerSession.create({
    data: {
      designerId: params.id,
      date: new Date(parsed.data.date),
      notes: parsed.data.notes,
      flag: parsed.data.flag ?? null,
    },
  })

  return NextResponse.json(
    { ...s, date: s.date.toISOString().split("T")[0], createdAt: s.createdAt.toISOString() },
    { status: 201 }
  )
}
