import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const addSchema = z.object({ email: z.string().email() })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const task = await prisma.sharedTask.findFirst({ where: { id } })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (task.creatorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const recipient = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  })
  if (!recipient) {
    return NextResponse.json(
      { error: `No account found for ${parsed.data.email}` },
      { status: 422 }
    )
  }

  const share = await prisma.sharedTaskShare.create({
    data: { sharedTaskId: id, userId: recipient.id },
    include: { user: { select: { id: true, email: true } } },
  })

  return NextResponse.json({
    id: share.id,
    userId: share.userId,
    userEmail: share.user.email,
    viewedAt: null,
    createdAt: share.createdAt.toISOString(),
  }, { status: 201 })
}
