"use client"

import { useState, useRef } from "react"
import { DesignerItem, DesignerSkillItem, DreyfusStage } from "@/types"
import { SKILL_LABELS, SKILL_GROUPS, ALL_SKILL_KEYS, tierLabel } from "@/components/coaching/lib/skills"
import { DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"

interface Props {
  designer: DesignerItem
  onDreyfusChange: (stage: DreyfusStage) => Promise<void>
  onSkillsSave: (skills: { skillName: string; value: number }[]) => Promise<void>
}

function buildSkillMap(skills: DesignerSkillItem[]): Record<string, number> {
  const map: Record<string, number> = {}
  ALL_SKILL_KEYS.forEach((key) => { map[key] = 0 })
  skills.forEach((s) => { map[s.skillName] = s.value })
  return map
}

const DREYFUS_OPTIONS = Object.entries(DREYFUS_LABELS) as [DreyfusStage, string][]

export function SkillsTab({ designer, onDreyfusChange, onSkillsSave }: Props) {
  const [skillValues, setSkillValues] = useState<Record<string, number>>(
    () => buildSkillMap(designer.skills)
  )
  const [savingDreyfus, setSavingDreyfus] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleDotClick(skillName: string, dot: number) {
    const newValues = { ...skillValues, [skillName]: dot === skillValues[skillName] ? 0 : dot }
    setSkillValues(newValues)
    const skills = ALL_SKILL_KEYS.map((key) => ({ skillName: key, value: newValues[key] }))
    await onSkillsSave(skills)
    setSaved(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => setSaved(false), 1500)
  }

  async function handleDreyfusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const stage = e.target.value as DreyfusStage
    setSavingDreyfus(true)
    try {
      await onDreyfusChange(stage)
    } finally {
      setSavingDreyfus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dreyfus stage selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap" htmlFor="dreyfus-select">
          Dreyfus Stage
        </label>
        <select
          id="dreyfus-select"
          value={designer.dreyfusStage ?? ""}
          onChange={handleDreyfusChange}
          disabled={savingDreyfus}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="" disabled>Select stage…</option>
          {DREYFUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {savingDreyfus && <span className="text-xs text-muted-foreground">Saving…</span>}
      </div>

      {/* Skill groups */}
      {Object.entries(SKILL_GROUPS).map(([groupName, keys]) => (
        <div key={groupName}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {groupName}
          </h3>
          <div className="space-y-3.5">
            {keys.map((key) => {
              const value = skillValues[key]
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-44 shrink-0">{SKILL_LABELS[key]}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((dot) => (
                      <button
                        key={dot}
                        type="button"
                        onClick={() => handleDotClick(key, dot)}
                        className={`w-5 h-5 rounded-full border transition-colors ${
                          dot <= value
                            ? "bg-blue-600 border-blue-600"
                            : "bg-slate-100 border-slate-200 hover:border-slate-400"
                        }`}
                        aria-label={`Set ${SKILL_LABELS[key]} to ${dot}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground w-24">{tierLabel(value)}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Auto-save indicator */}
      <div className="h-4">
        {saved && <span className="text-xs text-slate-400">Saved</span>}
      </div>
    </div>
  )
}
