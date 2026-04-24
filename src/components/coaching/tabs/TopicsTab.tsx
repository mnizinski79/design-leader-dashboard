"use client"

import { useState } from "react"
import { DesignerItem, DesignerTopicItem } from "@/types"
import { DREYFUS_DESCRIPTIONS } from "@/components/coaching/lib/coaching-framework"

interface Props {
  designer: DesignerItem
  onTopicAdd: (title: string) => Promise<DesignerTopicItem>
  onTopicToggle: (topicId: string, discussed: boolean) => Promise<void>
  onTopicDelete: (topicId: string) => Promise<void>
}

export function TopicsTab({ designer, onTopicAdd, onTopicToggle, onTopicDelete }: Props) {
  const [topics, setTopics] = useState<DesignerTopicItem[]>(designer.topics)
  const [newTitle, setNewTitle] = useState("")
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const topic = await onTopicAdd(newTitle.trim())
      setTopics((prev) => [...prev, topic])
      setNewTitle("")
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(topicId: string, current: boolean) {
    const newVal = !current
    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, discussed: newVal } : t))
    await onTopicToggle(topicId, newVal)
  }

  async function handleDelete(topicId: string) {
    await onTopicDelete(topicId)
    setTopics((prev) => prev.filter((t) => t.id !== topicId))
  }

  function copyPrompt() {
    const stageDesc = designer.dreyfusStage
      ? DREYFUS_DESCRIPTIONS[designer.dreyfusStage]
      : "No stage set"

    const openTopics = topics.filter((t) => !t.discussed)
    const topicList = openTopics.length
      ? openTopics.map((t) => `- ${t.title}`).join("\n")
      : "No open topics currently."

    const prompt = `Designer: ${designer.name}, ${designer.role} (${designer.roleLevel})
Dreyfus Stage: ${designer.dreyfusStage ?? "Not set"} — ${stageDesc}

Open 1:1 Topics:
${topicList}

Please generate 6 tailored coaching questions for my next 1:1 with ${designer.name}. The questions should be appropriate for a ${designer.dreyfusStage ?? "designer"} on the Dreyfus scale and address the open topics listed above.`

    navigator.clipboard.writeText(prompt).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">1:1 Topics</h3>
        <button
          type="button"
          onClick={copyPrompt}
          className="text-xs px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
        >
          {copied ? "Copied!" : "Copy Coaching Questions"}
        </button>
      </div>

      {/* Add topic */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a topic…"
          className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Topic list */}
      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No topics yet.</p>
      )}
      <div className="space-y-1">
        {topics.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-md border ${
              t.discussed ? "bg-muted/30 border-muted" : "border-border"
            }`}
          >
            <input
              type="checkbox"
              checked={t.discussed}
              onChange={() => handleToggle(t.id, t.discussed)}
              className="w-4 h-4 rounded"
              aria-label={`Mark "${t.title}" as discussed`}
            />
            <span className={`flex-1 text-sm ${t.discussed ? "line-through text-muted-foreground" : ""}`}>
              {t.title}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(t.id)}
              className="text-muted-foreground hover:text-red-600 transition-colors text-xs"
              aria-label={`Delete topic: ${t.title}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
