"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

interface Props {
  label: string
  onAsk: () => void
  onCopy: () => void
  className?: string
}

export function SplitButton({ label, onAsk, onCopy, className = "" }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }, [])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  function handleCopy() {
    onCopy()
    setCopied(true)
    setOpen(false)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={onAsk}
        className="text-xs px-3 py-1.5 bg-[#0071e3] hover:bg-blue-600 text-white rounded-l-md transition-colors font-medium whitespace-nowrap"
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        className="text-xs px-1.5 py-1.5 bg-[#0071e3] hover:bg-blue-600 text-white rounded-r-md border-l border-blue-400/50 transition-colors"
      >
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#d2d2d7] rounded-lg shadow-md z-20 min-w-[150px]">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full text-left text-xs px-3 py-2 hover:bg-slate-50 transition-colors text-[#494949] rounded-lg"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
      )}
    </div>
  )
}
