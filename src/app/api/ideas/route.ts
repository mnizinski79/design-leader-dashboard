import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
})

function serializeIdea(i: { id: string; userId: string; title: string; category: string; createdAt: Date }) {
  return { ...i, createdAt: i.createdAt.toISOString() }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const category = url.searchParams.get("category")

  const ideas = await prisma.idea.findMany({
    where: { userId: session.user.id, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(ideas.map(serializeIdea))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const idea = await prisma.idea.create({
    data: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json(serializeIdea(idea), { status: 201 })
}
