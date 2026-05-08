import { Skeleton } from "@/components/ui/skeleton"

function KanbanCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 mb-2">
      <Skeleton className="h-3.5 w-5/6 mb-2" />
      <Skeleton className="h-3.5 w-2/3 mb-3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  )
}

function KanbanColumnSkeleton({ title, cardCount }: { title: string; cardCount: number }) {
  return (
    <div className="flex flex-col min-w-0 flex-1">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>

      {/* Cards */}
      {Array.from({ length: cardCount }).map((_, i) => (
        <KanbanCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default function TodosLoading() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-4rem)] max-w-5xl">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-20 mb-1.5" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        <KanbanColumnSkeleton title="To Do" cardCount={3} />
        <KanbanColumnSkeleton title="In Progress" cardCount={2} />
        <KanbanColumnSkeleton title="Awaiting" cardCount={1} />
        <KanbanColumnSkeleton title="Done" cardCount={2} />
      </div>
    </div>
  )
}
