"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, GripVertical } from "lucide-react"
import { DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"
import { DesignerModal, type DesignerFormData } from "@/components/team/DesignerModal"
import type { DesignerItem } from "@/types"

interface Props {
  initialDesigners: DesignerItem[]
}

const AVATAR_BG: Record<string, string> = {
  "av-blue":   "#0071E3",
  "av-purple": "#7C3AED",
  "av-teal":   "#0D9488",
  "av-pink":   "#DB2777",
  "av-amber":  "#D97706",
  "av-green":  "#1D7A1D",
}

function getInitials(name: string) {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function TeamPageClient({ initialDesigners }: Props) {
  const router = useRouter()
  const [designers, setDesigners] = useState<DesignerItem[]>(initialDesigners)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DesignerItem | undefined>(undefined)

  // Drag-to-reorder state
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleSave(data: DesignerFormData) {
    if (editing) {
      const res = await fetch(`/api/designers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          role: data.role.trim(),
          roleLevel: data.roleLevel,
          dreyfusStage: data.dreyfusStage || null,
          nextOneOnOne: data.nextOneOnOne || null,
          avatarClass: data.avatarClass,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const updated: DesignerItem = await res.json()
      setDesigners((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    } else {
      const res = await fetch("/api/designers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          role: data.role.trim(),
          roleLevel: data.roleLevel,
          dreyfusStage: data.dreyfusStage || undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const created: DesignerItem = await res.json()
      // After create, immediately patch the avatar/nextOneOnOne if set
      let final = created
      if (data.avatarClass !== created.avatarClass || data.nextOneOnOne) {
        const patch = await fetch(`/api/designers/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            avatarClass: data.avatarClass,
            nextOneOnOne: data.nextOneOnOne || null,
          }),
        })
        if (patch.ok) final = await patch.json()
      }
      setDesigners((prev) => [...prev, final])
    }
    setModalOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const designer = designers.find((d) => d.id === id)
    if (!designer) return
    if (!window.confirm(`Remove ${designer.name} from your team? This will delete all their coaching data.`)) return

    const res = await fetch(`/api/designers/${id}`, { method: "DELETE" })
    if (res.ok) {
      setDesigners((prev) => prev.filter((d) => d.id !== id))
      router.refresh()
    }
  }

  function openAdd() {
    setEditing(undefined)
    setModalOpen(true)
  }

  function openEdit(d: DesignerItem) {
    setEditing(d)
    setModalOpen(true)
  }

  // ── Drag to reorder ──────────────────────────────────────────────────────

  function onDragStart(index: number) {
    dragIndex.current = index
  }

  function onDragEnter(index: number) {
    setDragOver(index)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function onDrop(dropIndex: number) {
    const from = dragIndex.current
    if (from === null || from === dropIndex) {
      dragIndex.current = null
      setDragOver(null)
      return
    }

    const reordered = [...designers]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(dropIndex, 0, moved)
    setDesigners(reordered)
    dragIndex.current = null
    setDragOver(null)

    await fetch("/api/designers/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((d) => d.id) }),
    })
  }

  function onDragEnd() {
    dragIndex.current = null
    setDragOver(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto pb-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">My Team</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">
            {designers.length} designer{designers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add designer
        </button>
      </div>

      {/* Empty state */}
      {designers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[#6e6e73]">
          <Users size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No designers yet — add one to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[32px_1fr_1fr_140px_100px_60px_120px] gap-0 border-b border-[#f0f0f5] px-4 py-3">
            <div />
            {["Designer", "Role", "Dreyfus Stage", "Next 1:1", "Sessions", ""].map((h) => (
              <div key={h} className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-[0.07em]">
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {designers.map((d, index) => (
            <div
              key={d.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragEnter={() => onDragEnter(index)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(index)}
              onDragEnd={onDragEnd}
              className={[
                "grid grid-cols-[32px_1fr_1fr_140px_100px_60px_120px] gap-0 items-center px-4 py-3 transition-colors",
                index < designers.length - 1 ? "border-b border-[#f0f0f5]" : "",
                dragOver === index ? "bg-blue-50" : "hover:bg-slate-50",
              ].join(" ")}
            >
              {/* Drag handle */}
              <div className="text-[#c7c7cc] cursor-grab select-none flex justify-center" title="Drag to reorder">
                <GripVertical size={16} />
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: AVATAR_BG[d.avatarClass] ?? "#0071E3" }}
                >
                  {getInitials(d.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">{d.name}</p>
                  <p className="text-[11px] text-[#6e6e73] truncate">{d.roleLevel}</p>
                </div>
              </div>

              {/* Role */}
              <div className="text-[13px] text-[#494949] truncate pr-2">{d.role}</div>

              {/* Dreyfus stage */}
              <div className="text-[13px] text-[#494949]">
                {d.dreyfusStage ? (DREYFUS_LABELS[d.dreyfusStage] ?? d.dreyfusStage) : (
                  <span className="text-[#c7c7cc]">—</span>
                )}
              </div>

              {/* Next 1:1 */}
              <div className="text-[13px] text-[#6e6e73]">
                {d.nextOneOnOne ?? <span className="text-[#c7c7cc]">—</span>}
              </div>

              {/* Session count */}
              <div className="text-[13px] text-[#6e6e73]">{d.sessions.length}</div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <Link
                  href={`/coaching?designer=${d.id}`}
                  className="text-[11px] px-2.5 py-1 border border-[#f0f0f5] rounded-lg text-[#6e6e73] hover:bg-slate-50 whitespace-nowrap"
                >
                  1:1 →
                </Link>
                <button
                  onClick={() => openEdit(d)}
                  className="text-[11px] px-2.5 py-1 border border-[#f0f0f5] rounded-lg text-[#6e6e73] hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-[11px] px-2.5 py-1 border border-[#FFDAD9] rounded-lg text-[#D70015] bg-[#FFF5F5] hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DesignerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        designer={editing}
      />
    </div>
  )
}
