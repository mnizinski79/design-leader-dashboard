import { Skeleton } from "@/components/ui/skeleton"

function ProjectCardSkeleton({ statusWidth }: { statusWidth: string }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className={`h-5 ${statusWidth} rounded-full`} />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <Skeleton className="h-7 w-12 rounded-lg" />
          <Skeleton className="h-7 w-14 rounded-lg" />
        </div>
      </div>

      {/* Description */}
      <Skeleton className="h-3.5 w-full mb-1.5" />
      <Skeleton className="h-3.5 w-5/6 mb-4" />

      {/* Footer row */}
      <div className="flex items-center gap-3 pt-3 border-t border-[#f0f0f5]">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  )
}

export default function ProjectsLoading() {
  const statusWidths = ["w-16", "w-14", "w-16", "w-20"]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-28 mb-1.5" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Project cards */}
      <div className="space-y-3">
        {statusWidths.map((w, i) => (
          <ProjectCardSkeleton key={i} statusWidth={w} />
        ))}
      </div>
    </div>
  )
}
