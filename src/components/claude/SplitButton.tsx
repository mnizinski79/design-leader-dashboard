"use client"

import { useState, useRef, useEffect } from "react"
import { Copy } from "lucide-react"

interface Props {
  label: string
  onAsk: () => void
  onCopy: () => void
  className?: string
}

interface TooltipPos { x: number; y: number }

export function SplitButton({ label, onAsk, onCopy, className = "" }: Props) {
  const [tooltip, setTooltip] = useState<TooltipPos | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }, [])

  function handleCopy(e: React.MouseEvent) {
    onCopy()
    setTooltip({ x: e.clientX, y: e.clientY })
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setTooltip(null), 1500)
  }

  return (
    <>
      <div className={`relative inline-flex ${className}`}>
        <button
          type="button"
          onClick={onAsk}
          className="text-xs px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-l-md transition-colors font-medium whitespace-nowrap"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy to clipboard"
          className="text-xs px-1.5 py-1.5 border border-l-0 border-slate-300 hover:bg-slate-100 text-slate-600 rounded-r-md transition-colors"
        >
          <Copy size={12} />
        </button>
      </div>
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none text-[11px] font-medium bg-slate-800 text-white px-2 py-1 rounded-md shadow-md animate-fade-in"
          style={{ left: tooltip.x + 10, top: tooltip.y - 28 }}
        >
          Copied
        </div>
      )}
    </>
  )
}
