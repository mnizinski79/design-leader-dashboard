import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500).refine(
    arr => new Set(arr).size === arr.length,
    { message: "ids must be unique" }
  ),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { ids } = parsed.data

  const owned = await prisma.todo.findMany({
    where: { id: { in: ids }, userId: session.user.id },
    select: { id: true },
  })
  if (owned.length !== ids.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.todo.update({ where: { id }, data: { sortOrder: index } })
    )
  )

  return new NextResponse(null, { status: 204 })
}
