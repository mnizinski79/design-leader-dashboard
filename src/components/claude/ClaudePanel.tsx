"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send } from "lucide-react"
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
}

export function ClaudePanel({ isOpen, onClose, prompt, contextLabel }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // When a new prompt arrives, reset conversation and send it
  useEffect(() => {
    if (!prompt) return
    const initial: Message = { role: "user", content: prompt }
    setMessages([initial])
    setError(null)
    setInput("")
    sendToApi([initial])
  // sendToApi is intentionally excluded: it is redefined each render and including
  // it would cause an infinite loop. prompt is the only meaningful dependency.
  }, [prompt]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendToApi(msgs: Message[]) {
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort
    setStreaming(true)
    setError(null)

    // Append empty placeholder for the incoming Claude message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
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
        setMessages((prev) => prev.slice(0, -1)) // remove empty placeholder on abort
        return
      }
      setMessages((prev) => prev.slice(0, -1)) // remove empty placeholder on error
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

  // messages[0] is the hidden initial prompt — skip it when rendering
  const visibleMessages = messages.slice(1)

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-[#e5e5ea] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
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
            {error}
            <button
              onClick={handleRetry}
              className="block text-[#0071e3] mt-1 hover:underline text-[11px]"
            >
              Retry
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
            disabled={streaming}
            placeholder={streaming ? "Claude is responding…" : "Reply to Claude…"}
            rows={1}
            className="flex-1 text-[13px] border border-[#d2d2d7] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none disabled:opacity-50 disabled:bg-slate-50"
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
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
