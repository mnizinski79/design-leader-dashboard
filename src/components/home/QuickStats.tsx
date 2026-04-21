interface Props {
  urgentCount: number
  overdueCount: number
  upcomingOneOnOneCount: number
  atRiskProjectCount: number
}

export function QuickStats({
  urgentCount,
  overdueCount,
  upcomingOneOnOneCount,
  atRiskProjectCount,
}: Props) {
  const stats = [
    { label: "Urgent tasks", value: urgentCount, bg: "bg-red-50", text: "text-red-600", icon: "🚨" },
    { label: "Overdue items", value: overdueCount, bg: "bg-amber-50", text: "text-amber-600", icon: "⏰" },
    { label: "Upcoming 1:1s", value: upcomingOneOnOneCount, bg: "bg-blue-50", text: "text-blue-600", icon: "👥" },
    { label: "At-risk projects", value: atRiskProjectCount, bg: "bg-orange-50", text: "text-orange-600", icon: "⚠️" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ label, value, bg, text, icon }) => (
        <div key={label} className={`${bg} ${text} rounded-xl p-4`}>
          <div className="text-2xl mb-1">{icon}</div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-xs font-medium mt-0.5 opacity-70">{label}</div>
        </div>
      ))}
    </div>
  )
}
