"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, BookmarkCheck } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "assistant" | "user"
  content: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  prompt: string | null
  contextLabel: string
  systemPrompt?: string
  onSave?: (text: string) => Promise<void>
}

export function ClaudePanel({ isOpen, onClose, prompt, contextLabel, systemPrompt, onSave }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!prompt) return
    const initial: Message = { role: "user", content: prompt }
    setMessages([initial])
    setError(null)
    setInput("")
    setSaving(false)
    sendToApi([initial])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendToApi(msgs: Message[]) {
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort
    setStreaming(true)
    setError(null)

    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, ...(systemPrompt && { systemPrompt }) }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Request failed")
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: "assistant",
              content: updated[updated.length - 1].content + chunk,
            }
            return updated
          })
        }
      } finally {
        reader.releaseLock()
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setMessages((prev) => prev.slice(0, -1))
        return
      }
      setMessages((prev) => prev.slice(0, -1))
      setError((e as Error).message || "Something went wrong. Try again.")
    } finally {
      setStreaming(false)
    }
  }

  function handleRetry() {
    if (!prompt) return
    const initial: Message = { role: "user", content: prompt }
    setMessages([initial])
    setError(null)
    sendToApi([initial])
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || streaming) return
    setInput("")
    const userMsg: Message = { role: "user", content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    await sendToApi(newMessages)
  }

  async function handleSavePlan() {
    if (!onSave || saving || streaming) return
    setSaving(true)
    setError(null)

    const finalizationMsg: Message = {
      role: "user",
      content: "Finalize the plan now using the four labeled sections: QUARTER FOCUS, DEVELOPMENT PRIORITIES, COACHING APPROACH, KEY MILESTONES.",
    }
    const msgsWithFinalization = [...messages, finalizationMsg]

    try {
      const res = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgsWithFinalization,
          ...(systemPrompt && { systemPrompt }),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Request failed")
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value, { stream: true })
        }
      } finally {
        reader.releaseLock()
      }

      await onSave(fullText)
    } catch (e) {
      setError((e as Error).message || "Failed to save plan. Try again.")
      setSaving(false)
    }
  }

  const visibleMessages = messages.slice(1)
  const hasChatStarted = visibleMessages.some((m) => m.role === "assistant" && m.content.length > 0)

  return (
    <div
      className={`fixed right-0 top-0 h-full w-[36rem] bg-white shadow-xl border-l border-[#e5e5ea] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-[#e5e5ea] shrink-0">
        <div>
          <div className="text-sm font-bold text-[#0071e3]">Claude</div>
          <div className="text-[11px] text-[#6e6e73] mt-0.5">{contextLabel}</div>
        </div>
        <button
          onClick={onClose}
          className="text-[#c7c7cc] hover:text-[#6e6e73] transition-colors mt-0.5"
          aria-label="Close Claude panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#e8f0fe] text-[#1d4ed8]"
                  : "bg-[#f0f0f5] text-[#1d1d1f]"
              }`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    h1: ({ children }) => <p className="font-bold mt-1 mb-0.5">{children}</p>,
                    h2: ({ children }) => <p className="font-bold mt-1 mb-0.5">{children}</p>,
                    h3: ({ children }) => <p className="font-semibold mt-1 mb-0.5">{children}</p>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
              {msg.role === "assistant" &&
                streaming &&
                i === visibleMessages.length - 1 && (
                  <span className="inline-block w-1.5 h-3.5 bg-[#0071e3] rounded-sm ml-0.5 animate-pulse align-middle" />
                )}
            </div>
          </div>
        ))}

        {error && (
          <div className="text-[12px] text-[#d70015] bg-[#fff5f5] border border-[#fecaca] rounded-lg px-3 py-2">
            {error.includes("API key not set") ? (
              <>
                <p className="font-medium">Claude is not configured.</p>
                <p className="mt-1 text-[#6e6e73]">
                  Add your Anthropic API key to <code className="bg-slate-100 text-slate-700 px-1 rounded">.env.local</code>:
                </p>
                <code className="block mt-1.5 bg-slate-100 text-slate-700 px-2 py-1 rounded text-[11px] break-all">
                  ANTHROPIC_API_KEY=sk-ant-...
                </code>
                <p className="mt-1.5 text-[#6e6e73]">Then restart the dev server.</p>
              </>
            ) : (
              <>
                {error}
                <button
                  onClick={handleRetry}
                  className="block text-[#0071e3] mt-1 hover:underline text-[11px]"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Save as Plan button — only shown for plan panel once chat has started */}
      {onSave && hasChatStarted && (
        <div className="px-3 pt-2 pb-0 shrink-0">
          <button
            onClick={handleSavePlan}
            disabled={saving || streaming}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 transition-colors disabled:opacity-50"
          >
            <BookmarkCheck size={14} />
            {saving ? "Saving plan…" : "Save as Plan"}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#e5e5ea] shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={streaming || saving}
            placeholder={streaming ? "Claude is responding…" : saving ? "Saving plan…" : "Reply to Claude…"}
            rows={1}
            className="flex-1 text-[13px] border border-[#d2d2d7] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none disabled:opacity-50 disabled:bg-slate-50"
          />
          <button
            onClick={handleSend}
            disabled={streaming || saving || !input.trim()}
            aria-label="Send"
            className="bg-blue-600 text-white rounded-xl p-2 hover:bg-blue-700 transition-colors disabled:opacity-40 shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
