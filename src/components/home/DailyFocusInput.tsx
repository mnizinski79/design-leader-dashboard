"use client"

import { useState } from "react"
import { toast } from "sonner"
import { type DailyFocusItem } from "@/types"

interface Props {
  initialFocus: DailyFocusItem | null
}

export function DailyFocusInput({ initialFocus }: Props) {
  const [text, setText] = useState(initialFocus?.text ?? "")
  const [saving, setSaving] = useState(false)

  async function save(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const res = await fetch("/api/daily-focus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Failed to save focus")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
      <span className="text-xl flex-shrink-0">🎯</span>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={e => save(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        placeholder="What's your focus for today?"
        className="flex-1 bg-transparent text-slate-800 font-medium placeholder:text-blue-300 outline-none text-sm"
      />
      {saving && <span className="text-xs text-blue-400 flex-shrink-0">Saving…</span>}
    </div>
  )
}
