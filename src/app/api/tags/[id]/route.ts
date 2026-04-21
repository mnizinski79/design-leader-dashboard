import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tag = await prisma.noteTag.findUnique({ where: { id: params.id } })
  if (!tag) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  if (tag.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.noteTag.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
