import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conv = await prisma.conversation.findUnique({ where: { id: params.id } })
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (conv.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data: { done: true },
  })

  return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conv = await prisma.conversation.findUnique({ where: { id: params.id } })
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (conv.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.conversation.delete({ where: { id: params.id } })

  return new NextResponse(null, { status: 204 })
}
