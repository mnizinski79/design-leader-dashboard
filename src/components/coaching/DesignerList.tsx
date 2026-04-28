"use client"

import { cn } from "@/lib/utils"
import { DesignerItem, DreyfusStage } from "@/types"
import { DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"

interface Props {
  designers: DesignerItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const AVATAR_BG: Record<string, string> = {
  "av-blue":   "#0071E3",
  "av-purple": "#7C3AED",
  "av-teal":   "#0D9488",
  "av-pink":   "#DB2777",
  "av-amber":  "#D97706",
  "av-green":  "#1D7A1D",
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
    <div className="w-64 shrink-0 flex flex-col h-full bg-[#f5f5f7]">
      <div className="flex-1 overflow-y-auto p-3">
        {designers.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 text-center">No designers yet</p>
        )}
        {designers.map((d) => {
          const isSelected = d.id === selectedId
          const initials = d.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
          const pendingTopics = (d.topics ?? []).filter(t => !t.discussed).length

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className={cn(
                "w-full text-left p-3 mb-2 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-transparent flex items-center gap-3 hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all",
                isSelected && "bg-[#EFF6FF] border-[#93C5FD]"
              )}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white"
                style={{ background: AVATAR_BG[d.avatarClass] ?? "#0071E3" }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground truncate">{d.role}</p>
                {d.dreyfusStage && (
                  <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-0.5 ${STAGE_COLORS[d.dreyfusStage]}`}>
                    {DREYFUS_LABELS[d.dreyfusStage]}
                  </span>
                )}
              </div>
              {(d.nextOneOnOne || pendingTopics > 0) && (
                <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                  {d.nextOneOnOne && (
                    <span className="text-[10px] text-slate-400">{d.nextOneOnOne}</span>
                  )}
                  {pendingTopics > 0 && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      {pendingTopics} topic{pendingTopics > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
