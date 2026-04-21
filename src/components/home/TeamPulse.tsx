import Link from "next/link"
import { type DesignerForPulse } from "@/types"

interface Props {
  designers: DesignerForPulse[]
}

function get1on1Status(nextOneOnOne: string | null) {
  if (!nextOneOnOne) return { label: "No date set", classes: "bg-slate-100 text-slate-500" }
  const date = new Date(nextOneOnOne + "T00:00:00")
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round(
    (date.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 0) return { label: "Overdue", classes: "bg-red-100 text-red-700" }
  if (diffDays === 0) return { label: "Today", classes: "bg-green-100 text-green-700" }
  if (diffDays <= 7) return { label: `In ${diffDays}d`, classes: "bg-blue-100 text-blue-700" }
  return { label: `In ${diffDays}d`, classes: "bg-slate-100 text-slate-600" }
}

export function TeamPulse({ designers }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-800 mb-4">Team Pulse</h2>
      {designers.length === 0 ? (
        <p className="text-sm text-slate-400">
          No team members yet.{" "}
          <Link href="/team" className="text-blue-600 hover:underline">
            Add designers →
          </Link>
        </p>
      ) : (
        <div className="space-y-2.5">
          {designers.map(d => {
            const { label, classes } = get1on1Status(d.nextOneOnOne)
            return (
              <div key={d.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                    {d.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                    <p className="text-xs text-slate-400 truncate">{d.role}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${classes}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
