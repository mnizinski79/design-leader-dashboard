import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "./Sidebar"

export async function SidebarWithBadge() {
  const session = await auth()
  const userId = session?.user?.id
  const count = userId
    ? await prisma.sharedTaskShare.count({ where: { userId, viewedAt: null } })
    : 0
  return <Sidebar unreadSharedTaskCount={count} />
}
