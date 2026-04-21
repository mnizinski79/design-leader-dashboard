import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  topic: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  person: z.string().min(1).max(100),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id, done: false },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(
    conversations.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }))
  )
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

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      topic: parsed.data.topic,
      description: parsed.data.description ?? null,
      person: parsed.data.person,
    },
  })

  return NextResponse.json(
    { ...conversation, createdAt: conversation.createdAt.toISOString() },
    { status: 201 }
  )
}
