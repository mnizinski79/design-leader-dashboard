import { Skeleton } from "@/components/ui/skeleton"

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  )
}

function CardHeader({ titleWidth = "w-32" }: { titleWidth?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <Skeleton className={`h-4 ${titleWidth}`} />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

function RowItem() {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#f0f0f5] last:border-0">
      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-20 rounded-full" />
      </div>
    </div>
  )
}

export default function HomeLoading() {
  return (
    <div className="flex-1 overflow-y-auto max-w-5xl">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg mt-1" />
      </div>

      {/* Focus card */}
      <div
        className="rounded-xl p-5 mb-5 border"
        style={{
          background: "linear-gradient(135deg, #E8F4FD 0%, #EDE8FB 50%, #FDE8F4 100%)",
          borderColor: "rgba(0,113,227,0.12)",
        }}
      >
        <Skeleton className="h-2.5 w-20 mb-3" />
        <Skeleton className="h-5 w-3/4 mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full ml-auto" />
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div>
          {/* Top priorities */}
          <CardShell>
            <CardHeader titleWidth="w-28" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-[#f0f0f5] last:border-0">
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-4/5 mb-1.5" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </CardShell>

          {/* Projects */}
          <CardShell>
            <CardHeader titleWidth="w-48" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#f0f0f5] last:border-0">
                <Skeleton className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-40 mb-1.5" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </CardShell>

          {/* Conversations */}
          <CardShell>
            <CardHeader titleWidth="w-40" />
            {[1, 2].map((i) => <RowItem key={i} />)}
          </CardShell>
        </div>

        {/* Right column */}
        <div>
          {/* Team pulse */}
          <CardShell>
            <CardHeader titleWidth="w-24" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#f0f0f5] last:border-0">
                <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-28 mb-1.5" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-12 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </CardShell>

          {/* Open tasks */}
          <CardShell>
            <CardHeader titleWidth="w-24" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-[#f0f0f5] last:border-0">
                <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                  <Skeleton className="h-3.5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </CardShell>
        </div>
      </div>
    </div>
  )
}
