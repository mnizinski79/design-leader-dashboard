import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const upsertSchema = z.object({
  text: z.string().min(1).max(500),
})

function todayStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const focus = await prisma.dailyFocus.findFirst({
    where: { userId: session.user.id, date: todayStart() },
  })

  if (!focus) return NextResponse.json(null)

  return NextResponse.json({ ...focus, date: focus.date.toISOString().split("T")[0] })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const today = todayStart()
  const focus = await prisma.dailyFocus.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: { userId: session.user.id, date: today, text: parsed.data.text },
    update: { text: parsed.data.text },
  })

  return NextResponse.json({ ...focus, date: focus.date.toISOString().split("T")[0] })
}
