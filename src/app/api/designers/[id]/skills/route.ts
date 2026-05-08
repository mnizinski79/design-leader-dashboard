import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SkillSchema = z.object({
  skillName: z.string().min(1),
  value: z.number().int().min(0).max(9),
})

const PutSchema = z.object({
  skills: z.array(SkillSchema).min(1).max(20),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const designer = await prisma.designer.findUnique({ where: { id: params.id } })
  if (!designer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (designer.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PutSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const skills = await prisma.$transaction(
    parsed.data.skills.map(s =>
      prisma.designerSkill.upsert({
        where: { designerId_skillName: { designerId: params.id, skillName: s.skillName } },
        update: { value: s.value },
        create: { designerId: params.id, skillName: s.skillName, value: s.value },
      })
    )
  )

  return NextResponse.json(skills)
}
