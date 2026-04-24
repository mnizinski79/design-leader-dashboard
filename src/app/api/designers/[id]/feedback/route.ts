import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PostSchema = z.object({
  sourceName: z.string().min(1).max(100),
  date: z.string().min(1),
  body: z.string().min(1),
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

  const fb = await prisma.designerFeedback.create({
    data: {
      designerId: params.id,
      sourceName: parsed.data.sourceName,
      date: new Date(parsed.data.date),
      body: parsed.data.body,
    },
  })

  return NextResponse.json(
    { ...fb, date: fb.date.toISOString().split("T")[0], createdAt: fb.createdAt.toISOString() },
    { status: 201 }
  )
}
