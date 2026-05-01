import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const currentUserId = session.user.id
  const { id, userId: targetUserId } = await params

  const task = await prisma.sharedTask.findFirst({ where: { id } })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (task.creatorId !== currentUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.sharedTaskShare.deleteMany({
    where: { sharedTaskId: id, userId: targetUserId },
  })

  return NextResponse.json({ ok: true })
}
