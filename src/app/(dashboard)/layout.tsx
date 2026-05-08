import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { SidebarWithBadge } from "@/components/layout/SidebarWithBadge"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={<Sidebar />}>
        <SidebarWithBadge />
      </Suspense>
      <main className="flex-1 ml-60 p-8">
        {children}
      </main>
    </div>
  )
}
