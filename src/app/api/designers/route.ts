import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AVATAR_CLASSES } from "@/components/coaching/lib/coaching-framework"

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
    goals: d.goals.map((g: any) => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
    })),
    feedback: d.feedback.map((f: any) => ({
      ...f,
      date: f.date.toISOString().split("T")[0],
      createdAt: f.createdAt.toISOString(),
    })),
    topics: d.topics.map((t: any) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    notes: d.notes.map((n: any) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  }
}

export async function GET(_req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designers = await prisma.designer.findMany({
    where: { userId: session.user.id },
    include: INCLUDE_ALL,
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(designers.map(serialize))
}

const PostSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  personType: z.enum(["DIRECT", "LEADERSHIP", "PEER"]).default("DIRECT"),
  roleLevel: z.string().max(100).optional(),
  dreyfusStage: z.enum(["NOVICE", "ADVANCED_BEGINNER", "COMPETENT", "PROFICIENT", "EXPERT"]).optional(),
  avatarClass: z.enum(["av-blue", "av-purple", "av-teal", "av-pink", "av-amber", "av-green"]).optional(),
  nextOneOnOne: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const count = await prisma.designer.count({ where: { userId: session.user.id } })
  const avatarClass = parsed.data.avatarClass ?? AVATAR_CLASSES[count % AVATAR_CLASSES.length]

  const designer = await prisma.designer.create({
    data: {
      userId: session.user.id,
      personType: parsed.data.personType,
      name: parsed.data.name,
      role: parsed.data.role,
      roleLevel: parsed.data.personType === "DIRECT" ? (parsed.data.roleLevel ?? "") : "",
      dreyfusStage: parsed.data.personType === "DIRECT" ? (parsed.data.dreyfusStage ?? null) : null,
      avatarClass,
      ...(parsed.data.nextOneOnOne && {
        nextOneOnOne: new Date(parsed.data.nextOneOnOne + "T00:00:00"),
      }),
    },
    include: INCLUDE_ALL,
  })

  return NextResponse.json(serialize(designer), { status: 201 })
}
