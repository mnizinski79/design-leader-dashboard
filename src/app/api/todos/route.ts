import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().min(1).max(100),
  status: z.enum(["TODO", "INPROGRESS", "AWAITING", "COMPLETE"]).default("TODO"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  urgent: z.boolean().default(false),
})

function serializeTodo(t: {
  id: string; userId: string; title: string; description: string | null
  category: string; status: string; dueDate: Date | null; urgent: boolean
  sortOrder: number; createdAt: Date
}) {
  return {
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
    createdAt: t.createdAt.toISOString(),
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(todos.map(serializeTodo))
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

  const { title, description, category, status, dueDate, urgent } = parsed.data

  const maxOrder = await prisma.todo.aggregate({
    where: { userId: session.user.id, status },
    _max: { sortOrder: true },
  })

  const todo = await prisma.todo.create({
    data: {
      userId: session.user.id,
      title,
      description: description ?? null,
      category,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      urgent,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json(serializeTodo(todo), { status: 201 })
}
