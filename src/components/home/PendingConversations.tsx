"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { type ConversationItem } from "@/types"

interface Props {
  initialConversations: ConversationItem[]
}

export function PendingConversations({ initialConversations }: Props) {
  const [conversations, setConversations] = useState(initialConversations)

  async function markDone(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "PATCH" })
      if (!res.ok) throw new Error()
      setConversations(prev => prev.filter(c => c.id !== id))
      toast.success("Conversation marked done")
    } catch {
      toast.error("Failed to update")
    }
  }

  if (conversations.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-800 mb-4">
        Pending Conversations
        <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {conversations.length}
        </span>
      </h2>
      <div className="space-y-2">
        {conversations.map(c => (
          <div key={c.id} className="flex items-start gap-3">
            <button
              onClick={() => markDone(c.id)}
              className="mt-0.5 text-slate-300 hover:text-green-500 transition-colors flex-shrink-0"
              aria-label="Mark as done"
            >
              <CheckCircle2 size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{c.topic}</p>
              <p className="text-xs text-slate-400">with {c.person}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
