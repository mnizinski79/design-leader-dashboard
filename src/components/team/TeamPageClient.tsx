"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, GripVertical } from "lucide-react"
import { DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"
import { PersonModal, type PersonFormData } from "@/components/people/PersonModal"
import type { DesignerItem, PersonType } from "@/types"

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

const SECTION_CONFIG: { type: PersonType; label: string; addLabel: string; empty: string }[] = [
  { type: "DIRECT",     label: "My Directs", addLabel: "Add direct",  empty: "No direct reports yet — add one to get started" },
  { type: "LEADERSHIP", label: "Leadership",  addLabel: "Add leader",  empty: "No leadership added yet" },
  { type: "PEER",       label: "Peers",       addLabel: "Add peer",    empty: "No peers added yet" },
]

function TeamSection({
  config,
  people,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: {
  config: typeof SECTION_CONFIG[number]
  people: DesignerItem[]
  onAdd: (type: PersonType) => void
  onEdit: (person: DesignerItem) => void
  onDelete: (id: string) => void
  onReorder: (reordered: DesignerItem[]) => void
}) {
  const isDirect = config.type === "DIRECT"
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function onDrop(dropIndex: number) {
    const from = dragIndex.current
    dragIndex.current = null
    setDragOver(null)
    if (from === null || from === dropIndex) return
    const reordered = [...people]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(dropIndex, 0, moved)
    onReorder(reordered)
  }

  const gridCols = isDirect
    ? "grid-cols-[32px_1fr_1fr_140px_100px_60px_120px]"
    : "grid-cols-[32px_1fr_1fr_100px_60px_120px]"

  const headers = isDirect
    ? ["Designer", "Role", "Dreyfus Stage", "Next 1:1", "Sessions", ""]
    : ["Name", "Role", "Next 1:1", "Sessions", ""]

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#1d1d1f]">{config.label}</h2>
        <button
          onClick={() => onAdd(config.type)}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          + {config.addLabel}
        </button>
      </div>

      {people.length === 0 ? (
        <div className="flex items-center justify-center h-14 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-[#6e6e73] text-sm gap-2">
          <Users size={14} className="opacity-40" />
          {config.empty}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className={`grid ${gridCols} gap-0 border-b border-[#f0f0f5] px-4 py-3`}>
            <div />
            {headers.map((h) => (
              <div key={h} className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-[0.07em]">
                {h}
              </div>
            ))}
          </div>

          {people.map((d, index) => (
            <div
              key={d.id}
              draggable
              onDragStart={() => { dragIndex.current = index }}
              onDragEnter={() => setDragOver(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              onDragEnd={() => { dragIndex.current = null; setDragOver(null) }}
              className={[
                `grid ${gridCols} gap-0 items-center px-4 py-3 transition-colors`,
                index < people.length - 1 ? "border-b border-[#f0f0f5]" : "",
                dragOver === index ? "bg-blue-50" : "hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="text-[#c7c7cc] cursor-grab select-none flex justify-center">
                <GripVertical size={16} />
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: AVATAR_BG[d.avatarClass] ?? "#0071E3" }}
                >
                  {getInitials(d.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">{d.name}</p>
                  {isDirect && d.roleLevel && (
                    <p className="text-[11px] text-[#6e6e73] truncate">{d.roleLevel}</p>
                  )}
                </div>
              </div>

              <div className="text-[13px] text-[#494949] truncate pr-2">{d.role}</div>

              {isDirect && (
                <div className="text-[13px] text-[#494949]">
                  {d.dreyfusStage ? (DREYFUS_LABELS[d.dreyfusStage] ?? d.dreyfusStage) : (
                    <span className="text-[#c7c7cc]">—</span>
                  )}
                </div>
              )}

              <div className="text-[13px] text-[#6e6e73]">
                {d.nextOneOnOne ?? <span className="text-[#c7c7cc]">—</span>}
              </div>

              <div className="text-[13px] text-[#6e6e73]">{d.sessions.length}</div>

              <div className="flex items-center gap-2 justify-end">
                <Link
                  href={`/coaching?designer=${d.id}`}
                  className="text-[11px] px-2.5 py-1 border border-[#f0f0f5] rounded-lg text-[#6e6e73] hover:bg-slate-50 whitespace-nowrap"
                >
                  1:1 →
                </Link>
                <button
                  onClick={() => onEdit(d)}
                  className="text-[11px] px-2.5 py-1 border border-[#f0f0f5] rounded-lg text-[#6e6e73] hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(d.id)}
                  className="text-[11px] px-2.5 py-1 border border-[#FFDAD9] rounded-lg text-[#D70015] bg-[#FFF5F5] hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function TeamPageClient({ initialDesigners }: Props) {
  const router = useRouter()
  const [designers, setDesigners] = useState<DesignerItem[]>(initialDesigners)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DesignerItem | undefined>(undefined)
  const [defaultPersonType, setDefaultPersonType] = useState<PersonType>("DIRECT")

  const directs    = designers.filter((d) => d.personType === "DIRECT")
  const leadership = designers.filter((d) => d.personType === "LEADERSHIP")
  const peers      = designers.filter((d) => d.personType === "PEER")

  async function handleSave(data: PersonFormData) {
    if (editing) {
      const res = await fetch(`/api/designers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          role: data.role.trim(),
          personType: data.personType,
          roleLevel: data.roleLevel,
          dreyfusStage: data.personType === "DIRECT" ? (data.dreyfusStage || null) : null,
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
          personType: data.personType,
          roleLevel: data.roleLevel,
          dreyfusStage: data.personType === "DIRECT" ? (data.dreyfusStage || null) : null,
          nextOneOnOne: data.nextOneOnOne || null,
          avatarClass: data.avatarClass,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const created: DesignerItem = await res.json()
      setDesigners((prev) => [...prev, created])
    }
    setModalOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const person = designers.find((d) => d.id === id)
    if (!person) return
    if (!window.confirm(`Remove ${person.name}? This will delete all their data.`)) return
    const res = await fetch(`/api/designers/${id}`, { method: "DELETE" })
    if (res.ok) {
      setDesigners((prev) => prev.filter((d) => d.id !== id))
      router.refresh()
    }
  }

  async function handleReorder(reordered: DesignerItem[], type: PersonType) {
    // Optimistically update the local state for this section while keeping other sections
    setDesigners((prev) => {
      const others = prev.filter((d) => d.personType !== type)
      return [...others, ...reordered]
    })
    await fetch("/api/designers/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((d) => d.id) }),
    })
  }

  function openAdd(type: PersonType) {
    setEditing(undefined)
    setDefaultPersonType(type)
    setModalOpen(true)
  }

  function openEdit(d: DesignerItem) {
    setEditing(d)
    setDefaultPersonType(d.personType)
    setModalOpen(true)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d1d1f]">My Team</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">
          {designers.length} person{designers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {SECTION_CONFIG.map((cfg) => {
        const people =
          cfg.type === "DIRECT" ? directs :
          cfg.type === "LEADERSHIP" ? leadership : peers
        return (
          <TeamSection
            key={cfg.type}
            config={cfg}
            people={people}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={handleDelete}
            onReorder={(reordered) => handleReorder(reordered, cfg.type)}
          />
        )
      })}

      <PersonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        person={editing}
        defaultPersonType={defaultPersonType}
      />
    </div>
  )
}
