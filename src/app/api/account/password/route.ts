import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth, BCRYPT_ROUNDS } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } })

  return NextResponse.json({ ok: true })
}
