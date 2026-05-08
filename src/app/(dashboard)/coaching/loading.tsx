import { Skeleton } from "@/components/ui/skeleton"

const AVATAR_COLORS = ["#0071E3", "#7C3AED", "#0D9488", "#DB2777", "#D97706"]

function DesignerRowSkeleton({ avatarColor, selected = false }: { avatarColor: string; selected?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f5] ${selected ? "bg-blue-50" : ""}`}>
      <div
        className="w-8 h-8 rounded-full flex-shrink-0"
        style={{ background: avatarColor, opacity: 0.3 }}
      />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-24 mb-1.5" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export default function CoachingLoading() {
  const TABS = ["Skills", "Sessions", "Goals", "Feedback", "Topics", "Notes"]

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Left: Designer list */}
        <div className="w-64 flex-shrink-0 bg-white border-r border-[#f0f0f5] flex flex-col rounded-l-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          {/* List header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f5]">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>

          {/* Designer rows */}
          {AVATAR_COLORS.map((color, i) => (
            <DesignerRowSkeleton key={i} avatarColor={color} selected={i === 0} />
          ))}
        </div>

        {/* Right: Coaching panel */}
        <div className="flex-1 bg-white rounded-r-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-[#f0f0f5]">
            <div
              className="w-10 h-10 rounded-full flex-shrink-0"
              style={{ background: AVATAR_COLORS[0], opacity: 0.3 }}
            />
            <div>
              <Skeleton className="h-5 w-32 mb-1.5" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <div className="flex gap-2 ml-auto">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-[#f0f0f5] px-6">
            {TABS.map((tab) => (
              <div key={tab} className="px-4 py-3">
                <Skeleton className="h-3.5 w-12" />
              </div>
            ))}
          </div>

          {/* Tab content — Skills tab approximation */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3.5 w-32 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <Skeleton
                        className="h-full rounded-full"
                        style={{ width: `${40 + (i % 3) * 20}%` }}
                      />
                    </div>
                    <Skeleton className="h-3.5 w-6 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="bg-slate-50 rounded-xl p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#f0f0f5] last:border-0">
                    <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
