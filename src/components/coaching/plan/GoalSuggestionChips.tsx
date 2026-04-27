"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { DesignerGoalItem } from "@/types"

interface SuggestedGoal {
  title: string
  timeline: string
}

interface Props {
  goals: SuggestedGoal[]
  onAdd: (data: { title: string; timeline: string }) => Promise<DesignerGoalItem>
  onDismissAll: () => void
}

export function GoalSuggestionChips({ goals, onAdd, onDismissAll }: Props) {
  const [remaining, setRemaining] = useState<SuggestedGoal[]>(goals)
  const [adding, setAdding] = useState<string | null>(null)

  if (remaining.length === 0) return null

  async function handleAdd(goal: SuggestedGoal) {
    setAdding(goal.title)
    try {
      await onAdd({ title: goal.title, timeline: goal.timeline })
      setRemaining((prev) => prev.filter((g) => g.title !== goal.title))
    } finally {
      setAdding(null)
    }
  }

  function dismiss(title: string) {
    setRemaining((prev) => prev.filter((g) => g.title !== title))
  }

  return (
    <div className="mb-4 p-3 bg-violet-50 border border-violet-100 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-violet-700">Suggested goals from this plan:</p>
        <button onClick={onDismissAll} className="text-xs text-muted-foreground hover:text-foreground">
          Dismiss all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining.map((goal) => (
          <div
            key={goal.title}
            className="flex items-center gap-1 bg-white border border-violet-200 rounded-lg px-2 py-1 text-xs"
          >
            <button
              onClick={() => handleAdd(goal)}
              disabled={adding === goal.title}
              className="flex items-center gap-1 text-violet-700 hover:text-violet-900 disabled:opacity-50"
            >
              <Plus size={11} />
              {adding === goal.title ? "Adding…" : goal.title}
              {goal.timeline && <span className="text-muted-foreground">· {goal.timeline}</span>}
            </button>
            <button
              onClick={() => dismiss(goal.title)}
              className="text-muted-foreground hover:text-foreground ml-0.5"
              aria-label="Dismiss suggestion"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
