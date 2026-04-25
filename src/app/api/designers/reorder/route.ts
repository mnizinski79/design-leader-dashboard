import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ReorderSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = ReorderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // Verify all designers belong to this user
  const designers = await prisma.designer.findMany({
    where: { id: { in: parsed.data.ids }, userId: session.user.id },
    select: { id: true },
  })
  if (designers.length !== parsed.data.ids.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Update sortOrder for each designer in parallel
  await Promise.all(
    parsed.data.ids.map((id, index) =>
      prisma.designer.update({ where: { id }, data: { sortOrder: index } })
    )
  )

  return NextResponse.json({ ok: true })
}
