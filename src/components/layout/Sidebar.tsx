"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: "⌂" },
  { href: "/todos", label: "To-Do", icon: "✓" },
  { href: "/notes", label: "Notes & Ideas", icon: "✎" },
  { href: "/coaching", label: "1:1 & Coaching", icon: "◈" },
  { href: "/projects", label: "Projects", icon: "◻" },
  { href: "/team", label: "My Team", icon: "◉" },
]

export function Sidebar() {
  const pathname = usePathname()

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
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <span>↩</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
