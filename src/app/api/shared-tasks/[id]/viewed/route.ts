import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  await prisma.sharedTaskShare.updateMany({
    where: { sharedTaskId: id, userId, viewedAt: null },
    data: { viewedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
