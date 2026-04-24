import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PatchSchema = z.object({ discussed: z.boolean() })

export async function PATCH(req: Request, { params }: { params: { id: string; topicId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  let topic
  try {
    topic = await prisma.designerTopic.update({
      where: { id: params.topicId, designerId: params.id },
      data: { discussed: parsed.data.discussed },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ...topic, createdAt: topic.createdAt.toISOString() })
}

export async function DELETE(req: Request, { params }: { params: { id: string; topicId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    await prisma.designerTopic.delete({ where: { id: params.topicId, designerId: params.id } })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
