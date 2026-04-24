import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PatchSchema = z.object({
  dreyfusStage: z.enum(["NOVICE", "ADVANCED_BEGINNER", "COMPETENT", "PROFICIENT", "EXPERT"]).optional(),
  nextOneOnOne: z.string().nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const updated = await prisma.designer.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.dreyfusStage !== undefined && { dreyfusStage: parsed.data.dreyfusStage }),
      ...(parsed.data.nextOneOnOne !== undefined && {
        nextOneOnOne: parsed.data.nextOneOnOne ? new Date(parsed.data.nextOneOnOne) : null,
      }),
    },
  })

  return NextResponse.json({
    ...updated,
    nextOneOnOne: updated.nextOneOnOne ? updated.nextOneOnOne.toISOString().split("T")[0] : null,
    createdAt: updated.createdAt.toISOString(),
  })
}
