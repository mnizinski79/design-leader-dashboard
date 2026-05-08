import { Skeleton } from "@/components/ui/skeleton"

export default function AccountLoading() {
  return (
    <div className="max-w-lg">
      <Skeleton className="h-8 w-28 mb-1.5" />
      <Skeleton className="h-4 w-48 mb-8" />

      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 space-y-5">
        {/* Name field */}
        <div>
          <Skeleton className="h-3.5 w-16 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Email field */}
        <div>
          <Skeleton className="h-3.5 w-12 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Password section */}
        <div className="pt-2 border-t border-[#f0f0f5]">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3.5 w-32 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-3.5 w-36 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
