import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const unreadSharedTaskCount = await prisma.sharedTaskShare.count({
    where: { userId: session.user.id, viewedAt: null },
  })

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar unreadSharedTaskCount={unreadSharedTaskCount} />
      <main className="flex-1 ml-60 p-8">
        {children}
      </main>
    </div>
  )
}
