"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { ROLE_LEVELS, DREYFUS_LABELS, AVATAR_CLASSES } from "@/components/coaching/lib/coaching-framework"
import type { DesignerItem, PersonType } from "@/types"

export interface PersonFormData {
  name: string
  role: string
  personType: PersonType
  roleLevel: string
  dreyfusStage: string
  nextOneOnOne: string
  avatarClass: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PersonFormData) => Promise<void>
  person?: DesignerItem
  defaultPersonType?: PersonType
}

const DREYFUS_OPTIONS = Object.entries(DREYFUS_LABELS)

const AVATAR_BG: Record<string, string> = {
  "av-blue":   "#0071E3",
  "av-purple": "#7C3AED",
  "av-teal":   "#0D9488",
  "av-pink":   "#DB2777",
  "av-amber":  "#D97706",
  "av-green":  "#1D7A1D",
}

const PERSON_TYPE_OPTIONS: { value: PersonType; label: string }[] = [
  { value: "DIRECT",     label: "Direct Report" },
  { value: "LEADERSHIP", label: "Leader (reports to)" },
  { value: "PEER",       label: "Peer / Collaborator" },
]

function emptyForm(personType: PersonType): PersonFormData {
  return {
    name: "",
    role: "",
    personType,
    roleLevel: ROLE_LEVELS[0],
    dreyfusStage: "NOVICE",
    nextOneOnOne: "",
    avatarClass: "av-blue",
  }
}

function personToForm(d: DesignerItem): PersonFormData {
  return {
    name: d.name,
    role: d.role,
    personType: d.personType,
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

export function PersonModal({ isOpen, onClose, onSave, person, defaultPersonType = "DIRECT" }: Props) {
  const [form, setForm] = useState<PersonFormData>(emptyForm(defaultPersonType))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm(person ? personToForm(person) : emptyForm(defaultPersonType))
      setError(null)
      setSaving(false)
    }
  }, [isOpen, person, defaultPersonType])

  if (!isOpen) return null

  const isDirect = form.personType === "DIRECT"

  function set<K extends keyof PersonFormData>(key: K, value: PersonFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (!isDirect && !form.role.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch {
      setError("Something went wrong. Please try again.")
      setSaving(false)
    }
  }
  const isEditing = !!person
  const inputClass = "w-full text-sm px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
  const labelClass = "block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1d1d1f]">
            {isEditing ? "Edit team member" : "Add team member"}
          </h2>
          <button onClick={onClose} className="text-[#6e6e73] hover:text-[#1d1d1f]">
            <X size={16} />
          </button>
        </div>

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
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className={labelClass}>Type *</label>
            <select
              value={form.personType}
              onChange={(e) => set("personType", e.target.value as PersonType)}
              className={inputClass}
            >
              {PERSON_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Role — non-directs only */}
          {!isDirect && (
            <div>
              <label className={labelClass}>Role *</label>
              <input
                placeholder="e.g. VP of Design"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* Role Level — directs only */}
          {isDirect && (
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
          )}

          {/* Dreyfus Stage — directs only */}
          {isDirect && (
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
          )}

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
            disabled={saving || !form.name.trim() || (!isDirect && !form.role.trim())}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add member"}
          </button>
        </div>
      </div>
    </div>
  )
}
