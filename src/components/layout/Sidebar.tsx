"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Home,
  ListTodo,
  NotebookPen,
  UserCheck,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Share2,
  type LucideIcon,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

interface SidebarProps {
  unreadSharedTaskCount?: number
}

export function Sidebar({ unreadSharedTaskCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  const NAV_ITEMS: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/todos", label: "To-Do", icon: ListTodo },
    { href: "/shared-tasks", label: "Shared Tasks", icon: Share2, badge: unreadSharedTaskCount },
    { href: "/team", label: "My Team", icon: Users },
    { href: "/coaching", label: "1:1 & Coaching", icon: UserCheck },
    { href: "/notes", label: "Notes & Ideas", icon: NotebookPen },
  ]

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Design Leader</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5">Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="bg-blue-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <Link
          href="/account"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname.startsWith("/account")
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings size={16} />
          Account
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
