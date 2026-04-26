"use client"

import { useState, useEffect } from "react"
import { ROLE_LEVELS, DREYFUS_LABELS, AVATAR_CLASSES } from "@/components/coaching/lib/coaching-framework"
import type { DesignerItem } from "@/types"

export interface DesignerFormData {
  name: string
  role: string
  roleLevel: string
  dreyfusStage: string
  nextOneOnOne: string
  avatarClass: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: DesignerFormData) => Promise<void>
  designer?: DesignerItem // undefined = add mode
}

const DREYFUS_OPTIONS = Object.entries(DREYFUS_LABELS)

function emptyForm(): DesignerFormData {
  return {
    name: "",
    role: "",
    roleLevel: ROLE_LEVELS[0],
    dreyfusStage: "NOVICE",
    nextOneOnOne: "",
    avatarClass: "av-blue",
  }
}

function designerToForm(d: DesignerItem): DesignerFormData {
  return {
    name: d.name,
    role: d.role,
    roleLevel: d.roleLevel,
    dreyfusStage: d.dreyfusStage ?? "NOVICE",
    nextOneOnOne: d.nextOneOnOne ?? "",
    avatarClass: d.avatarClass,
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_BG: Record<string, string> = {
  "av-blue":   "#0071E3",
  "av-purple": "#7C3AED",
  "av-teal":   "#0D9488",
  "av-pink":   "#DB2777",
  "av-amber":  "#D97706",
  "av-green":  "#1D7A1D",
}

export function DesignerModal({ isOpen, onClose, onSave, designer }: Props) {
  const [form, setForm] = useState<DesignerFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm(designer ? designerToForm(designer) : emptyForm())
      setError(null)
      setSaving(false)
    }
  }, [isOpen, designer])

  if (!isOpen) return null

  function set<K extends keyof DesignerFormData>(key: K, value: DesignerFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch {
      setError("Something went wrong. Please try again.")
      setSaving(false)
    }
  }

  const inputClass = "w-full text-sm px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
  const labelClass = "block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-[#1d1d1f] mb-5">
          {designer ? "Edit Designer" : "Add Designer"}
        </h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              placeholder="e.g. Alice Chen"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Role */}
          <div>
            <label className={labelClass}>Role *</label>
            <input
              placeholder="e.g. UX Designer"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Role Level */}
          <div>
            <label className={labelClass}>Role Level</label>
            <select
              value={form.roleLevel}
              onChange={(e) => set("roleLevel", e.target.value)}
              className={inputClass}
            >
              {ROLE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Dreyfus Stage */}
          <div>
            <label className={labelClass}>Dreyfus Stage</label>
            <select
              value={form.dreyfusStage}
              onChange={(e) => set("dreyfusStage", e.target.value)}
              className={inputClass}
            >
              {DREYFUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Next 1:1 */}
          <div>
            <label className={labelClass}>Next 1:1</label>
            <input
              type="date"
              value={form.nextOneOnOne}
              onChange={(e) => set("nextOneOnOne", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Avatar colour */}
          <div>
            <label className={labelClass}>Avatar Colour</label>
            <div className="flex gap-2 mt-1">
              {AVATAR_CLASSES.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => set("avatarClass", cls)}
                  className="w-8 h-8 rounded-full text-white text-[10px] font-bold flex items-center justify-center transition-all"
                  style={{
                    background: AVATAR_BG[cls],
                    outline: form.avatarClass === cls ? "3px solid #0071E3" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {form.name ? getInitials(form.name) : "?"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6e6e73] border border-[#d2d2d7] rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.role.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : designer ? "Save changes" : "Add designer"}
          </button>
        </div>
      </div>
    </div>
  )
}
