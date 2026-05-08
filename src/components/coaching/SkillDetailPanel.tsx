"use client"

import { X } from "lucide-react"
import { SKILL_LABELS, SKILL_DETAILS, TIER_DEFINITIONS, tierLabel } from "@/components/coaching/lib/skills"

interface Props {
  skillKey: string | null
  value: number
  onClose: () => void
}

const TIER_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  base:     { bg: "bg-slate-100",  text: "text-slate-700",  dot: "bg-slate-400" },
  advanced: { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  expert:   { bg: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-500" },
}

export function SkillDetailPanel({ skillKey, value, onClose }: Props) {
  const isOpen = skillKey !== null
  const detail = skillKey ? SKILL_DETAILS[skillKey] : null
  const label = skillKey ? SKILL_LABELS[skillKey] : ""
  const currentTier = value === 0 ? null : value <= 3 ? "base" : value <= 6 ? "advanced" : "expert"

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[26rem] bg-white shadow-xl border-l border-[#e5e5ea] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#f0f0f5] shrink-0">
          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-0.5">
              {detail?.group}
            </p>
            <h2 className="text-base font-bold text-[#1d1d1f]">{label}</h2>
            {currentTier && (
              <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${TIER_COLORS[currentTier].bg} ${TIER_COLORS[currentTier].text}`}>
                {tierLabel(value)} · {value}/9
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#6e6e73] hover:text-[#1d1d1f] mt-0.5 shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Tier definitions */}
          <div>
            <h3 className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-3">
              Capability Levels
            </h3>
            <div className="space-y-3">
              {TIER_DEFINITIONS.map((tier) => {
                const colors = TIER_COLORS[tier.key]
                const isActive = currentTier === tier.key
                return (
                  <div
                    key={tier.key}
                    className={`rounded-xl p-3.5 border transition-all ${
                      isActive
                        ? `${colors.bg} border-current ${colors.text}`
                        : "bg-[#fafafa] border-[#f0f0f5]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${isActive ? colors.dot : "bg-slate-300"}`} />
                      <span className={`text-[12px] font-bold ${isActive ? colors.text : "text-[#1d1d1f]"}`}>
                        {tier.label}
                      </span>
                      <span className="text-[11px] text-[#6e6e73] ml-auto">{tier.range}</span>
                    </div>
                    <ul className="space-y-1 pl-4">
                      {tier.traits.map((t) => (
                        <li key={t} className={`text-[12px] leading-snug ${isActive ? colors.text : "text-[#494949]"}`}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sub-skills */}
          {detail && (
            <div>
              <h3 className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-3">
                Skills in this area
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.subSkills.map((s) => (
                  <span
                    key={s}
                    className="text-[12px] px-2.5 py-1 bg-[#f5f5f7] text-[#1d1d1f] rounded-full border border-[#e5e5ea]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
