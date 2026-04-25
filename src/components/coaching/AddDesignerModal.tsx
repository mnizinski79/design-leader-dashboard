"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DesignerItem } from "@/types"
import { ROLE_LEVELS, DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"

interface Props {
  onClose: () => void
  onCreated: (designer: DesignerItem) => void
}

const DREYFUS_OPTIONS = Object.entries(DREYFUS_LABELS) as [string, string][]

export function AddDesignerModal({ onClose, onCreated }: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [roleLevel, setRoleLevel] = useState(ROLE_LEVELS[0])
  const [dreyfusStage, setDreyfusStage] = useState<string>(DREYFUS_OPTIONS[0][0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/designers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role: role.trim(), roleLevel, dreyfusStage }),
      })
      if (!res.ok) {
        setError("Failed to create designer. Please try again.")
        return
      }
      const designer: DesignerItem = await res.json()
      onCreated(designer)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold">Add Designer</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="designer-name">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="designer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Alice Chen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="designer-role">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              id="designer-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. UX Designer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="designer-role-level">
              Role Level <span className="text-red-500">*</span>
            </label>
            <select
              id="designer-role-level"
              value={roleLevel}
              onChange={(e) => setRoleLevel(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="designer-dreyfus">
              Dreyfus Stage <span className="text-red-500">*</span>
            </label>
            <select
              id="designer-dreyfus"
              value={dreyfusStage}
              onChange={(e) => setDreyfusStage(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DREYFUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !role.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Designer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
