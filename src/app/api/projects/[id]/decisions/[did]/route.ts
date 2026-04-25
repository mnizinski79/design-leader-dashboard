import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; did: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const decision = await prisma.projectDecision.findUnique({
    where: { id: params.did },
    include: { project: { select: { userId: true } } },
  })
  if (!decision) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (decision.project.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.projectDecision.delete({ where: { id: params.did } })
  return NextResponse.json({ ok: true })
}
