"use client"

import { DesignerItem, DreyfusStage } from "@/types"
import { DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"

interface Props {
  designers: DesignerItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const STAGE_COLORS: Record<DreyfusStage, string> = {
  NOVICE: "bg-slate-100 text-slate-600",
  ADVANCED_BEGINNER: "bg-blue-100 text-blue-700",
  COMPETENT: "bg-green-100 text-green-700",
  PROFICIENT: "bg-purple-100 text-purple-700",
  EXPERT: "bg-amber-100 text-amber-700",
}

export function DesignerList({ designers, selectedId, onSelect }: Props) {
  return (
    <div className="w-64 shrink-0 border-r flex flex-col h-full">

      <div className="flex-1 overflow-y-auto">
        {designers.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 text-center">No designers yet</p>
        )}
        {designers.map((d) => {
          const isSelected = d.id === selectedId
          const initials = d.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-slate-100 transition-colors border-b border-slate-200 border-l-2 ${
                isSelected ? "border-l-blue-600 bg-blue-50" : "border-l-transparent"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${d.avatarClass}`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground truncate">{d.role}</p>
                {d.dreyfusStage && (
                  <span
                    className={`inline-block text-xs px-1.5 py-0.5 rounded mt-0.5 ${STAGE_COLORS[d.dreyfusStage]}`}
                  >
                    {DREYFUS_LABELS[d.dreyfusStage]}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
