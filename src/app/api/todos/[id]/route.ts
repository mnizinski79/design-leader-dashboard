import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().min(1).max(100).optional(),
  status: z.enum(["TODO", "INPROGRESS", "AWAITING", "COMPLETE"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  urgent: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const todo = await prisma.todo.findUnique({ where: { id: params.id } })
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (todo.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { dueDate, ...rest } = parsed.data
  const updated = await prisma.todo.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
  })

  return NextResponse.json({
    ...updated,
    dueDate: updated.dueDate ? updated.dueDate.toISOString().split("T")[0] : null,
    createdAt: updated.createdAt.toISOString(),
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const todo = await prisma.todo.findUnique({ where: { id: params.id } })
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (todo.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.todo.delete({ where: { id: params.id } })

  return new NextResponse(null, { status: 204 })
}
