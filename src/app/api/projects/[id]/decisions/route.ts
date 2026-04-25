import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PostSchema = z.object({
  text: z.string().min(1).max(500),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const decision = await prisma.projectDecision.create({
    data: { projectId: params.id, text: parsed.data.text },
  })

  return NextResponse.json({ ...decision, createdAt: decision.createdAt.toISOString() }, { status: 201 })
}
