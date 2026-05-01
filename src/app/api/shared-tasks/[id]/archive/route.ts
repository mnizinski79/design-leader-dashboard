import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const task = await prisma.sharedTask.findFirst({
    where: {
      id,
      OR: [{ creatorId: userId }, { shares: { some: { userId } } }],
    },
  })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (task.status !== "PICKED_UP") {
    return NextResponse.json({ error: "Only picked-up tasks can be archived" }, { status: 409 })
  }

  await prisma.sharedTask.update({ where: { id }, data: { status: "ARCHIVED" } })
  return NextResponse.json({ ok: true })
}
