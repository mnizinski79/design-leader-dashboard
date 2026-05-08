import { Skeleton } from "@/components/ui/skeleton"

function SharedTaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-4">
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full mb-1.5" />
      <Skeleton className="h-3.5 w-3/4 mb-4" />
      <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f5]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  )
}

export default function SharedTasksLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header + filters */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36 mb-1.5" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Task cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SharedTaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
