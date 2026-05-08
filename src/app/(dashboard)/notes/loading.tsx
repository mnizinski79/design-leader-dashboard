import { Skeleton } from "@/components/ui/skeleton"

function NoteRowSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="px-4 py-3 border-b border-[#f0f0f5]">
      <Skeleton className={`h-3.5 ${wide ? "w-40" : "w-32"} mb-1.5`} />
      <Skeleton className="h-3 w-24 mb-1" />
      <div className="flex gap-1.5 mt-1">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  )
}

export default function NotesLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[#f0f0f5] pb-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] bg-white">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-[#f0f0f5] flex flex-col">
          {/* Search + add */}
          <div className="p-3 border-b border-[#f0f0f5] flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>

          {/* Filter row */}
          <div className="px-3 py-2 flex gap-2 border-b border-[#f0f0f5]">
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto">
            <NoteRowSkeleton wide />
            <NoteRowSkeleton />
            <NoteRowSkeleton wide />
            <NoteRowSkeleton />
            <NoteRowSkeleton wide />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <Skeleton className="h-6 w-64 mb-2" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}
