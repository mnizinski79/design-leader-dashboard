import { Skeleton } from "@/components/ui/skeleton"

export default function TeamLoading() {
  return (
    <div className="flex-1 overflow-y-auto pb-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-28 mb-1.5" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[32px_1fr_1fr_140px_100px_60px_120px] gap-0 border-b border-[#f0f0f5] px-4 py-3">
          <div />
          {["w-16", "w-10", "w-24", "w-14", "w-16", "w-0"].map((w, i) => (
            <Skeleton key={i} className={`h-2.5 ${w}`} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={[
              "grid grid-cols-[32px_1fr_1fr_140px_100px_60px_120px] gap-0 items-center px-4 py-3.5",
              i < 4 ? "border-b border-[#f0f0f5]" : "",
            ].join(" ")}
          >
            {/* Drag handle */}
            <Skeleton className="h-4 w-4 mx-auto" />

            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div>
                <Skeleton className="h-3.5 w-24 mb-1.5" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Role */}
            <Skeleton className="h-3.5 w-32" />

            {/* Dreyfus */}
            <Skeleton className="h-3.5 w-20" />

            {/* Next 1:1 */}
            <Skeleton className="h-3.5 w-16" />

            {/* Sessions */}
            <Skeleton className="h-3.5 w-5" />

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
