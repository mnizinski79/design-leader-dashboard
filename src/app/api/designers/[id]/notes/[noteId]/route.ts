import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PatchSchema = z.object({ body: z.string() })

export async function PATCH(req: Request, { params }: { params: { id: string; noteId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const note = await prisma.designerNote.update({
    where: { id: params.noteId },
    data: { body: parsed.data.body },
  })

  return NextResponse.json({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  })
}

export async function DELETE(req: Request, { params }: { params: { id: string; noteId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.designerNote.delete({ where: { id: params.noteId } })
  return new NextResponse(null, { status: 204 })
}
