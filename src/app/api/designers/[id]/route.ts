import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const INCLUDE_ALL = {
  skills: true,
  sessions: { orderBy: { date: "desc" as const } },
  goals: { orderBy: { createdAt: "desc" as const } },
  feedback: { orderBy: { date: "desc" as const } },
  topics: { orderBy: { createdAt: "asc" as const } },
  notes: { orderBy: { createdAt: "desc" as const } },
}

function serialize(d: any) {
  return {
    ...d,
    nextOneOnOne: d.nextOneOnOne ? d.nextOneOnOne.toISOString().split("T")[0] : null,
    createdAt: d.createdAt.toISOString(),
    sessions: d.sessions.map((s: any) => ({
      ...s,
      date: s.date.toISOString().split("T")[0],
      createdAt: s.createdAt.toISOString(),
    })),
    goals: d.goals.map((g: any) => ({ ...g, createdAt: g.createdAt.toISOString() })),
    feedback: d.feedback.map((f: any) => ({
      ...f,
      date: f.date.toISOString().split("T")[0],
      createdAt: f.createdAt.toISOString(),
    })),
    topics: d.topics.map((t: any) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    notes: d.notes.map((n: any) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  }
}

const AVATAR_CLASSES = ["av-blue", "av-purple", "av-teal", "av-pink", "av-amber", "av-green"]

const PatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  personType: z.enum(["DIRECT", "LEADERSHIP", "PEER"]).optional(),
  roleLevel: z.string().max(100).optional(),
  avatarClass: z.enum(["av-blue", "av-purple", "av-teal", "av-pink", "av-amber", "av-green"]).optional(),
  dreyfusStage: z.enum(["NOVICE", "ADVANCED_BEGINNER", "COMPETENT", "PROFICIENT", "EXPERT"]).nullable().optional(),
  nextOneOnOne: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  features: z.record(z.unknown()).optional(),
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

  const { nextOneOnOne, features, ...rest } = parsed.data

  const updated = await prisma.designer.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(features !== undefined && { features: features as any }),
      ...(nextOneOnOne !== undefined && {
        nextOneOnOne: nextOneOnOne ? new Date(nextOneOnOne + "T00:00:00") : null,
      }),
    },
    include: INCLUDE_ALL,
  })

  return NextResponse.json(serialize(updated))
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.designer.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
